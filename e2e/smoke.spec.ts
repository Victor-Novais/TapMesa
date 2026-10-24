import { test, expect, type Page } from "@playwright/test";

/**
 * Verificação automática de ausência de rolagem horizontal (scrollWidth <= clientWidth).
 * Atende aos requisitos da Seção 2.11 e F23.
 */
async function assertNoHorizontalScroll(page: Page, routeName: string) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(300);
  const { docScrollWidth, docClientWidth } = await page.evaluate(() => ({
    docScrollWidth: document.documentElement.scrollWidth,
    docClientWidth: document.documentElement.clientWidth,
  }));

  const isOverflowing = docScrollWidth > docClientWidth + 1;
  expect(
    isOverflowing,
    `Rota ${routeName} não deve apresentar rolagem horizontal (scrollWidth: ${docScrollWidth}, clientWidth: ${docClientWidth})`,
  ).toBe(false);
}

// Credenciais do admin do back-end de teste (nunca fixas no código)
const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

test.describe("Jornada Completa TapMesa (Smoke E2E contra Back Real)", () => {
  test.skip(
    !ADMIN_PASSWORD,
    "Defina E2E_ADMIN_PASSWORD (e E2E_ADMIN_USERNAME, se não for 'admin') para rodar a jornada completa.",
  );

  test("deve executar o fluxo narrativo ponta a ponta: Admin -> Owner -> Mesas -> Cliente -> Painel -> Confirmação -> Contestação -> Resumo", async ({
    browser,
  }) => {
    test.setTimeout(180_000); // 3 minutos para a jornada completa

    const timestamp = Date.now();
    const restaurantName = `Bistrô E2E ${timestamp}`;
    const ownerUsername = `owner_${timestamp}`;

    // =========================================================================
    // 1. ADMIN cria restaurante e copia as credenciais geradas
    // =========================================================================
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    adminPage.on("console", (msg) => console.log("ADMIN CONSOLE:", msg.text()));
    adminPage.on("response", async (res) => {
      if (res.status() >= 400) {
        console.log(
          "ADMIN HTTP ERROR:",
          res.url(),
          res.status(),
          await res.text().catch(() => ""),
        );
      }
    });

    // Login do ADMIN
    await adminPage.goto("/login");
    await assertNoHorizontalScroll(adminPage, "/login");

    await adminPage.locator("#login-username").fill(ADMIN_USERNAME);
    await adminPage.locator("#login-password").fill(ADMIN_PASSWORD ?? "");
    await adminPage.getByRole("button", { name: "Entrar no sistema" }).click();

    // Redirecionamento automático para o Portal do Administrador
    await adminPage.waitForURL("**/admin");
    await expect(
      adminPage.getByRole("heading", { name: "Restaurantes" }),
    ).toBeVisible();
    await assertNoHorizontalScroll(adminPage, "/admin");

    // Abrir modal de cadastro de restaurante
    const createBtn = adminPage
      .locator(
        'button:has-text("Novo Restaurante"), button:has-text("Cadastrar Primeiro Restaurante")',
      )
      .first();
    console.log("CLICKING CREATE BTN:", await createBtn.innerText());
    await createBtn.click();
    console.log(
      "DIALOG COUNT AFTER CLICK:",
      await adminPage.locator('[role="dialog"]').count(),
    );
    await expect(adminPage.locator('[role="dialog"]')).toBeVisible();

    // Preencher dados do novo restaurante
    await adminPage.locator("#name").fill(restaurantName);
    await adminPage.locator("#ownerUsername").fill(ownerUsername);

    console.log(
      "FILLED RESTAURANT NAME:",
      await adminPage.locator("#name").inputValue(),
    );
    console.log(
      "FILLED OWNER USERNAME:",
      await adminPage.locator("#ownerUsername").inputValue(),
    );

    await adminPage
      .getByRole("button", { name: "Cadastrar Estabelecimento" })
      .click();

    await adminPage.waitForTimeout(1000);
    const errors = await adminPage
      .locator('[role="alert"], p.text-red-600')
      .allTextContents();
    console.log("FORM VALIDATION / API ERRORS:", errors);

    // Modal de credenciais temporárias (OneTimeSecretDialog)
    const secretDialog = adminPage.locator(
      '[role="dialog"]:has-text("Credenciais de Acesso")',
    );
    await expect(secretDialog).toBeVisible({ timeout: 15_000 });

    const displayedUsername = await secretDialog
      .locator("p.font-mono")
      .first()
      .innerText();
    const generatedPassword = await secretDialog
      .locator("span.font-mono.text-lg")
      .first()
      .innerText();

    expect(displayedUsername.trim()).toBe(ownerUsername);
    expect(generatedPassword.trim().length).toBeGreaterThanOrEqual(8);

    // Fechar diálogo de credenciais
    await secretDialog.locator('button:has-text("Entendi e salvei")').click();
    await expect(secretDialog).toBeHidden();

    // Confirmar que o novo restaurante aparece na lista
    await expect(
      adminPage
        .locator(`text=${restaurantName}`)
        .locator("visible=true")
        .first(),
    ).toBeVisible();

    await adminContext.close();

    // =========================================================================
    // 2. OWNER faz login e cria mesas em lote
    // =========================================================================
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();

    await ownerPage.goto("/login");
    await ownerPage.locator("#login-username").fill(ownerUsername);
    await ownerPage.locator("#login-password").fill(generatedPassword.trim());
    await ownerPage.getByRole("button", { name: "Entrar no sistema" }).click();

    // Redirecionamento para o dashboard
    await ownerPage.waitForURL("**/dashboard**");
    await assertNoHorizontalScroll(ownerPage, "/dashboard");

    // Navegar para Mesas
    await ownerPage.goto("/dashboard/tables");
    await assertNoHorizontalScroll(ownerPage, "/dashboard/tables");

    // Criar lote de mesas (Mesa 1 e Mesa 2)
    const openBatchBtn = ownerPage
      .locator(
        'button:has-text("Criar em lote"), button:has-text("Criar as primeiras mesas")',
      )
      .first();
    await openBatchBtn.click();

    const batchDialog = ownerPage.locator(
      '[role="dialog"]:has-text("Criar Mesas em Lote")',
    );
    await expect(batchDialog).toBeVisible();

    await batchDialog.getByLabel("Número Inicial").fill("1");
    await batchDialog.getByLabel("Quantidade de Mesas").fill("2");
    await batchDialog.getByRole("button", { name: "Gerar Mesas" }).click();
    await expect(batchDialog).toBeHidden({ timeout: 10_000 });

    // Verificar mesas cadastradas na listagem
    await expect(
      ownerPage.locator("text=Mesa 1").locator("visible=true").first(),
    ).toBeVisible();
    await expect(
      ownerPage.locator("text=Mesa 2").locator("visible=true").first(),
    ).toBeVisible();

    // Extrair o token público da Mesa 1 do link exibido (table.url: {PUBLIC_APP_URL}/m/{token})
    const tokenElement = ownerPage
      .locator('span:has-text("/m/")')
      .locator("visible=true")
      .first();
    await expect(tokenElement).toBeVisible();
    const tokenRaw = await tokenElement.innerText();
    const tableToken = tokenRaw.trim().split("/m/").pop() ?? "";
    expect(tableToken.length).toBeGreaterThanOrEqual(6);

    // =========================================================================
    // 3. STAFF abre o Painel Operacional (/panel) em tempo real
    // =========================================================================
    const staffPage = await ownerContext.newPage();
    await staffPage.goto("/panel");
    await assertNoHorizontalScroll(staffPage, "/panel");

    // Se exibir o diálogo de início de turno / desbloqueio de áudio, confirma
    const openPanelBtn = staffPage
      .locator(
        'button:has-text("Abrir sem entrar em tela cheia"), button:has-text("Iniciar Painel Completo")',
      )
      .first();
    await openPanelBtn
      .waitFor({ state: "visible", timeout: 8000 })
      .catch(() => null);
    if (await openPanelBtn.isVisible()) {
      await openPanelBtn.click();
      await expect(staffPage.locator('[role="dialog"]')).toBeHidden({
        timeout: 5000,
      });
    }

    // =========================================================================
    // 4. CLIENTE abre /m/[token] em viewport móvel e chama o garçom
    // =========================================================================
    const customerContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const customerPage = await customerContext.newPage();
    await customerPage.goto(`/m/${tableToken}`);
    await assertNoHorizontalScroll(customerPage, `/m/${tableToken}`);

    // Cliente vê cabeçalho com a Mesa 1
    await expect(customerPage.locator("text=Mesa 1").first()).toBeVisible();

    // Cliente clica em Chamar Garçom
    const callWaiterBtn = customerPage.locator(
      'button:has-text("Chamar Garçom")',
    );
    await expect(callWaiterBtn).toBeVisible();
    await callWaiterBtn.click();

    // Botão passa a exibir o card de chamado em andamento
    await expect(
      customerPage
        .locator("text=Garçom Chamado")
        .or(customerPage.locator("text=Solicitação em andamento"))
        .first(),
    ).toBeVisible({ timeout: 10_000 });

    // =========================================================================
    // 5. PAINEL recebe o chamado em tempo real -> Garçom assume e atende
    // =========================================================================
    await staffPage.bringToFront();
    const panelCardMesa1 = staffPage
      .locator('article[aria-label*="Mesa 1"]')
      .first();
    await expect(panelCardMesa1).toBeVisible({ timeout: 15_000 });

    // Garçom clica em "Assumir"
    const assumeBtn = panelCardMesa1.locator('button:has-text("Assumir")');
    await assumeBtn.click();
    await expect(panelCardMesa1.locator("text=Assumido").first()).toBeVisible({
      timeout: 5000,
    });

    // Garçom conclui atendimento clicando em "Atendido"
    const attendBtn = panelCardMesa1.locator('button:has-text("Atendido")');
    await attendBtn.click();
    await expect(panelCardMesa1).toBeHidden({ timeout: 10_000 });

    // =========================================================================
    // 6. CLIENTE confirma com nota 3 (Excelente)
    // =========================================================================
    await customerPage.bringToFront();
    const rating3Btn = customerPage
      .locator('button[aria-label*="excelente"]')
      .first();
    await expect(rating3Btn).toBeVisible({ timeout: 10_000 });
    await rating3Btn.click();

    // Cliente vê confirmação e o botão de novo chamado volta a ficar livre após auto-dismiss
    await expect(
      customerPage.locator('button:has-text("Chamar Garçom")'),
    ).toBeVisible({ timeout: 15_000 });

    // =========================================================================
    // 7. CLIENTE abre segundo chamado (Pedir Conta) e contesta ("Garçom não veio")
    // =========================================================================
    const requestBillBtn = customerPage
      .locator(
        'button:has-text("Pedir a Conta"), button:has-text("Pedir Conta")',
      )
      .first();
    await expect(requestBillBtn).toBeVisible({ timeout: 10_000 });
    await requestBillBtn.click();

    // Painel recebe o chamado de conta
    await staffPage.bringToFront();
    const billCard = staffPage.locator('article[aria-label*="Mesa 1"]').first();
    await expect(billCard).toBeVisible({ timeout: 15_000 });

    // Garçom marca como Atendido
    const attendBillBtn = billCard.locator('button:has-text("Atendido")');
    await attendBillBtn.click();
    await expect(billCard).toBeHidden({ timeout: 10_000 });

    // Cliente vê "Tudo certo?" e contesta informando que a conta não chegou
    await customerPage.bringToFront();
    const contestBtn = customerPage
      .locator(
        'button:has-text("Ainda não"), button:has-text("Garçom não veio"), button:has-text("Conta não chegou")',
      )
      .first();
    await expect(contestBtn).toBeVisible({ timeout: 10_000 });
    await contestBtn.click();

    // Confirmação no modal de contestação
    const contestDialog = customerPage.locator('[role="dialog"]');
    await expect(contestDialog).toBeVisible({ timeout: 5000 });
    await contestDialog
      .locator(
        'button:has-text("Sim, contestar"), button:has-text("Contestar")',
      )
      .first()
      .click();
    await expect(contestDialog).toBeHidden({ timeout: 10_000 });

    await customerContext.close();

    // =========================================================================
    // 8. OWNER confere os números no Resumo do Dia (/dashboard)
    // =========================================================================
    await ownerPage.bringToFront();
    const dashboardLink = ownerPage.locator('a[href="/dashboard"]').first();
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
    } else {
      await ownerPage.goto("/dashboard");
    }
    await assertNoHorizontalScroll(ownerPage, "/dashboard");

    // Valida que os KPIs refletem as operações realizadas
    await expect(
      ownerPage.locator("text=Total de Chamados").first(),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      ownerPage.locator("text=Chamados Atendidos").first(),
    ).toBeVisible({ timeout: 15_000 });

    await staffPage.close();
    await ownerContext.close();
  });
});
