import {
  test,
  expect,
  request as playwrightRequest,
  type APIRequestContext,
  type Request,
} from "@playwright/test";

/**
 * Integração front ↔ API real (docs/api/FRONTEND_CHANGES.md, seção D).
 * Os dados de apoio são criados direto na API para poupar o limite de POSTs
 * públicos por IP (10/min); os comportamentos verificados passam pela interface.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "Admin@123456";

interface SeedTable {
  id: string;
  number: number;
  token: string;
  url: string;
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

test.describe("Integração com a API real", () => {
  test("QR, cliente, painel, resumo, configurações e admin", async ({
    browser,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop",
      "Fluxo de dados: roda uma vez, no viewport desktop",
    );
    test.setTimeout(240_000);

    const api = await playwrightRequest.newContext({
      baseURL: `${API_URL}/`,
    });
    const suffix = Date.now().toString(36);
    const restaurantName = `Integração ${suffix}`;
    const ownerUsername = `dono_${suffix}`;
    const waiterUsername = `garcom_${suffix}`;
    const customButton = `Chamar atendente ${suffix}`;

    // ----------------------------------------------------------------------
    // Dados de apoio: restaurante, mesas, garçom e destinatário de alertas
    // ----------------------------------------------------------------------
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
      data: { startNumber: 1, count: 2 },
    });
    expect(tablesRes.status()).toBe(201);
    const tables: SeedTable[] = await tablesRes.json();
    const table1 = tables.find((t) => t.number === 1)!;
    const table2 = tables.find((t) => t.number === 2)!;

    const waiter = await (
      await api.post("restaurant/users", {
        headers: auth(ownerToken),
        data: { username: waiterUsername, role: "WAITER" },
      })
    ).json();
    const waiterToken = await apiLogin(
      api,
      waiterUsername,
      waiter.temporaryPassword,
    );
    await api.patch("restaurant/notifications/settings", {
      headers: auth(ownerToken),
      data: {
        urgentAlertEnabled: true,
        urgentAlertRecipient: "gerencia@example.com",
      },
    });

    // Chamado na Mesa 2 atendido pelo garçom (métricas por garçom)
    const waiterCall = await (
      await api.post(`public/tables/${table2.token}/calls`, {
        data: { type: "BILL" },
      })
    ).json();
    await api.post(`panel/calls/${waiterCall.id}/attend`, {
      headers: auth(waiterToken),
    });

    // ----------------------------------------------------------------------
    // 1. Dono: "Copiar link" copia exatamente o conteúdo do QR (F-02)
    // ----------------------------------------------------------------------
    const ownerContext = await browser.newContext({
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const ownerPage = await ownerContext.newPage();
    await ownerPage.goto("/login");
    await ownerPage.locator("#login-username").fill(ownerUsername);
    await ownerPage.locator("#login-password").fill(created.ownerPasswordPlain);
    await ownerPage.getByRole("button", { name: "Entrar no sistema" }).click();
    await ownerPage.waitForURL("**/dashboard**");

    await ownerPage.goto("/dashboard/tables");
    await ownerPage
      .getByRole("button", { name: "Copiar link da Mesa 1" })
      .locator("visible=true")
      .first()
      .click();
    const copied = await ownerPage.evaluate(() =>
      navigator.clipboard.readText(),
    );
    const qrRes = await api.get(`tables/${table1.id}/qr?format=png`, {
      headers: auth(ownerToken),
    });
    expect(copied).toBe(table1.url);
    expect(qrRes.headers()["x-table-url"]).toBe(copied);

    // ----------------------------------------------------------------------
    // 2. Folha A4: QR de cada mesa e nome do restaurante (F-01)
    // ----------------------------------------------------------------------
    await ownerPage.goto("/dashboard/tables/print");
    const qrImage = ownerPage.getByAltText(
      "QR Code para autoatendimento da Mesa 1",
    );
    await expect(qrImage).toBeVisible({ timeout: 15_000 });
    expect(await qrImage.getAttribute("src")).toMatch(/^data:image\/svg\+xml/);
    await expect(
      ownerPage.getByText(restaurantName, { exact: true }).first(),
    ).toBeVisible();
    await expect(ownerPage.getByText(table1.url).first()).toBeVisible();

    // ----------------------------------------------------------------------
    // 3. Aparência: texto do botão e Wi-Fi salvam (F-06)
    // ----------------------------------------------------------------------
    await ownerPage.goto("/dashboard/settings?tab=appearance");
    await ownerPage.locator("#callWaiterButton").fill(customButton);
    await ownerPage.locator("#wifiName").fill("Bistro Wi-Fi");
    await ownerPage.locator("#wifiPassword").fill("senha 123");
    await ownerPage.getByRole("button", { name: "Salvar Alterações" }).click();
    await expect(ownerPage.getByText("Aparência salva").first()).toBeVisible({
      timeout: 10_000,
    });
    const appearance = await (
      await api.get("settings/appearance", { headers: auth(ownerToken) })
    ).json();
    expect(appearance.texts.callWaiterButton).toBe(customButton);
    expect(appearance.socials.wifiName).toBe("Bistro Wi-Fi");

    // ----------------------------------------------------------------------
    // 4. Painel aberto pelo dono
    // ----------------------------------------------------------------------
    const panelPage = await ownerContext.newPage();
    await panelPage.goto("/panel");
    const startPanel = panelPage
      .locator(
        'button:has-text("Abrir sem entrar em tela cheia"), button:has-text("Iniciar Painel Completo")',
      )
      .first();
    await startPanel
      .waitFor({ state: "visible", timeout: 8000 })
      .catch(() => null);
    if (await startPanel.isVisible()) await startPanel.click();

    // ----------------------------------------------------------------------
    // 5. Cliente: /m/{token} sem login, observação de 150 caracteres (F-03)
    // ----------------------------------------------------------------------
    const customerContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const customerPage = await customerContext.newPage();
    const publicGets: string[] = [];
    customerPage.on("response", (res) => {
      if (
        res.request().method() === "POST" &&
        res.url().includes("/public/tables/")
      ) {
        console.log(
          "POST público:",
          res.status(),
          res.url().split("/calls")[1],
        );
      }
    });
    customerPage.on("request", (req: Request) => {
      if (req.method() === "GET" && req.url().includes("/public/tables/")) {
        publicGets.push(req.url().replace(API_URL, ""));
      }
    });

    await customerPage.goto(`/m/${table1.token}`);
    const waiterButton = customerPage.getByRole("button", {
      name: customButton,
    });
    await expect(waiterButton).toBeVisible({ timeout: 15_000 });

    const note150 = "x".repeat(150);
    await customerPage.getByText("Adicionar observação opcional").click();
    await customerPage.locator("#call-note-field").fill(note150 + "excedente");
    await expect(customerPage.locator("#call-note-field")).toHaveValue(note150);

    const openResponse = customerPage.waitForResponse(
      (res) =>
        res.request().method() === "POST" &&
        res.url().endsWith(`/public/tables/${table1.token}/calls`),
    );
    await waiterButton.click();
    expect((await openResponse).status()).toBe(201);
    await expect(customerPage.getByText("Garçom Chamado").first()).toBeVisible({
      timeout: 10_000,
    });

    // Cancelar
    await customerPage
      .getByRole("button", { name: "Cancelar chamado" })
      .click();
    await customerPage
      .getByRole("dialog")
      .getByRole("button", { name: "Sim, cancelar" })
      .click();
    await expect(waiterButton).toBeVisible({ timeout: 10_000 });

    // ----------------------------------------------------------------------
    // 6. Painel recebe em tempo real, assume e atende (F-05)
    // ----------------------------------------------------------------------
    await waiterButton.click();
    const card = panelPage.locator(
      'article[aria-label="Mesa 1, chamado de Garçom"]',
    );
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByRole("button", { name: "Assumir mesa 1" }).click();
    await card
      .getByRole("button", { name: "Concluir atendimento da mesa 1" })
      .click();
    await expect(card).toBeHidden({ timeout: 10_000 });

    await panelPage
      .getByRole("button", { name: "Abrir gaveta de chamados recentes" })
      .click();
    const drawer = panelPage.getByRole("dialog");
    await expect(drawer.getByText("Mesa 1").first()).toBeVisible();
    await expect(drawer.getByText("Garçom").first()).toBeVisible();
    await panelPage.keyboard.press("Escape");

    // ----------------------------------------------------------------------
    // 7. Cliente contesta: o chamado volta à fila com "Reaberto" (F-04)
    // ----------------------------------------------------------------------
    await customerPage
      .getByRole("button", { name: "Ainda não" })
      .click({ timeout: 15_000 });
    await customerPage
      .getByRole("dialog")
      .getByRole("button", { name: "Sim, contestar" })
      .click();
    await expect(card).toBeVisible({ timeout: 2_500 });
    await expect(card.getByText("Reaberto (1x)")).toBeVisible();

    // Atende de novo e o cliente confirma com avaliação
    await card
      .getByRole("button", { name: "Concluir atendimento da mesa 1" })
      .click();
    await expect(card).toBeHidden({ timeout: 10_000 });
    const confirmResponse = customerPage.waitForResponse((res) =>
      res.url().endsWith("/confirm"),
    );
    await customerPage
      .getByRole("button", { name: "Avaliar como excelente" })
      .click({ timeout: 15_000 });
    expect((await confirmResponse).status()).toBe(200);
    await expect(waiterButton).toBeVisible({ timeout: 15_000 });

    // Sessão completa sem GET por evento (F-18): carga inicial + stream
    console.log("GETs públicos da sessão do cliente:", publicGets);
    expect(publicGets.length).toBeLessThanOrEqual(2);
    await customerContext.close();

    // ----------------------------------------------------------------------
    // 8. "Testar alerta urgente" (F-15) e alert.raised no painel (F-17)
    // ----------------------------------------------------------------------
    await ownerPage.goto("/dashboard/settings?tab=notifications");
    await ownerPage.getByRole("button", { name: "Testar Alerta" }).click();
    await expect(
      ownerPage.getByText("Teste registrado para gerencia@example.com").first(),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      panelPage.getByText("Mesa 1: espera urgente").first(),
    ).toBeVisible({ timeout: 10_000 });

    // ----------------------------------------------------------------------
    // 9. Resumo do Dia com dados (F-09 a F-13)
    // ----------------------------------------------------------------------
    const summaryResponse = ownerPage.waitForResponse((res) =>
      res.url().includes("/analytics/summary?"),
    );
    await ownerPage.goto("/dashboard");
    const summary = await (await summaryResponse).json();
    expect(summary.summary.overview.totalCalls).toBe(3);
    await expect(
      ownerPage.getByText("Total de Chamados").first(),
    ).toBeVisible();
    await expect(ownerPage.getByText("3.0 / 3.0").first()).toBeVisible();
    // Filtro por mesa da tabela de chamados: parâmetro `table` (F-13)
    const filteredResponse = ownerPage.waitForResponse(
      (res) =>
        res.url().includes("/analytics/calls?") &&
        res.url().includes("table=2"),
    );
    await ownerPage
      .getByLabel("Filtrar por número da mesa")
      .fill(String(table2.number));
    expect((await (await filteredResponse).json()).totalCount).toBe(1);

    // ----------------------------------------------------------------------
    // 10. Métricas por garçom (F-08)
    // ----------------------------------------------------------------------
    await ownerPage.goto("/dashboard/team");
    await ownerPage
      .getByRole("tab", { name: "Desempenho dos Garçons" })
      .click();
    await expect(ownerPage.getByText(waiterUsername).first()).toBeVisible({
      timeout: 10_000,
    });
    await ownerContext.close();

    // ----------------------------------------------------------------------
    // 11. Admin: redefinir senha do dono mostra a senha (F-07); auditoria pagina (F-14)
    // ----------------------------------------------------------------------
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await adminPage.goto("/login");
    await adminPage.locator("#login-username").fill(ADMIN_USERNAME);
    await adminPage.locator("#login-password").fill(ADMIN_PASSWORD);
    await adminPage.getByRole("button", { name: "Entrar no sistema" }).click();
    await adminPage.waitForURL("**/admin");

    await adminPage
      .getByRole("button", {
        name: `Gerar nova senha do dono de ${restaurantName}`,
      })
      .first()
      .click();
    await adminPage.getByRole("button", { name: "Gerar Nova Senha" }).click();
    const secret = adminPage
      .locator('[role="dialog"]')
      .locator("span.font-mono.text-lg");
    await expect(secret).toBeVisible({ timeout: 10_000 });
    const newPassword = (await secret.innerText()).trim();
    expect(newPassword.length).toBeGreaterThanOrEqual(8);
    expect(
      (
        await api.post("auth/login", {
          data: { username: ownerUsername, password: newPassword },
        })
      ).status(),
    ).toBe(200);
    await adminPage.keyboard.press("Escape");

    await adminPage.goto("/admin/audit");
    const firstPageResponse = await adminPage.waitForResponse((res) =>
      res.url().includes("/admin/audit"),
    );
    expect(firstPageResponse.status()).toBe(200);
    const nextPage = adminPage.getByRole("button", { name: "Próxima página" });
    await expect(nextPage).toBeEnabled({ timeout: 10_000 });
    const secondPageResponse = adminPage.waitForResponse(
      (res) =>
        res.url().includes("/admin/audit") && res.url().includes("cursor="),
    );
    await nextPage.click();
    expect((await secondPageResponse).status()).toBe(200);

    await adminContext.close();
    await api.dispose();
  });
});
