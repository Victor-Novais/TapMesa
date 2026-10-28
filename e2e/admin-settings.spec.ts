import {
  test,
  expect,
  request as playwrightRequest,
  type APIRequestContext,
  type Browser,
  type Page,
} from "@playwright/test";

/**
 * Configurações do restaurante exclusivas do ADMIN
 * (docs/api/FRONTEND_MIGRATION_ADMIN_SETTINGS.md, seção 7).
 * Roda contra a API real; os dados de apoio são criados direto na API.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "Admin@123456";

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
const FILE_URL = /\/api\/v1\/files\/[0-9a-f-]{36}\.png$/;

// Rotas que a conta do restaurante não pode mais chamar
const OWNER_FORBIDDEN_CALL =
  /\/api\/v1\/(settings|restaurant\/notifications)\//;

interface SeedRestaurant {
  id: string;
  name: string;
  ownerUsername: string;
  ownerPassword: string;
  tableToken: string;
}

async function apiLogin(
  api: APIRequestContext,
  username: string,
  password: string,
): Promise<string> {
  const res = await api.post("auth/login", { data: { username, password } });
  expect(res.ok(), `login de ${username}`).toBe(true);
  return (await res.json()).accessToken;
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

async function seedRestaurant(
  api: APIRequestContext,
  adminToken: string,
  label: string,
): Promise<SeedRestaurant> {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  const name = `${label} ${suffix}`;
  const ownerUsername = `dono_cfg_${suffix}`;
  const created = await (
    await api.post("admin/restaurants", {
      headers: auth(adminToken),
      data: { name, ownerUsername },
    })
  ).json();
  const ownerToken = await apiLogin(
    api,
    ownerUsername,
    created.ownerPasswordPlain,
  );
  const tablesRes = await api.post("tables", {
    headers: auth(ownerToken),
    data: { startNumber: 1, count: 1 },
  });
  expect(tablesRes.status()).toBe(201);
  const [table] = await tablesRes.json();
  return {
    id: created.restaurantId,
    name,
    ownerUsername,
    ownerPassword: created.ownerPasswordPlain,
    tableToken: table.token,
  };
}

async function uiLogin(
  browser: Browser,
  username: string,
  password: string,
  landing: string,
): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/login");
  await page.locator("#login-username").fill(username);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await page.waitForURL(landing);
  return page;
}

const settingsPath = (id: string) => `/admin/restaurants/${id}/settings`;

function decodeJwtClaims(authorization: string): Record<string, unknown> {
  const payload = authorization.replace(/^Bearer /, "").split(".")[1] ?? "";
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

test.describe.serial("Configurações do restaurante no portal admin", () => {
  let api: APIRequestContext;
  let adminToken: string;
  let restaurantX: SeedRestaurant;
  let restaurantY: SeedRestaurant;

  test.describe.configure({ timeout: 120_000 });

  test.beforeAll(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop",
      "Fluxo de dados: roda uma vez, no viewport desktop",
    );
    api = await playwrightRequest.newContext({ baseURL: `${API_URL}/` });
    adminToken = await apiLogin(api, ADMIN_USERNAME, ADMIN_PASSWORD);
    restaurantX = await seedRestaurant(api, adminToken, "Config X");
    restaurantY = await seedRestaurant(api, adminToken, "Config Y");
  });

  test.afterAll(async () => {
    await api?.dispose();
  });

  test("owner: sem menu de configurações, redirect e nenhuma chamada às rotas antigas", async ({
    browser,
  }) => {
    const page = await uiLogin(
      browser,
      restaurantX.ownerUsername,
      restaurantX.ownerPassword,
      "**/dashboard**",
    );
    const forbiddenCalls: string[] = [];
    page.on("request", (req) => {
      if (!OWNER_FORBIDDEN_CALL.test(req.url())) return;
      // Única exceção à regra R1: as métricas leem fuso e virada do dia em
      // GET /settings/service até o back expor esses campos em /restaurant/current
      if (req.method() === "GET" && req.url().endsWith("/settings/service"))
        return;
      forbiddenCalls.push(`${req.method()} ${req.url()}`);
    });

    await expect(
      page.getByRole("navigation").getByRole("link", { name: /Configurações/ }),
    ).toHaveCount(0);

    await page.goto("/dashboard/settings?tab=appearance");
    await page.waitForURL(/\/dashboard(\?.*)?$/);

    for (const path of [
      "/dashboard",
      "/dashboard/tables",
      "/dashboard/tables/print",
      "/dashboard/team",
      "/dashboard/analytics",
    ]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
    }
    expect(forbiddenCalls).toEqual([]);
    await page.context().close();
  });

  test("admin: ação na lista, cabeçalho, abas, SLA persistido e cache por restaurante", async ({
    browser,
  }) => {
    const page = await uiLogin(
      browser,
      ADMIN_USERNAME,
      ADMIN_PASSWORD,
      "**/admin",
    );

    const linkX = page.locator(`a[href="${settingsPath(restaurantX.id)}"]`);
    await expect(linkX).toHaveText("Configurações", { timeout: 15_000 });
    await expect(
      page.locator(`a[href="${settingsPath(restaurantY.id)}"]`),
    ).toHaveText("Configurações");

    await linkX.click();
    await page.waitForURL(`**${settingsPath(restaurantX.id)}`);
    await expect(
      page.getByRole("heading", {
        name: `Configurações — ${restaurantX.name}`,
      }),
    ).toBeVisible({ timeout: 15_000 });

    // As 3 abas carregam
    await expect(page.locator("#alertSec")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("tab", { name: "Identidade visual" }).click();
    await expect(page.locator("#name")).toHaveValue(restaurantX.name);
    await page.getByRole("tab", { name: "E-mails e alertas" }).click();
    await expect(page.locator("#emailSummaryEnabled")).toBeVisible();

    // SLA salvo persiste após recarregar
    await page.getByRole("tab", { name: "Atendimento e SLA" }).click();
    await page.locator("#alertSec").fill("120");
    const putService = page.waitForResponse(
      (res) =>
        res.request().method() === "PUT" &&
        res
          .url()
          .endsWith(`/admin/restaurants/${restaurantX.id}/settings/service`),
    );
    await page.getByRole("button", { name: "Salvar Alterações" }).click();
    expect((await putService).status()).toBe(200);
    await page.reload();
    await expect(page.locator("#alertSec")).toHaveValue("120", {
      timeout: 15_000,
    });

    // X -> Y: nada do cache de X aparece em Y
    await page.goto(`${settingsPath(restaurantX.id)}?tab=appearance`);
    await expect(page.locator("#name")).toHaveValue(restaurantX.name, {
      timeout: 15_000,
    });
    await page.goto(`${settingsPath(restaurantY.id)}?tab=appearance`);
    await expect(page.locator("#name")).toHaveValue(restaurantY.name, {
      timeout: 15_000,
    });
    await page.getByRole("tab", { name: "Atendimento e SLA" }).click();
    await expect(page.locator("#alertSec")).not.toHaveValue("120");

    await page.context().close();
  });

  test("admin: aparência reflete na mesa, uploads, limite de 2 MB e restaurar padrão", async ({
    browser,
  }) => {
    const page = await uiLogin(
      browser,
      ADMIN_USERNAME,
      ADMIN_PASSWORD,
      "**/admin",
    );
    await page.goto(`${settingsPath(restaurantX.id)}?tab=appearance`);
    await expect(page.locator("#name")).toHaveValue(restaurantX.name, {
      timeout: 15_000,
    });

    // Cores e textos
    const customButton = `Chamar equipe ${Date.now().toString(36)}`;
    await page.locator("#callWaiterButton").fill(customButton);
    await page
      .getByLabel("Cor Primária (Botões de Ação)", { exact: true })
      .fill("#1D4ED8");
    await page.getByRole("button", { name: "Salvar Alterações" }).click();
    await expect(page.getByText("Aparência salva").first()).toBeVisible({
      timeout: 10_000,
    });

    const customerContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const customerPage = await customerContext.newPage();
    const publicTable = customerPage.waitForResponse((res) =>
      res.url().endsWith(`/public/tables/${restaurantX.tableToken}`),
    );
    await customerPage.goto(`/m/${restaurantX.tableToken}`);
    const served = await (await publicTable).json();
    expect(served.appearance.colors.primary.toLowerCase()).toBe("#1d4ed8");
    await expect(
      customerPage.getByRole("button", { name: customButton }),
    ).toBeVisible({ timeout: 15_000 });

    // Upload de logo: a prévia passa a usar a URL do servidor
    const fileInputs = page.locator('input[type="file"]');
    const logoResponse = page.waitForResponse(
      (res) =>
        res.request().method() === "POST" &&
        res
          .url()
          .endsWith(
            `/admin/restaurants/${restaurantX.id}/settings/appearance/logo`,
          ),
    );
    await fileInputs.first().setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: PNG_1PX,
    });
    const logoRes = await logoResponse;
    expect(logoRes.status()).toBe(200);
    const logoUrl: string = (await logoRes.json()).logoUrl;
    expect(logoUrl).toMatch(FILE_URL);
    await expect(
      page.locator('img[alt="Logo do Restaurante"]'),
    ).toHaveAttribute("src", logoUrl, { timeout: 10_000 });

    // Upload de fundo
    await page.getByRole("button", { name: "Foto Própria" }).click();
    const bgResponse = page.waitForResponse(
      (res) =>
        res.request().method() === "POST" &&
        res
          .url()
          .endsWith(
            `/admin/restaurants/${restaurantX.id}/settings/appearance/background`,
          ),
    );
    await fileInputs.nth(1).setInputFiles({
      name: "fundo.png",
      mimeType: "image/png",
      buffer: PNG_1PX,
    });
    const bgRes = await bgResponse;
    expect(bgRes.status()).toBe(200);
    expect((await bgRes.json()).backgroundValue).toMatch(FILE_URL);

    // Acima de 2 MB: erro sem chamar a API
    const uploads: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/settings/appearance/logo"))
        uploads.push(req.url());
    });
    await fileInputs.first().setInputFiles({
      name: "grande.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(3 * 1024 * 1024, 1),
    });
    await expect(page.getByText("Arquivo muito grande").first()).toBeVisible();
    expect(uploads).toEqual([]);

    // Restaurar padrão pede confirmação
    await page.getByRole("button", { name: "Restaurar Padrão" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const resetResponse = page.waitForResponse(
      (res) =>
        res.request().method() === "POST" &&
        res
          .url()
          .endsWith(
            `/admin/restaurants/${restaurantX.id}/settings/appearance/reset`,
          ),
    );
    await dialog.getByRole("button", { name: "Restaurar Padrão" }).click();
    const reset = await (await resetResponse).json();
    expect(reset.texts.callWaiterButton).not.toBe(customButton);
    await expect(page.getByText("Padrão restaurado").first()).toBeVisible();
    await expect(page.locator("#callWaiterButton")).toHaveValue(
      reset.texts.callWaiterButton,
    );

    await customerContext.close();
    await page.context().close();
  });

  test("admin: notificações salvam e o resumo de teste trata SUMMARY_EMAIL_DISABLED", async ({
    browser,
  }) => {
    const page = await uiLogin(
      browser,
      ADMIN_USERNAME,
      ADMIN_PASSWORD,
      "**/admin",
    );
    await page.goto(`${settingsPath(restaurantX.id)}?tab=notifications`);
    await expect(page.locator("#emailSummaryEnabled")).toBeVisible({
      timeout: 15_000,
    });
    // Sem "testar alerta urgente": ele publicaria um alerta real no painel
    await expect(
      page.getByRole("button", { name: /Testar Alerta/ }),
    ).toHaveCount(0);

    // Ativado só no formulário (sem salvar): o back responde SUMMARY_EMAIL_DISABLED
    await page.locator("#emailSummaryEnabled").click();
    await page.locator("#summaryEmailRecipient").fill("gerencia@example.com");
    const disabledResponse = page.waitForResponse((res) =>
      res
        .url()
        .endsWith(
          `/admin/restaurants/${restaurantX.id}/notifications/send-daily-summary`,
        ),
    );
    await page.getByRole("button", { name: "Enviar resumo de teste" }).click();
    const disabled = await disabledResponse;
    expect(disabled.status()).toBe(400);
    expect((await disabled.json()).code).toBe("SUMMARY_EMAIL_DISABLED");
    await expect(
      page.getByText("Ative o resumo diário e salve antes de testar.").first(),
    ).toBeVisible();

    const patchResponse = page.waitForResponse(
      (res) =>
        res.request().method() === "PATCH" &&
        res
          .url()
          .endsWith(
            `/admin/restaurants/${restaurantX.id}/notifications/settings`,
          ),
    );
    await page.getByRole("button", { name: "Salvar Configurações" }).click();
    expect((await patchResponse).status()).toBe(200);
    await expect(page.getByText("Preferências salvas").first()).toBeVisible();

    const sentResponse = page.waitForResponse((res) =>
      res.url().endsWith("/notifications/send-daily-summary"),
    );
    await page.getByRole("button", { name: "Enviar resumo de teste" }).click();
    expect((await sentResponse).status()).toBe(201);
    await expect(
      page.getByText("Teste de resumo registrado").first(),
    ).toBeVisible();

    await page.context().close();
  });

  test("admin: restaurante suspenso mostra o badge e pode ser configurado", async ({
    browser,
  }) => {
    const suspend = await api.patch(
      `admin/restaurants/${restaurantY.id}/suspend`,
      {
        headers: auth(adminToken),
      },
    );
    expect(suspend.ok()).toBe(true);

    const page = await uiLogin(
      browser,
      ADMIN_USERNAME,
      ADMIN_PASSWORD,
      "**/admin",
    );
    await page
      .locator(`a[href="${settingsPath(restaurantY.id)}"]`)
      .click({ timeout: 15_000 });
    await expect(page.getByText("SUSPENSO")).toBeVisible({ timeout: 15_000 });

    await page.locator("#alertSec").fill("150");
    const putService = page.waitForResponse(
      (res) =>
        res.request().method() === "PUT" &&
        res
          .url()
          .endsWith(`/admin/restaurants/${restaurantY.id}/settings/service`),
    );
    await page.getByRole("button", { name: "Salvar Alterações" }).click();
    expect((await putService).status()).toBe(200);

    await page.context().close();
  });

  test("impersonação: 'Configurar este restaurante' usa o token do admin", async ({
    browser,
  }) => {
    const page = await uiLogin(
      browser,
      ADMIN_USERNAME,
      ADMIN_PASSWORD,
      "**/admin",
    );
    await page
      .getByRole("row")
      .filter({ hasText: restaurantX.name })
      .getByRole("button", { name: "Suporte" })
      .click({ timeout: 15_000 });
    await page.waitForURL("**/dashboard**");

    const settingsRequest = page.waitForRequest((req) =>
      req.url().includes(`/admin/restaurants/${restaurantX.id}/settings/`),
    );
    await page
      .getByRole("button", { name: "Configurar este restaurante" })
      .click();
    await page.waitForURL(`**${settingsPath(restaurantX.id)}`);

    const authorization = (await settingsRequest).headers()["authorization"];
    expect(authorization).toBeTruthy();
    const claims = decodeJwtClaims(authorization!);
    expect(claims.role).toBe("ADMIN");
    expect(claims.rid).toBeUndefined();
    await expect(
      page.getByRole("heading", {
        name: `Configurações — ${restaurantX.name}`,
      }),
    ).toBeVisible({ timeout: 15_000 });

    await page.context().close();
  });

  test("URL inválida e restaurante inexistente", async ({ browser }) => {
    const page = await uiLogin(
      browser,
      ADMIN_USERNAME,
      ADMIN_PASSWORD,
      "**/admin",
    );

    const invalidCalls: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/admin/restaurants/nao-e-uuid"))
        invalidCalls.push(req.url());
    });
    await page.goto("/admin/restaurants/nao-e-uuid/settings");
    await expect(page.getByText("Restaurante inválido")).toBeVisible({
      timeout: 15_000,
    });
    expect(invalidCalls).toEqual([]);

    await page.goto(settingsPath("00000000-0000-4000-8000-000000000000"));
    await expect(page.getByText("Restaurante não encontrado")).toBeVisible({
      timeout: 15_000,
    });

    await page.context().close();
  });
});
