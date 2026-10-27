import {
  test,
  expect,
  request as playwrightRequest,
  type APIRequestContext,
} from "@playwright/test";

/**
 * Logo e imagem de fundo do restaurante (docs/api/FEATURE_LOGO_UPLOAD.md, T6).
 * Roda contra a API real; os dados de apoio são criados direto na API.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "Admin@123456";

// PNG 1x1 válido: o back decodifica e redimensiona a imagem
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
const FILE_URL = /\/api\/v1\/files\/[0-9a-f-]{36}\.png$/;

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

test.describe("Logo e imagem de fundo do restaurante", () => {
  test("upload nas configurações, exibição na mesa e erros de arquivo", async ({
    browser,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop",
      "Fluxo de dados: roda uma vez, no viewport desktop",
    );
    test.setTimeout(180_000);

    const api = await playwrightRequest.newContext({
      baseURL: `${API_URL}/`,
    });
    const suffix = Date.now().toString(36);
    const ownerUsername = `dono_logo_${suffix}`;
    const restaurantName = `Logo ${suffix}`;

    const adminToken = await apiLogin(api, ADMIN_USERNAME, ADMIN_PASSWORD);
    const created = await (
      await api.post("admin/restaurants", {
        headers: auth(adminToken),
        data: { name: restaurantName, ownerUsername },
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

    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    await ownerPage.goto("/login");
    await ownerPage.locator("#login-username").fill(ownerUsername);
    await ownerPage.locator("#login-password").fill(created.ownerPasswordPlain);
    await ownerPage.getByRole("button", { name: "Entrar no sistema" }).click();
    await ownerPage.waitForURL("**/dashboard**");
    await ownerPage.goto("/dashboard/settings?tab=appearance");

    const fileInputs = ownerPage.locator('input[type="file"]');
    const logoInput = fileInputs.first();

    // ----------------------------------------------------------------------
    // 1. Dono envia o logo: a prévia passa a usar a URL do servidor
    // ----------------------------------------------------------------------
    const logoResponse = ownerPage.waitForResponse(
      (res) =>
        res.request().method() === "POST" &&
        res.url().endsWith("/settings/appearance/logo"),
    );
    await logoInput.setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: PNG_1PX,
    });
    const logoRes = await logoResponse;
    expect(logoRes.status()).toBe(200);
    const logoUrl: string = (await logoRes.json()).logoUrl;
    expect(logoUrl).toMatch(FILE_URL);

    const settingsLogo = ownerPage.locator('img[alt="Logo do Restaurante"]');
    await expect(settingsLogo).toHaveAttribute("src", logoUrl, {
      timeout: 10_000,
    });

    // A URL é pública e liberada para outro domínio
    const fileRes = await api.get(logoUrl);
    expect(fileRes.status()).toBe(200);
    expect(fileRes.headers()["content-type"]).toContain("image/png");
    expect(fileRes.headers()["cross-origin-resource-policy"]).toBe(
      "cross-origin",
    );

    // ----------------------------------------------------------------------
    // 2. Tela do cliente: logo com a URL da API, sem o otimizador do Next
    // ----------------------------------------------------------------------
    const customerContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const customerPage = await customerContext.newPage();
    const logoFetch = customerPage.waitForResponse(
      (res) => res.url() === logoUrl,
    );
    await customerPage.goto(`/m/${table.token}`);
    expect((await logoFetch).status()).toBe(200);

    const customerLogo = customerPage.locator(
      `img[alt="Logotipo ${restaurantName}"]`,
    );
    await expect(customerLogo).toHaveAttribute("src", logoUrl, {
      timeout: 15_000,
    });
    await expect
      .poll(() =>
        customerLogo.evaluate((img: HTMLImageElement) => img.naturalWidth),
      )
      .toBeGreaterThan(0);

    // ----------------------------------------------------------------------
    // 3. Fundo de imagem: salvar outro campo não remove o fundo
    // ----------------------------------------------------------------------
    await ownerPage.getByRole("button", { name: "Foto Própria" }).click();
    const bgResponse = ownerPage.waitForResponse(
      (res) =>
        res.request().method() === "POST" &&
        res.url().endsWith("/settings/appearance/background"),
    );
    await fileInputs.nth(1).setInputFiles({
      name: "fundo.png",
      mimeType: "image/png",
      buffer: PNG_1PX,
    });
    const bgRes = await bgResponse;
    expect(bgRes.status()).toBe(200);
    const bgBody = await bgRes.json();
    expect(bgBody.backgroundType).toBe("image");
    expect(bgBody.backgroundValue).toMatch(FILE_URL);
    const bgUrl: string = bgBody.backgroundValue;

    await ownerPage.locator("#description").fill("Fundo preservado");
    const putRequest = ownerPage.waitForRequest(
      (req) =>
        req.method() === "PUT" && req.url().endsWith("/settings/appearance"),
    );
    const putResponse = ownerPage.waitForResponse(
      (res) =>
        res.request().method() === "PUT" &&
        res.url().endsWith("/settings/appearance"),
    );
    await ownerPage.getByRole("button", { name: "Salvar Alterações" }).click();
    const putBody = (await putRequest).postDataJSON();
    expect(putBody.backgroundType).toBe("image");
    expect(putBody).not.toHaveProperty("backgroundValue");
    const saved = await putResponse;
    expect(saved.status()).toBe(200);
    expect((await saved.json()).backgroundValue).toBe(bgUrl);

    await ownerPage.reload();
    const afterReload = await (
      await api.get("settings/appearance", { headers: auth(ownerToken) })
    ).json();
    expect(afterReload.backgroundType).toBe("image");
    expect(afterReload.backgroundValue).toBe(bgUrl);
    expect(afterReload.description).toBe("Fundo preservado");

    await customerPage.reload();
    const customerBg = customerPage.locator('div.bg-cover[aria-hidden="true"]');
    await expect(customerBg).toHaveAttribute(
      "style",
      new RegExp(bgUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      { timeout: 15_000 },
    );

    // ----------------------------------------------------------------------
    // 4. SVG, arquivo acima de 2 MB e PNG falso: erro e nada muda
    // ----------------------------------------------------------------------
    const uploads: string[] = [];
    ownerPage.on("request", (req) => {
      if (req.url().includes("/settings/appearance/logo"))
        uploads.push(req.url());
    });

    await logoInput.setInputFiles({
      name: "logo.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
    });
    await expect(ownerPage.getByText("Formato inválido").first()).toBeVisible();

    await logoInput.setInputFiles({
      name: "grande.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(3 * 1024 * 1024, 1),
    });
    await expect(
      ownerPage.getByText("Arquivo muito grande").first(),
    ).toBeVisible();
    expect(uploads).toEqual([]);

    // Extensão e tipo de PNG, conteúdo de texto: o back recusa pelo conteúdo
    const fakeResponse = ownerPage.waitForResponse((res) =>
      res.url().endsWith("/settings/appearance/logo"),
    );
    await logoInput.setInputFiles({
      name: "falso.png",
      mimeType: "image/png",
      buffer: Buffer.from("isto não é uma imagem"),
    });
    const fakeRes = await fakeResponse;
    expect(fakeRes.status()).toBe(400);
    expect((await fakeRes.json()).code).toBe("INVALID_IMAGE_FORMAT");
    await expect(
      ownerPage.getByText("Use PNG, JPG ou WebP.").first(),
    ).toBeVisible();
    await expect(settingsLogo).toHaveAttribute("src", logoUrl);

    const unchanged = await (
      await api.get("settings/appearance", { headers: auth(ownerToken) })
    ).json();
    expect(unchanged.logoUrl).toBe(logoUrl);
    expect(unchanged.backgroundValue).toBe(bgUrl);

    await customerContext.close();
    await ownerContext.close();
    await api.dispose();
  });
});
