import {
  test,
  expect,
  request as playwrightRequest,
  type APIRequestContext,
} from "@playwright/test";

/**
 * Avaliação no Google após o pagamento da conta (docs/api/FEATURE_GOOGLE_REVIEW.md, T6).
 * Roda contra a API real; os dados de apoio são criados direto na API.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "Admin@123456";

const PLACE_ID = "ChIJIX22n_zVbgcRWvn7GCPGrs4";
const REVIEW_URL = `https://search.google.com/local/writereview?placeid=${PLACE_ID}`;

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

test.describe("Avaliação no Google após o pagamento", () => {
  test("link nas configurações, pagamento no painel e card no celular", async ({
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
    const ownerUsername = `dono_gr_${suffix}`;

    const adminToken = await apiLogin(api, ADMIN_USERNAME, ADMIN_PASSWORD);
    const created = await (
      await api.post("admin/restaurants", {
        headers: auth(adminToken),
        data: { name: `Avaliação ${suffix}`, ownerUsername },
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

    // ----------------------------------------------------------------------
    // 1. Admin: link inválido mostra o erro do back; Place ID vira link completo
    // ----------------------------------------------------------------------
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await adminPage.goto("/login");
    await adminPage.locator("#login-username").fill(ADMIN_USERNAME);
    await adminPage.locator("#login-password").fill(ADMIN_PASSWORD);
    await adminPage.getByRole("button", { name: "Entrar no sistema" }).click();
    await adminPage.waitForURL("**/admin");

    await adminPage.goto(
      `/admin/restaurants/${created.restaurantId}/settings?tab=appearance`,
    );
    const reviewField = adminPage.locator("#googleReviewUrl");
    const save = adminPage.getByRole("button", { name: "Salvar Alterações" });

    await reviewField.fill("https://evil.com");
    await save.click();
    await expect(
      adminPage.locator("#googleReviewUrl-error").first(),
    ).toContainText("endereço do Google", { timeout: 10_000 });

    await reviewField.fill(PLACE_ID);
    await save.click();
    await expect(adminPage.getByText("Aparência salva").first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(reviewField).toHaveValue(REVIEW_URL);

    // ----------------------------------------------------------------------
    // 2. Painel aberto pelo dono
    // ----------------------------------------------------------------------
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    await ownerPage.goto("/login");
    await ownerPage.locator("#login-username").fill(ownerUsername);
    await ownerPage.locator("#login-password").fill(created.ownerPasswordPlain);
    await ownerPage.getByRole("button", { name: "Entrar no sistema" }).click();
    await ownerPage.waitForURL("**/dashboard**");
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
    // 3. Cliente pede a conta
    // ----------------------------------------------------------------------
    const customerContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const customerPage = await customerContext.newPage();
    await customerPage.goto(`/m/${table.token}`);
    const billButton = customerPage.getByRole("button", {
      name: "Pedir a Conta",
    });
    await expect(billButton).toBeVisible({ timeout: 15_000 });
    await billButton.click();
    await expect(
      customerPage.getByText("Conta Solicitada").first(),
    ).toBeVisible({ timeout: 10_000 });

    // A pergunta "Você foi atendido?" nunca pode aparecer para conta
    const attendedPrompts: string[] = [];
    await customerPage.exposeFunction("reportAttendedPrompt", (t: string) =>
      attendedPrompts.push(t),
    );
    await customerPage.evaluate(() => {
      new MutationObserver(() => {
        if (document.body.innerText.includes("Você foi atendido?")) {
          (
            window as unknown as { reportAttendedPrompt: (t: string) => void }
          ).reportAttendedPrompt("Você foi atendido?");
        }
      }).observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    });

    // ----------------------------------------------------------------------
    // 4. Painel: "Pagamento recebido" tira o card da fila e a gaveta mostra "Pago"
    // ----------------------------------------------------------------------
    const card = panelPage.locator(
      'article[aria-label="Mesa 1, chamado de Conta"]',
    );
    await expect(card).toBeVisible({ timeout: 15_000 });
    const payButton = card.getByRole("button", {
      name: "Confirmar pagamento da mesa 1",
    });
    await expect(payButton).toHaveText("Pagamento recebido");
    await payButton.click();
    await expect(card).toBeHidden({ timeout: 10_000 });

    await panelPage
      .getByRole("button", { name: "Abrir gaveta de chamados recentes" })
      .click();
    const drawer = panelPage.getByRole("dialog");
    await expect(drawer.getByText("Pago").first()).toBeVisible();
    await panelPage.keyboard.press("Escape");

    // ----------------------------------------------------------------------
    // 5. Cliente: card de pagamento com o link, sem fechar sozinho
    // ----------------------------------------------------------------------
    await expect(
      customerPage.getByText("Pagamento confirmado").first(),
    ).toBeVisible({ timeout: 10_000 });
    const reviewLink = customerPage.getByRole("link", {
      name: "Avaliar no Google",
    });
    await expect(reviewLink).toHaveAttribute("href", REVIEW_URL);
    await expect(reviewLink).toHaveAttribute("target", "_blank");
    await expect(reviewLink).toHaveAttribute("rel", "noopener noreferrer");

    await customerPage.waitForTimeout(4_500);
    await expect(reviewLink).toBeVisible();
    expect(attendedPrompts).toEqual([]);

    // ----------------------------------------------------------------------
    // 6. Recarregar mantém o card; fechar e recarregar não o traz de volta
    // ----------------------------------------------------------------------
    await customerPage.reload();
    await expect(reviewLink).toBeVisible({ timeout: 15_000 });

    await customerPage
      .getByRole("button", { name: "Fechar mensagem de confirmação" })
      .click();
    await expect(reviewLink).toBeHidden();
    await expect(billButton).toBeVisible();
    await customerPage.reload();
    await expect(billButton).toBeVisible({ timeout: 15_000 });
    await expect(customerPage.getByText("Pagamento confirmado")).toBeHidden();

    // ----------------------------------------------------------------------
    // 7. Admin apaga o link: a aparência volta a null
    // ----------------------------------------------------------------------
    await reviewField.fill("");
    const clearResponse = adminPage.waitForResponse(
      (res) =>
        res.request().method() === "PUT" &&
        res.url().endsWith("/settings/appearance"),
    );
    await save.click();
    const cleared = await clearResponse;
    expect(cleared.status()).toBe(200);
    expect((await cleared.json()).googleReviewUrl).toBeNull();
    await expect(reviewField).toHaveValue("");
    const appearance = await (
      await api.get(
        `admin/restaurants/${created.restaurantId}/settings/appearance`,
        { headers: auth(adminToken) },
      )
    ).json();
    expect(appearance.googleReviewUrl).toBeNull();

    await customerContext.close();
    await ownerContext.close();
    await adminContext.close();
    await api.dispose();
  });
});
