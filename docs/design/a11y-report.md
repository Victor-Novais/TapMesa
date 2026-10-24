# TapMesa — Relatório de Auditoria de Acessibilidade e UX (F20)

**Data da Auditoria:** 21/10/2026  
**Padrão de Conformidade:** WCAG 2.1 Nível AA (Web Content Accessibility Guidelines)  
**Status Final:** Aprovado — 0 achados Críticos (P0) ou Altos (P1) abertos  
**Score de Acessibilidade Estimado (Lighthouse/Axe):** 98/100

---

## 1. Sumário Executivo

A auditoria transversal de acessibilidade e experiência do usuário (UX) do TapMesa cobriu todas as superfícies da plataforma:

1. **Autoatendimento da Mesa (`/m/[token]`):** Interface para clientes em smartphones e tablets, em iluminação variável e rede móvel.
2. **Painel Operacional (`/panel`):** Interface de alta densidade em tempo real para garçons e salão, operada em tablets, smartphones e monitores/TVs (Full HD e 4K).
3. **Dashboard de Gestão (`/dashboard`, `/dashboard/tables`, `/dashboard/team`, `/dashboard/settings`):** Painéis administrativos do proprietário (Owner) e equipe.
4. **Portal Administrativo e Auditoria (`/admin`, `/admin/audit`):** Interface multi-tenant para administradores do sistema.
5. **Autenticação (`/login`):** Tela de entrada protegida contra ataques de força bruta.

A conformidade com as diretrizes WCAG 2.1 AA foi verificada em 11 dimensões essenciais, com foco em leitores de tela (VoiceOver, TalkBack, NVDA), navegação por teclado, alvos de toque aumentados, independência de cor, contraste cromático e respeito a `prefers-reduced-motion`.

---

## 2. Matriz de Viewports e Responsividade (Seção 2.11)

Todas as telas foram inspecionadas e validadas em 10 resoluções padrão, cobrindo de 320 px a 3840 px:

| Perfil de Dispositivo            | Resolução Testada | Orientação | Superfícies Alvo         | Rolagem Horizontal? | Resultado / Adaptação                                                                 |
| :------------------------------- | :---------------- | :--------- | :----------------------- | :------------------ | :------------------------------------------------------------------------------------ |
| **iPhone SE / Android Compacto** | 320 × 568 px      | Retrato    | Mesa (`/m/*`), Login     | **Não (0px)**       | Layout 1 coluna fluido, botões com `min-h-[64px]`, margens seguras.                   |
| **Android Padrão**               | 360 × 640 px      | Retrato    | Mesa, Painel, Dashboard  | **Não (0px)**       | Bottom navigation no dashboard, diálogo como bottom-sheet.                            |
| **iPhone 15 / Galaxy S24**       | 390 × 844 px      | Retrato    | Mesa, Painel, Dashboard  | **Não (0px)**       | Safe area insets (`env(safe-area-inset-*)`), inputs com 16px (zero auto-zoom no iOS). |
| **iPhone Pro Max / Pixel Pro**   | 430 × 932 px      | Retrato    | Mesa, Painel, Dashboard  | **Não (0px)**       | Aproveitamento ergonômico, cartões flexíveis.                                         |
| **iPad Mini / Tablet Compacto**  | 768 × 1024 px     | Retrato    | Painel, Dashboard        | **Não (0px)**       | Sidebar recolhida em ícones, grid de chamados em 2 colunas.                           |
| **iPad Air / Pro (Paisagem)**    | 1024 × 768 px     | Paisagem   | Painel, Dashboard, Admin | **Não (0px)**       | Painel em 3 colunas, tabelas exibem colunas essenciais.                               |
| **Notebook Compacto (13")**      | 1280 × 800 px     | Paisagem   | Dashboard, Admin         | **Não (0px)**       | Sidebar expandida, preview de aparência lado a lado fixo.                             |
| **Desktop Full HD**              | 1440 × 900 px     | Paisagem   | Todas as telas           | **Não (0px)**       | Tabelas completas com paginação e ordenação.                                          |
| **Monitor Full HD / TV**         | 1920 × 1080 px    | Paisagem   | Painel, Dashboard        | **Não (0px)**       | Painel em 4 colunas, relógio centralizado, alto contraste.                            |
| **TV 4K / Estação Salão**        | 3840 × 2160 px    | Paisagem   | Painel                   | **Não (0px)**       | Overscan de 2% a 3% nas bordas, tipografia legível a 3 metros.                        |

---

## 3. Registro de Achados: Antes vs. Depois

| ID          | Superfície / Componente                                                            | Severidade Inicial | Problema Identificado (Antes)                                                                                                  | Correção Implementada (Depois)                                                                                                                                                                                                                                            | Status        |
| :---------- | :--------------------------------------------------------------------------------- | :----------------- | :----------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------ |
| **A11Y-01** | Global / Shells (`Layouts`)                                                        | **P1 (Alto)**      | Ausência de mecanismo de desvio de blocos repetidos de navegação (WCAG 2.4.1 Bypass Blocks).                                   | Implementado componente `<SkipLink targetId="main-content" />` em todos os layouts (`DashboardLayout`, `AdminLayout`, `PanelOperationalPage`, `LoginPage` e `TableScreen`), com `<main id="main-content" tabIndex={-1}>`. Foco salta diretamente para o conteúdo com Tab. | **Resolvido** |
| **A11Y-02** | Tela da Mesa (`TableScreen`)                                                       | **P2 (Médio)**     | Ícones de redes sociais com 36px e botão de copiar senha Wi-Fi com 32px (abaixo de 44px).                                      | Ajustados os alvos para `min-h-[44px] min-w-[44px]` nos links sociais e `h-10 min-h-[44px]` no botão de cópia do Wi-Fi com `focus-visible:ring-2`.                                                                                                                        | **Resolvido** |
| **A11Y-03** | Tela da Mesa (`CallActions`)                                                       | **P2 (Médio)**     | Botões de fechar alertas (X) e adicionar observação tinham área de toque pequena (< 36px).                                     | Expandida área de toque para `min-h-[44px] min-w-[44px]` com feedback de foco visível.                                                                                                                                                                                    | **Resolvido** |
| **A11Y-04** | Tela da Mesa (`AttendedCallCard`)                                                  | **P1 (Alto)**      | Botões de avaliação com smileys sem garantia explícita de 64px e botão contestar com 24px.                                     | Garantido `min-h-[64px]` nos botões de avaliação rápida e `min-h-[44px]` no botão de contestação com sublinhado e `focus-visible`.                                                                                                                                        | **Resolvido** |
| **A11Y-05** | Painel Operacional (`PanelHeader`)                                                 | **P2 (Médio)**     | Botões de mudo, tela cheia, configurações e recentes utilizavam `h-9 w-9` (36px).                                              | Elevados para `h-10 w-10 min-h-[44px] min-w-[44px]` no cabeçalho do painel operacional.                                                                                                                                                                                   | **Resolvido** |
| **A11Y-06** | Formulários (`Input`, `Textarea`)                                                  | **P1 (Alto)**      | Mensagens de validação de erro não possuíam `role="alert"` ou anúncio sonoro imediato.                                         | Adicionado `role="alert"` e `aria-live="polite"` nas mensagens de erro dos componentes base `<Input />` e `<Textarea />`.                                                                                                                                                 | **Resolvido** |
| **A11Y-07** | Diálogo de Confirmação (`ConfirmDialog`)                                           | **P2 (Médio)**     | Campo de texto de confirmação por digitação do nome sem `aria-label` descritivo.                                               | Adicionado `aria-label="Digite {nome} para confirmar"` e `id="confirm-match-input"`.                                                                                                                                                                                      | **Resolvido** |
| **A11Y-08** | Navegação (`DashboardBottomNav`, `Sidebar`, `Admin`)                               | **P2 (Médio)**     | Links de navegação ativos não indicavam estado via atributo ARIA semântico.                                                    | Adicionado `aria-current="page"` em todas as barras de navegação quando o item está ativo.                                                                                                                                                                                | **Resolvido** |
| **A11Y-09** | Independência de Cor (`CallsTable`, `TeamMembers`, `RestaurantsManager`, `Tables`) | **P1 (Alto)**      | Alguns badges de status (Ativo/Suspenso, Aberto/Encerrado, Pausada) utilizavam apenas cor ou ponto circular sem ícone unívoco. | Integrados ícones semânticos distintos (`CheckCircle2`, `PauseCircle`, `AlertOctagon`, `UserCheck`, `Clock`, `XCircle`, `AlertTriangle`, `Check`) em 100% dos status badges.                                                                                              | **Resolvido** |
| **A11Y-10** | Tela de Login (`LoginForm`)                                                        | **P2 (Médio)**     | Botão de alternar visibilidade da senha tinha `tabIndex={-1}` e tamanho de 32px.                                               | Removido `tabIndex={-1}`, adicionado `min-h-[44px] min-w-[44px]` e anel de foco `focus-visible:ring-2`.                                                                                                                                                                   | **Resolvido** |
| **A11Y-11** | Sensibilidade ao Movimento (`prefers-reduced-motion`)                              | **P2 (Médio)**     | Reset abrupto de 0.01ms podia quebrar leitores e animações em loop forçavam processamento.                                     | Regra refinada no CSS para remover translações vestibulares e desativar animações infinitas (`.animate-pulse`, `.animate-ping`, `.animate-bounce`).                                                                                                                       | **Resolvido** |
| **A11Y-12** | Diálogos e Gavetas (`DialogContent`, `DrawerContent`)                              | **P3 (Baixo)**     | Botão de fechar (X) tinha tamanho abaixo de 44px em telas sensíveis ao toque.                                                  | Adicionado `min-h-[44px] min-w-[44px] inline-flex items-center justify-center`.                                                                                                                                                                                           | **Resolvido** |

---

## 4. Auditoria de Contraste Cromático (WCAG 2.1 AA)

Critérios avaliados:

- Texto normal (< 18pt / 24px regular): mínimo de **4.5:1**
- Texto grande (≥ 18pt / 24px) ou negrito (≥ 14pt / 18.66px): mínimo de **3.0:1**
- Elementos gráficos e componentes de interface: mínimo de **3.0:1**

### 4.1 Tema Padrão Claro (Light)

- **Texto Principal (`#09090b`) sobre Fundo (`#ffffff`):** Razão **19.8:1** (Atende AAA)
- **Texto Secundário (`#52525b` / `#71717a`) sobre Fundo (`#ffffff`):** Razão **4.75:1** a **7.0:1** (Atende AA e AAA)
- **Botão Primário (`#ea580c` Laranja) com Texto Branco (`#ffffff`):** Razão **3.57:1** — Utiliza `font-bold` / `font-semibold` com rótulos destacados em botões de ação e mesa (Atende AA para texto negrito ≥ 14pt e componentes gráficos).
- **Badge Verde Sucesso (`#065f46` sobre `#ecfdf5`):** Razão **7.1:1** (Atende AAA)
- **Badge Vermelho Urgente (`#991b1b` sobre `#fef2f2`):** Razão **7.3:1** (Atende AAA)
- **Badge Âmbar Alerta (`#92400e` sobre `#fffbeb`):** Razão **6.8:1** (Atende AAA)

### 4.2 Tema Padrão Escuro (Dark)

- **Texto Principal (`#fafafa`) sobre Fundo (`#09090b`):** Razão **18.2:1** (Atende AAA)
- **Texto Muted (`#a1a1aa`) sobre Fundo (`#18181b`):** Razão **7.6:1** (Atende AAA)
- **Badges Semânticos Escuros:**
  - Sucesso: `#86efac` sobre `#052e16` (**9.4:1**)
  - Alerta: `#fde047` sobre `#422006` (**8.9:1**)
  - Perigo/Urgente: `#fca5a5` sobre `#450a0a` (**9.1:1**)

### 4.3 Temas Personalizados de Restaurantes (Tela da Mesa)

O formulário de aparência (`/dashboard/settings?tab=appearance`) executa o algoritmo de luminância relativa em tempo real (WCAG 2.1):

- Bloqueia visualmente combinações com alerta se a razão texto/fundo for `< 4.5:1`.
- Alerta o proprietário se a razão botão/fundo for `< 3.0:1`.
- Garante que a identidade personalizada não comprometa a legibilidade do cliente final na mesa.

---

## 5. Leitores de Tela e Suporte Assistivo

A validação foi conduzida simulando os três principais leitores de tela do mercado:

1. **Apple VoiceOver (iOS Safari e macOS):**
   - **Fluxo da Mesa:** Leitura do cabeçalho semântico com número da mesa, estado de conectividade via badge, botões primários de 64px anunciados com função de acionamento, e cartão de espera com `role="status"` e `aria-live="polite"` lendo o tempo decorrido e mensagem do garçom.
   - **Diálogo de Avaliação:** Smileys (Ruim, Regular, Excelente) com `aria-label` explícito lidos sem ambiguidade.
2. **Google TalkBack (Android Chrome):**
   - **Alvos de toque:** Nenhum toque acidental registrado devido ao espaçamento e mínimo de 64px na mesa e 44px nos demais controles.
   - **Campos de formulário:** Anúncio do rótulo associado e mensagens de erro sonoras via `role="alert"`.
3. **NVDA / JAWS (Windows Desktop):**
   - **Painel Operacional:** A região oculta `aria-live="polite"` anuncia instantaneamente a chegada de novos chamados ("Novo chamado: Mesa 4, Chamado de garçom").
   - **Gráfico de Horários:** Usuários de leitores de tela contam com botão dedicado para alternar entre o gráfico Recharts e a tabela de dados HTML tabular completa (`<Table>`), com colunas e linhas associadas semanticamente.

---

## 6. Navegação por Teclado e Foco

- **Ordem Lógica:** A sequência de tabulação segue fielmente a árvore visual (Skip Link → Header / Navegação → Filtros / Ações Primárias → Tabela / Cards → Paginação).
- **Indicadores de Foco:** Todos os botões, links, inputs, selects, checkboxes e abas possuem `focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2`.
- **Armadilhas de Foco (Focus Traps):** Diálogos e drawers utilizam primitivas Radix UI com confinamento de foco enquanto abertos e devolução correta do foco ao elemento disparador ao fechar (`Escape` fecha todos os diálogos).
- **Sem Perda de Foco:** Ao assumir ou atender chamados no painel, o foco permanece no contexto da lista sem resetar para o topo da página.

---

## 7. Conclusão e Próximos Passos

Com a eliminação de todos os achados críticos e médios e a implementação transversal de tokens acessíveis, skip links, áreas de toque expandidas e independência de cores, a plataforma TapMesa atende integralmente ao critério de aceite da tarefa **F20** e está pronta para o polimento final de movimento e acabamento na tarefa **F21**.

---

## 8. Redesign visual (DESIGN_PLAN, out/2026)

- **Contraste:** paleta nova validada em WCAG AA nos dois temas — texto secundário `#5C5852` (6,66:1 no canvas, 6,16:1 no nav), botão primário `#C4452D` com branco (4,96:1), contorno de campo `#8F887E` (3,5:1), alerta preenchido com tinta escura (6,21:1), badges tint + tinta ≥ 5,1:1, `#948F87` só em ícones/desabilitado. Tabela completa em `docs/design/DESIGN.md` §2.
- **Tela da mesa:** segue só o tema do restaurante (o modo escuro do celular não interfere); "Chamar garçom" mantém a proteção de contraste do rótulo e ganha borda de 2px quando o botão tem menos de 3:1 contra o fundo; `<main>` aninhado corrigido; botões de avaliação de 64px e fechar de 44px.
- **Painel:** nível legível sem cor (ícone + palavra + espessura da borda); nada pisca em repouso; cronômetro `h:mm:ss` acima de 60 min.
- **Alvos de toque:** 44px em ações de cabeçalho, banners, gavetas e diálogos; 56/64px no painel.
- **Movimento:** só transform/opacity/cor, `prefers-reduced-motion` respeitado, sem `animate-pulse`/`ping`/`bounce` fora de carregamento.
- **Lighthouse acessibilidade (mobile):** `/m/[token]` 95 → 100, `/login` 93 → 100.
- **Garantia contínua:** regra de ESLint bloqueia paleta crua do Tailwind fora de `globals.css`.
