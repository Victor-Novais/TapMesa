# TapMesa — Plano de Redesign Visual

**Status:** aprovado em 24/10/2026, com as decisões registradas no §8. Execução por fases; linha de base no §0.4.
**Data:** 23/10/2026
**Escopo:** só aparência — cores, tipografia, espaçamento, raios, sombras, ícones, layout visual, estados visuais, movimento e responsividade.
**Fora do escopo:** rotas, contratos de API, lógica, textos de negócio, fluxos, `aria-label`s, `id`s e nomes acessíveis usados pelos testes.

Materiais de apoio (não versionados, em `design-lab/`):

- `design-lab/refs/wise/` — 335 prints de referência
- `design-lab/screens/wise-analise/` — análise por tela da Wise (`00-indice.md` e `99-sintese-para-tapmesa.md`)
- `design-lab/screens/atual/` — capturas do estado atual (ver §0.2 sobre o que falta)
- `design-lab/skills/SKILLS.md` — skills instaladas e auditoria de segurança
- `design-lab/mockups/` — mockup estático da direção proposta

---

## 0. Diagnóstico do estado atual

### 0.1 Como o visual está construído hoje

| Aspecto     | Situação encontrada                                                                                                                                                                                                                                            | Evidência                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Tokens      | `globals.css` define variáveis (`--background`, `--color-primary`…) mas **quase nada as usa**: 5 ocorrências de `var(--` em `.tsx`, contra **1.688** classes `zinc-*`, 324 `orange-*`, 185 `amber-*`, 225 `red-*`, 153 `emerald-*`                             | `src/app/globals.css`, grep em `src/`                         |
| Tailwind    | v4 sem bloco `@theme`; as cores vêm da paleta padrão do Tailwind                                                                                                                                                                                               | `src/app/globals.css`                                         |
| Modo escuro | `ThemeProvider` alterna a classe `.dark`, mas os componentes usam `dark:` (1.169 ocorrências) que, no Tailwind v4 sem `@custom-variant`, segue **só a preferência do sistema operacional**. Escolher "Claro" num sistema escuro mantém os componentes escuros. | `src/shared/ui/theme/theme-provider.tsx`, `globals.css`       |
| Animações   | 26 usos de `animate-in`, 17 `slide-in-from-*`, 10 `zoom-in-*`, mas **nenhum plugin de animação instalado** (`tw-animate-css` ausente): essas classes não fazem nada. `animate-spin-slow` (3 usos) também não existe.                                           | `package.json`, grep                                          |
| Breakpoints | `docs/design/DESIGN.md` documenta 390/600/900/1280/1920/3840, mas o código usa os padrões do Tailwind (640/768/1024/1280/1536). `xs:` é usado 1 vez e não existe → o botão "Painel" do cabeçalho do dashboard **nunca aparece**.                               | `dashboard-header.tsx:62`                                     |
| Tipografia  | Inter (UI) + JetBrains Mono em 93 lugares, inclusive em números grandes e no "Mesa N" do painel. `text-[10px]` em 24 lugares e `text-[11px]` em 49.                                                                                                            | grep                                                          |
| Superfícies | Cards brancos com borda **e** sombra; 23 usos de `backdrop-blur`; 3 gradientes decorativos; raios misturados (`rounded-xl` 134, `-2xl` 89, `-3xl` 13).                                                                                                         | grep                                                          |
| Movimento   | 17 `animate-pulse`, 4 `animate-ping`, 2 `animate-bounce` em estado de repouso (logo do painel, ícone do sino, badge Urgente, sidebar). Há bloco `prefers-reduced-motion` global.                                                                               | grep                                                          |
| Testes      | Sem testes unitários em `src/`. E2E (Playwright, 3 viewports) usa ids, `aria-label`, textos e **três seletores de classe**: `span.font-mono.text-lg` e `p.font-mono` (diálogo de credenciais) e `p.text-red-600` (só para log).                                | `e2e/smoke.spec.ts:98,109,113`, `e2e/integration.spec.ts:365` |

### 0.2 Capturas: o que foi feito e o que falta

- **Feito** (Playwright CLI, 390/768/1440, claro e escuro): `/login`, `/m/[token]` sem API (fica no esqueleto de carregamento), página 404 e a vitrine `/dev/ui` (componentes, tela da mesa com dados simulados, cards do painel). Arquivos em `design-lab/screens/atual/`.
- **Pendente:** todas as telas autenticadas (painel real em TV/tablet/mobile, dashboard, mesas, impressão, equipe, configurações, admin) e os estados reais da mesa. O back-end (`localhost:3000`) não estava no ar durante a análise. Assim que estiver, a captura roda com as credenciais do seed de dev que os próprios testes E2E usam (`E2E_ADMIN_USERNAME`/`E2E_ADMIN_PASSWORD`).
- **Atenção:** o `.env` local tem a linha `hyNEXT_PUBLIC_API_URL=…` (um "hy" sobrando no início). Com isso o Next não lê a variável e todas as páginas dão erro 500. Para capturar, passei a variável pela linha de comando; o arquivo não foi alterado.

### 0.3 Problemas encontrados, por tela e componente

Severidade: **A** = afeta legibilidade/acessibilidade ou quebra layout; **M** = inconsistência visível; **B** = acabamento.

**Global / design system**

| #   | Sev. | Componente         | Problema                                                                                                                              | Fonte                                                                                                  |
| --- | ---- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| G1  | A    | Tema               | Toggle de tema não governa os componentes (variante `dark:` por media query)                                                          | §0.1                                                                                                   |
| G2  | A    | Botão primário     | Branco sobre `orange-600` = 3,57:1; a nova Terracotta dá 4,13:1 — ambos abaixo de 4,5:1 para rótulos de 14–16px                       | cálculo §2.1                                                                                           |
| G3  | M    | Animações          | Classes de entrada sem efeito; documentação (F21) descreve animações que não acontecem                                                | §0.1                                                                                                   |
| G4  | M    | Foco               | 12 lugares usam `focus:ring` (aparece no clique) em vez de `focus-visible`; 38 `outline-none`                                         | `dialog.tsx:52`, `drawer.tsx:54`, `select.tsx:19`, `confirm-dialog.tsx:87`, `calls-table.tsx:198,218`… |
| G5  | M    | Transições         | 24 `transition-all` (lista explícita de propriedades é o padrão da casa)                                                              | `panel-call-card.tsx:207,233`, `attended-call-card.tsx:125,144,163`, `call-actions.tsx:295`…           |
| G6  | M    | Texto pequeno      | 73 ocorrências de 10–11px (piso recomendado: 12px; 11px só para metadados)                                                            | `panel-call-card.tsx:168`, `pending-call-card.tsx:130`, `audit-logs-manager.tsx:437-494`…              |
| G7  | M    | Superfícies        | Borda + sombra juntas; `backdrop-blur` em 23 lugares (custo em celular barato, e é "vidro")                                           | `card.tsx`, `table-screen.tsx`                                                                         |
| G8  | M    | Cores ad hoc       | Status em 5 famílias (orange, amber, emerald, red, blue) + ícones de KPI em 5 cores                                                   | `analytics-kpis.tsx`                                                                                   |
| G9  | B    | Toque              | Sem `touch-action: manipulation`, sem `-webkit-tap-highlight-color`, sem `overscroll-behavior: contain` em diálogos/gavetas           | grep                                                                                                   |
| G10 | B    | Tema escuro nativo | Sem `color-scheme` no `<html>` (barras de rolagem e inputs nativos ficam claros no escuro); `theme-color` fixo em `#ffffff`/`#09090b` | `layout.tsx:39-42`                                                                                     |
| G11 | B    | Gráfico            | Cores do Recharts fixas em hex (`#e4e4e7`, `#71717a`, `#ea580c`), não seguem o tema                                                   | `hourly-chart.tsx:181-205`                                                                             |

**Tela da mesa (`/m/[token]`)**

| #   | Sev. | Componente            | Problema                                                                                                                                                                                                                                                                                     |
| --- | ---- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1  | A    | Tema                  | Cards, selo de boas-vindas e Wi-Fi seguem o modo escuro **do celular** (`dark:`), enquanto o fundo segue o tema do restaurante: num celular escuro, restaurante de fundo claro recebe cartões escuros. Evidência: `design-lab/screens/atual/mesa-vitrine-claro-livre__mobile-390__dark.png`. |
| T2  | A    | Botão "Chamar garçom" | Sempre `orange-600`; `--table-primary` do restaurante é calculado mas **não é usado**, embora a pré-visualização em Aparência mostre o botão com a cor do restaurante (`live-phone-preview.tsx:149`). Ver pergunta Q3.                                                                       |
| T3  | A    | Card confirmado       | Botão de fechar com `p-1` (~24px), abaixo de 44px                                                                                                                                                                                                                                            | `confirmed-call-card.tsx` |
| T4  | M    | Textos                | Informação importante em 11–12px (hora do pedido, tempo de espera, prazo de confirmação, Wi-Fi)                                                                                                                                                                                              |
| T5  | M    | Esqueleto             | Logo 64px no esqueleto x 80px real; esqueleto sem a linha "Mesa N / Conectado" → salto ao carregar                                                                                                                                                                                           |
| T6  | M    | Movimento             | Sino com `animate-pulse` e ponto com `animate-ping` em repouso; faixas em gradiente                                                                                                                                                                                                          |
| T7  | M    | Estrutura             | `<main>` dentro de `<main>` (página + `TableScreen`/`TableScreenError`)                                                                                                                                                                                                                      |
| T8  | B    | Wi-Fi                 | "Wi-Fi do Restaurante" quebra em duas linhas a 390px e o nome da rede é truncado (captura `mesa-vitrine-claro-*__mobile-390`)                                                                                                                                                                |

**Painel da equipe (`/panel`)**

| #   | Sev. | Componente       | Problema                                                                                                       |
| --- | ---- | ---------------- | -------------------------------------------------------------------------------------------------------------- |
| P1  | A    | Card (390px)     | Com o selo "Reaberto", o cronômetro **vaza do card** (captura `painel-vitrine-cards__mobile-390__light.png`)   |
| P2  | A    | Card             | "Chamar Garçom" quebra em duas linhas na grade de 3–5 colunas                                                  |
| P3  | A    | TV               | Selo de nível em `text-xs` (12px), rótulo "ESPERA" em 10px, contadores do cabeçalho em 12–14px: ilegíveis a 3m |
| P4  | A    | Cronômetro       | Espera longa vira `3726:36` (minutos acumulados), difícil de ler; ver Q9                                       |
| P5  | M    | Semântica de cor | "Normal" usa verde de sucesso, e "Conta" também é verde: duas mensagens na mesma cor                           |
| P6  | M    | Urgente          | `animate-pulse` no selo e na faixa: texto piscando perde legibilidade a distância                              |
| P7  | A    | Banner offline   | "Reconectar Agora" e "Reconectar SSE" com `h-8` (32px)                                                         |
| P8  | M    | Layout TV        | Não existe modo TV; só breakpoints (`2xl` = 1536px → 5 colunas). Não há tamanho de fonte por distância.        |
| P9  | B    | Mesa             | "Mesa N" em monoespaçada pesada (`font-black font-mono`)                                                       |

**Dashboard (Resumo do Dia e demais)**

| #   | Sev. | Componente    | Problema                                                                                                                 |
| --- | ---- | ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| D1  | M    | KPIs          | 6 cartões numa grade de 4 colunas → 2 órfãos na segunda linha; o esqueleto mostra 4 cartões → salto de layout            |
| D2  | M    | KPIs          | Ícones em quadrados coloridos (5 cores), nenhum número lidera                                                            |
| D3  | M    | Shell         | Botão "Painel" do cabeçalho invisível (`xs:` não existe); logo laranja com sombra laranja                                |
| D4  | B    | Sidebar       | Botão de recolher `h-8 w-8`; ícone do "Painel de Atendimento" pulsando                                                   |
| D5  | M    | Tabelas       | Cabeçalhos e números sem alinhamento à direita/tabular consistentes; mono em vez de `tabular-nums`                       |
| D6  | M    | Configurações | Barras flutuantes de "alterações pendentes" (`fixed`) podem cobrir o último campo no celular; verificar com captura real |

**Login / Admin**

| #   | Sev. | Componente | Problema                                                                          |
| --- | ---- | ---------- | --------------------------------------------------------------------------------- |
| L1  | B    | Login      | Foco automático no usuário com anel laranja grosso (borda + ring) já na abertura  |
| L2  | B    | Admin      | Selo "TapMesa Admin" preto/branco destoa do resto; metadados de auditoria em 10px |

### 0.4 Linha de base medida (Fase 0, 24/10/2026)

Ambiente: build de produção (`next build` + `next start`), back-end local com o restaurante de teste "Design Lab Trattoria" (12 mesas, 1 garçom, alerta 60 s / urgente 120 s). Capturas em `design-lab/screens/fase0/` (187 arquivos: painel em 390/768/1440/1920, dashboard, mesas, impressão, equipe, configurações, admin, mesa em 8 estados e vitrine `/dev/ui`, claro e escuro). Scripts em `design-lab/scripts/` e `design-lab/perf/`.

**JS inicial por rota** (soma dos scripts baixados no 1º acesso, gzip nível 9 — `design-lab/perf/measure-js.cjs`):

| Rota                  | Scripts | gzip         |
| --------------------- | ------- | ------------ |
| `/m/[token]`          | 18      | **279,6 KB** |
| `/login`              | 15      | 249,7 KB     |
| `/panel`              | 21      | 294,1 KB     |
| `/dashboard`          | 22      | 394,2 KB     |
| `/dashboard/settings` | 22      | 316,8 KB     |
| `/dashboard/tables`   | 21      | 293,8 KB     |
| `/admin`              | 21      | 289,2 KB     |

O valor de 128,8 KB registrado no F22 não se reproduz com o código atual (React DOM sozinho soma 70 KB gzip nessa rota). **Meta aprovada para o redesign: não aumentar — `/m/[token]` ≤ 279,6 KB gzip (± 1 KB).**

**Lighthouse mobile** (12.8.2, rede simulada):

| Rota                      | Perf. | A11y | Boas práticas | FCP   | LCP   | CLS   | TBT   | Falhas de A11y              |
| ------------------------- | ----- | ---- | ------------- | ----- | ----- | ----- | ----- | --------------------------- |
| `/m/[token]` (mesa livre) | 86    | 95   | 93            | 1,1 s | 4,1 s | 0     | 90 ms | contraste                   |
| `/login`                  | 87    | 93   | 93            | 1,1 s | 4,0 s | 0,012 | 80 ms | contraste, ordem de títulos |

**E2E na linha de base:** já falha por motivos alheios ao design — `smoke.spec.ts` usa a senha de admin fixa no código (`Admin@123456`, linhas 54–55) e não lê `E2E_ADMIN_PASSWORD`; `integration.spec.ts` espera o cabeçalho `x-table-url` na resposta do QR, que o back-end local não envia (linha 137). Ver Q15.

**Achados novos da Fase 0** (não são de design; registrados, não corrigidos):

- Resumo do Dia mostra **8** KPIs (o plano dizia 6) e "% Dentro da Meta" chega a **450,0%** — cálculo/dado acima de 100%.
- O back-end devolve uma aparência padrão com cores concretas (`#0f172a`, `#f97316`, `#1e293b`, `#f8fafc`) para restaurantes que nunca personalizaram; o front não distingue "sem personalização" de "escolheu essas cores". Ver Q16.
- Na TV (1920, 5 colunas), "Mesa 12" quebra em duas linhas.
- Na mesa com o celular em modo **claro** e o fundo padrão escuro, "Adicionar observação opcional" fica quase ilegível (T1 em sentido inverso).

Validação: os itens G e T/P/D com arquivo:linha vêm da revisão pela **Web Interface Guidelines** (regras baixadas de `vercel-labs/web-interface-guidelines`); os de hierarquia, cor e densidade vêm da **Taste Skill** (`references/app-screens.md`). Regras de copy das duas skills (reticências, caixa de título) foram ignoradas: textos não mudam.

---

## 1. Direção de design

### 1.1 Princípios

1. **Uma pergunta por tela, respondida pelo maior elemento.** Mesa: "quero chamar alguém". Painel: "quem está esperando há mais tempo?". Resumo do Dia: "como foi/está o atendimento hoje?". (Wise 02, 03 — prints 29, 34)
2. **Cor com função.** Fundo e navegação neutros e quentes; Terracotta nas ações principais e na marca; Sage/Saffron/Chili só para estado. Nunca uma cor sozinha comunica estado: sempre ícone + palavra. (Wise 17 — print 229)
3. **Estado escrito, no lugar do problema.** Erros dentro do card/diálogo, botão desabilitado com motivo, status por extenso. (Wise 04, 03 — prints 42, 37)
4. **Superfícies planas por degraus de tom.** Borda **ou** sombra, nunca as duas; sombra só no que flutua. (Wise 20 — print 300)
5. **Calma por padrão, urgência só quando há.** Nada pisca em repouso; o painel ganha peso visual apenas em Alerta/Urgente.
6. **O restaurante continua dono da tela da mesa.** Tokens TapMesa são o padrão; o tema do restaurante sobrescreve exatamente o que sobrescreve hoje.

### 1.2 Tom

Acolhedor e profissional: cozinha bem organizada, não restaurante temático. Superfícies cor de linho e cerâmica, tinta quase preta, Terracotta como chama do fogão — usada com parcimônia.

### 1.3 O que aproveitar da Wise (detalhes em `design-lab/screens/wise-analise/99-sintese-para-tapmesa.md`)

| Padrão                                                   | Onde                                   | Print    |
| -------------------------------------------------------- | -------------------------------------- | -------- |
| Número líder grande + ações logo abaixo                  | Resumo do Dia                          | 29       |
| KPIs como tipografia em faixa dividida                   | Resumo do Dia, métricas da equipe      | 162, 226 |
| Só o período em foco colorido no gráfico                 | Gráfico por hora                       | 229, 304 |
| Barras horizontais finas para ranking                    | Ranking de mesas                       | 229      |
| Linha do tempo de eventos                                | Recentes do painel, detalhe do chamado | 46, 157  |
| Lista de ajustes (título, descrição, controle à direita) | Configurações                          | 236, 276 |
| Gaveta de filtros com contador e Limpar/Aplicar fixos    | Chamados, auditoria, mesas             | 138–144  |
| QR central em cartão + ações empilhadas                  | Modal de QR                            | 54, 246  |
| Erro dentro do contexto                                  | Cards, diálogos, login                 | 42       |
| Estado sobre o objeto                                    | Mesa pausada                           | 117      |
| Destrutivo em escala (contorno → cheio na confirmação)   | Excluir/suspender                      | 183–190  |
| Faixa de pendência com ação                              | Painel desconectado                    | 57       |
| Controle segmentado em trilho                            | Abas Membros/Desempenho                | 191      |
| Toast escuro de uma linha                                | Toasts                                 | 153      |
| Escuro por degraus de luminosidade                       | Tema escuro                            | 300      |

**Não aproveitar:** verde-limão/floresta, wordmark, ilustrações 3D, títulos display em caixa alta, textos e tom de voz; telas de sucesso em tela cheia para ações rotineiras; densidade baixa no painel de TV.

### 1.4 Nota sobre a Taste Skill

A Taste Skill proíbe explicitamente "fundo creme com terracota" (é a paleta típica de assistentes de IA). Como a paleta é obrigatória, ela foi tratada como **marca existente** (`--keep palette,type`). Para evitar o ar genérico que essa regra quer prevenir, o plano: (a) usa Terracotta só em ações e marca, nunca em superfícies amplas; (b) dá ao TapMesa um elemento próprio (o card de chamado e o número da mesa como protagonistas); (c) mantém fundos neutro-quentes muito claros, não amarelados.

---

## 2. Design tokens

### 2.1 Cores — tema claro (valores definidos por você)

| Token        | Valor                      | Uso                                                                  |
| ------------ | -------------------------- | -------------------------------------------------------------------- |
| `--canvas`   | `#F9F8F6` Warm Alabaster   | fundo do app                                                         |
| `--nav`      | `#F2EFE9` Raw Linen        | sidebar, bottom nav, trilhos de controles segmentados                |
| `--surface`  | `#FFFFFF` Pure Ceramic     | cards, tabelas, modais, gavetas                                      |
| `--ink`      | `#141615` Cast Iron        | texto primário                                                       |
| `--ink-2`    | `#5C5852` Roasted Umber    | texto secundário                                                     |
| `--ink-3`    | `#948F87` Dry Clay         | **só** ícones decorativos, desabilitado, texto ≥ 24px (3,03:1)       |
| `--brand`    | `#D94E34` Terracotta Ember | logo, marca, anel de foco, destaques gráficos, CTA com rótulo grande |
| `--espresso` | `#2A2421` Deep Espresso    | cabeçalhos executivos, toasts, tooltips, sidebar escura opcional     |
| `--success`  | `#2E6F40` Fresh Sage       |                                                                      |
| `--warning`  | `#D9822B` Saffron          | preenchimentos com texto Cast Iron                                   |
| `--danger`   | `#C92A2A` Chili Crisp      |                                                                      |

**Derivados propostos (para passar AA sem mudar a paleta):**

| Token                                                                  | Valor                                         | Por quê                                                                                            |
| ---------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `--primary` (preenchimento de botão)                                   | `#C4452D`                                     | branco sobre `#D94E34` dá 4,13:1; sobre `#C4452D` dá **4,96:1**. Visualmente ainda é a Terracotta. |
| `--primary-hover` / `--primary-active`                                 | `#B23E29` / `#9F3724`                         | escurecer no hover (5,81:1)                                                                        |
| `--primary-ink` (Terracotta como texto/link)                           | `#B23E29`                                     | 5,81:1 no branco, 5,47:1 no canvas                                                                 |
| `--ink-placeholder`                                                    | `#6E6A64`                                     | Dry Clay dá 3,03:1; este dá 5,06:1 no canvas e 4,68:1 no Raw Linen                                 |
| `--warning-ink`                                                        | `#8F531A`                                     | Saffron como texto dá 2,93:1; este dá 6,14:1 no branco                                             |
| `--danger-ink`                                                         | `#A82424`                                     | Chili sobre o fundo rosado do badge dá 4,38:1; este dá 5,73:1                                      |
| `--border`                                                             | `#E6E1D8`                                     | borda de card (1,30:1 — estrutural, não interativa)                                                |
| `--border-control`                                                     | `#8F887E`                                     | borda de input/checkbox: **3,51:1** (WCAG 1.4.11 pede 3:1)                                         |
| `--success-tint` / `--warning-tint` / `--danger-tint` / `--brand-tint` | `#E3EFE6` / `#FBEBD9` / `#F9E1DF` / `#FBE6E0` | fundos de badge/aviso                                                                              |

### 2.2 Cores — tema escuro (**proposta para aprovação**)

| Token                                | Claro              | Escuro proposto | Como foi derivado                          |
| ------------------------------------ | ------------------ | --------------- | ------------------------------------------ |
| `--canvas`                           | `#F9F8F6`          | `#141615`       | Cast Iron                                  |
| `--nav`                              | `#F2EFE9`          | `#1F1D1B`       | 50% entre Cast Iron e Deep Espresso        |
| `--surface` (cards)                  | `#FFFFFF`          | `#2A2421`       | Deep Espresso                              |
| `--raised` (modais, menus, popovers) | `#FFFFFF` + sombra | `#36302C`       | Espresso um degrau acima                   |
| `--ink`                              | `#141615`          | `#F9F8F6`       | Warm Alabaster                             |
| `--ink-2`                            | `#5C5852`          | `#C9C3BA`       | Alabaster esfriado na direção do Dry Clay  |
| `--ink-3` (decorativo)               | `#948F87`          | `#A39C92`       | —                                          |
| `--ink-placeholder`                  | `#6E6A64`          | `#A39C92`       | ≥ 4,5:1 em todas as superfícies escuras    |
| `--brand`                            | `#D94E34`          | `#D94E34`       | mantida (logo, gráficos, marcas grandes)   |
| `--primary` (fill)                   | `#C4452D`          | `#C4452D`       | igual nos dois temas, rótulo branco 4,96:1 |
| `--primary-ink`                      | `#B23E29`          | `#E86E55`       | Terracotta clareada só para texto/link     |
| `--success`                          | `#2E6F40`          | `#62B079`       | Sage clareada (texto 5,83:1 no card)       |
| `--warning`                          | `#D9822B`          | `#E39343`       | Saffron clareada levemente                 |
| `--danger`                           | `#C92A2A`          | `#EC7066`       | Chili clareada (texto 5,15:1 no card)      |
| `--success-tint`                     | `#E3EFE6`          | `#1E3325`       |                                            |
| `--warning-tint`                     | `#FBEBD9`          | `#3A2A17`       |                                            |
| `--danger-tint`                      | `#F9E1DF`          | `#3A1F1C`       |                                            |
| `--brand-tint`                       | `#FBE6E0`          | `#3B2219`       |                                            |
| `--border`                           | `#E6E1D8`          | `#433D3B`       |                                            |
| `--border-control`                   | `#8F887E`          | `#7A736D`       | 3,28:1 no card, 3,90:1 no canvas           |
| `--focus-ring`                       | `#D94E34`          | `#E86E55`       | 3,89:1 e 5,88:1 contra o fundo             |

### 2.3 Razões de contraste calculadas (WCAG 2.1, luminância relativa)

Mínimos: texto normal 4,5:1; texto grande (≥ 24px, ou ≥ 18,66px negrito) 3:1; componentes e foco 3:1.

**Texto sobre fundo**

| Par                                                   | Claro                        | Escuro              |
| ----------------------------------------------------- | ---------------------------- | ------------------- |
| `--ink` sobre canvas                                  | 17,13 ✅                     | 17,13 ✅            |
| `--ink` sobre nav                                     | 15,84 ✅                     | 15,83 ✅            |
| `--ink` sobre surface                                 | 18,18 ✅                     | 14,41 ✅            |
| `--ink-2` sobre canvas                                | 6,66 ✅                      | 10,39 ✅            |
| `--ink-2` sobre nav                                   | 6,16 ✅                      | 9,60 ✅             |
| `--ink-2` sobre surface                               | 7,06 ✅                      | 8,74 ✅             |
| `--ink-2` sobre raised                                | 7,06 ✅                      | 7,42 ✅             |
| `--ink-3` Dry Clay sobre surface                      | 3,21 ⚠️ só decorativo/grande | 5,63 ✅             |
| `--ink-placeholder` sobre canvas / surface            | 5,06 / 5,37 ✅               | 6,69 / 5,63 ✅      |
| `--ink-placeholder` sobre raised                      | —                            | 4,78 ✅             |
| `--primary-ink` sobre surface                         | 5,81 ✅                      | 4,95 ✅             |
| `--brand` como texto sobre surface                    | 4,13 ❌ (só ≥ 24px)          | 3,71 ❌ (só ≥ 24px) |
| Texto claro sobre Deep Espresso (cabeçalho executivo) | 14,41 ✅                     | —                   |

**Botões**

| Par                                               | Claro                                                          | Escuro                    |
| ------------------------------------------------- | -------------------------------------------------------------- | ------------------------- |
| Branco sobre `--primary` `#C4452D`                | 4,96 ✅                                                        | 4,96 ✅                   |
| Branco sobre hover `#B23E29`                      | 5,81 ✅                                                        | 5,81 ✅                   |
| Branco sobre `--brand` `#D94E34`                  | 4,13 — ✅ só rótulo ≥ 18,66px negrito (botões de 64px da mesa) | idem                      |
| `--primary` contra o fundo (componente)           | 4,67 ✅                                                        | 3,67 ✅ (3,09 sobre card) |
| Branco sobre Sage / Cast Iron sobre Sage escuro   | 6,06 ✅                                                        | 6,93 ✅                   |
| Branco sobre Chili / Cast Iron sobre Chili escuro | 5,46 ✅                                                        | 6,12 ✅                   |
| Cast Iron sobre Saffron (os dois temas)           | 6,21 ✅                                                        | 6,21 ✅                   |
| Branco sobre Saffron                              | 2,93 ❌ — não usar                                             | —                         |

**Badges semânticos (texto sobre tint)**

| Par     | Claro                           | Escuro                          |
| ------- | ------------------------------- | ------------------------------- |
| Sucesso | `#2E6F40` / `#E3EFE6` = 5,13 ✅ | `#62B079` / `#1E3325` = 5,15 ✅ |
| Alerta  | `#8F531A` / `#FBEBD9` = 5,26 ✅ | `#E39343` / `#3A2A17` = 5,59 ✅ |
| Perigo  | `#A82424` / `#F9E1DF` = 5,73 ✅ | `#EC7066` / `#3A1F1C` = 5,08 ✅ |
| Marca   | `#B23E29` / `#FBE6E0` = 4,84 ✅ | `#E86E55` / `#3B2219` = 4,75 ✅ |

**Bordas e foco**

| Par                              | Claro   | Escuro  |
| -------------------------------- | ------- | ------- |
| `--border-control` sobre surface | 3,51 ✅ | 3,28 ✅ |
| `--border-control` sobre canvas  | 3,30 ✅ | 3,90 ✅ |
| `--focus-ring` contra canvas     | 3,89 ✅ | 5,88 ✅ |

O script do cálculo está documentado em `design-lab/skills/contrast.mjs` (cópia do usado na análise).

### 2.4 Personalização do restaurante (preservada)

Hoje o tema do restaurante (`TableThemeProvider`, `call-actions.tsx`) sobrescreve **apenas**:

- `colors.background` / `backgroundType` / `backgroundValue` → fundo da tela da mesa (cor ou imagem com película);
- `colors.text` → cor do texto solto sobre o fundo (com proteção de contraste 4,5:1 via `getAccessibleTextColor`);
- `colors.secondary` → fundo do botão "Pedir a conta" (texto com proteção de contraste);
- `colors.primary` → só na impressão de QR (`table-print-card.tsx`) e na pré-visualização de Aparência.

O plano mantém exatamente isso:

- Os tokens TapMesa entram como **padrão** onde não há valor do restaurante (por exemplo, `--table-bg` cai para `--canvas` se o restaurante não definiu fundo — **mudança de padrão, ver Q2**).
- Cards, selos e Wi-Fi na tela da mesa passam a usar **tokens próprios da mesa** (`--table-card`, `--table-card-ink`) derivados de `--table-bg` e `--table-text`, em vez de `dark:` do sistema operacional (corrige T1 sem mudar o que o restaurante controla). Ver Q4.
- O algoritmo de contraste não muda. Apenas a constante de "tinta escura" usada quando o texto do restaurante falha (`#09090b`) passa a `#141615` — mesma função, ver Q2.
- O botão "Chamar garçom" continua **não** usando a cor do restaurante, a menos que você aprove o contrário (Q3).

### 2.5 Tipografia

| Item               | Proposta                                                                                                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Família            | Uma só: **Inter** (já carregada via `next/font`, zero custo de bundle e CLS). Alternativa com mais caráter em Q1.                                                                                    |
| Monoespaçada       | JetBrains Mono **só** para senhas temporárias, tokens e IDs (mantém `span.font-mono.text-lg` e `p.font-mono` do diálogo de credenciais, usados pelo E2E). Números passam a Inter com `tabular-nums`. |
| Pesos              | 400, 500, 600, 700. `font-black` (900) e `font-extrabold` saem.                                                                                                                                      |
| Escala (app)       | 12 / 14 / 16 / 20 / 24 / 32 — rótulos 12, corpo 14 (16 em inputs), título de card 16, título de página 24, KPI líder 32                                                                              |
| Escala (mesa)      | 14 / 16 / 20 / 24 — corpo mínimo 14, botões de ação 20/600 (rótulo "grande" para AA), nome do restaurante 24                                                                                         |
| Escala (painel TV) | fluida com `clamp()`: número da mesa `clamp(2rem, 2.2vw + 1rem, 4.5rem)`; cronômetro `clamp(1.75rem, 2vw + 1rem, 4rem)`; nível `clamp(0.875rem, 0.6vw + 0.5rem, 1.5rem)`                             |
| Entrelinha         | 1.5 para corpo; 1.25 para títulos; 1.1 para números grandes                                                                                                                                          |
| Tracking           | 0 no corpo; −0.01em ≥ 24px; −0.02em ≥ 32px                                                                                                                                                           |
| Casos              | Sentence case; caixa alta só no selo de nível do painel (Normal/Alerta/Urgente), sem tracking exagerado                                                                                              |
| Piso               | 12px no app; 11px só em metadados de auditoria; 14px na mesa                                                                                                                                         |

### 2.6 Espaçamento

Base 4px. Tokens: `--space-1..12` = 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.

- Gutter de página: 16 (mobile), 24 (tablet), 32 (desktop), 48–64 (TV).
- Gap de grade e entre cards: 16 (um só valor por tela).
- Padding de card: 20 (mobile) / 24 (≥ 768).
- Seção a seção: 32 (mobile) / 48 (desktop).
- Linha de tabela: 48px; linha de lista com 2 linhas: 64px.

### 2.7 Raios

| Token           | Valor  | Uso                                                       |
| --------------- | ------ | --------------------------------------------------------- |
| `--radius-xs`   | 6px    | badges retangulares, chips de tabela                      |
| `--radius-sm`   | 10px   | inputs, botões do app, itens de menu                      |
| `--radius-md`   | 14px   | cards, tabelas, painéis                                   |
| `--radius-lg`   | 20px   | modais, gavetas, cards de chamado, botões de 64px da mesa |
| `--radius-full` | 9999px | pílulas, avatares, controle segmentado, switches          |

Hoje há 4 raios principais misturados (`xl`, `2xl`, `3xl`, `full`); a proposta fixa 5 papéis e sobrescreve os valores das variáveis `--radius-*` que já existem.

### 2.8 Sombras e elevação

| Nível | Claro                             | Escuro                                          | Uso                               |
| ----- | --------------------------------- | ----------------------------------------------- | --------------------------------- |
| 0     | nenhuma, borda `--border`         | nenhuma, fundo `--surface`                      | cards em repouso                  |
| 1     | `0 1px 2px rgb(20 22 21 / .06)`   | nenhuma                                         | botões elevados, cabeçalho fixo   |
| 2     | `0 8px 24px rgb(20 22 21 / .10)`  | fundo `--raised` + `0 8px 24px rgb(0 0 0 / .4)` | menus, popovers, toasts, tooltips |
| 3     | `0 16px 48px rgb(20 22 21 / .16)` | `--raised` + `0 16px 48px rgb(0 0 0 / .5)`      | modais, gavetas                   |

Overlay: `rgb(20 22 21 / .48)` claro, `rgb(0 0 0 / .64)` escuro. **Sem** `backdrop-blur` (exceto, se aprovado, sobre imagem de fundo do restaurante — Q6).

### 2.9 Bordas

1px em tudo; 2px só em seleção (cartão de opção selecionado, card de chamado Alerta/Urgente). Linhas de tabela `--border` mais claro (`#EFEBE4` / `#38322E`). Tracejado só em área de upload e em estados vazios.

### 2.10 Movimento

| Token              | Valor                           | Uso                                       |
| ------------------ | ------------------------------- | ----------------------------------------- |
| `--motion-instant` | 100ms                           | hover, cor                                |
| `--motion-fast`    | 150ms                           | press, tooltip, toast saindo              |
| `--motion-base`    | 200ms                           | menus, modais entrando                    |
| `--motion-slow`    | 250ms                           | gavetas                                   |
| `--ease-out`       | `cubic-bezier(0.16, 1, 0.3, 1)` | entradas (já existe como `--motion-ease`) |
| `--ease-in`        | `cubic-bezier(0.4, 0, 1, 1)`    | saídas                                    |

Regras: só `transform`/`opacity`/cor; nada pisca em repouso; Urgente pode ter **um** pulso de borda a cada 2s (não no texto), desligado em `prefers-reduced-motion`; animações de entrada de diálogos/toasts implementadas com CSS próprio (Q5) ou removidas.

### 2.11 Z-index

| Token         | Valor | Hoje                                                  |
| ------------- | ----- | ----------------------------------------------------- |
| `--z-base`    | 0     | —                                                     |
| `--z-sticky`  | 20    | —                                                     |
| `--z-header`  | 30    | `z-30` (dashboard header)                             |
| `--z-nav`     | 40    | `z-40` (bottom nav, header do painel, offline banner) |
| `--z-overlay` | 50    | `z-50` (overlay, dialog, drawer)                      |
| `--z-toast`   | 60    | hoje `z-50` (pode ficar atrás de modal)               |
| `--z-tooltip` | 70    | —                                                     |

### 2.12 Como mapear para o que já existe

1. **`src/app/globals.css`** passa a ser a única fonte: variáveis acima em `:root`, `.dark`/`[data-theme="dark"]` e no bloco `prefers-color-scheme` (mantendo o comportamento "Sistema").
2. Adicionar `@theme inline { --color-canvas: var(--canvas); --color-ink: var(--ink); … --radius-md: var(--radius-md); … }` para gerar utilitários Tailwind (`bg-canvas`, `text-ink-2`, `border-control`, `rounded-md`…).
3. Adicionar `@custom-variant dark (&:where(.dark, .dark *, [data-theme=dark], [data-theme=dark] *));` para o `dark:` obedecer ao `ThemeProvider` (corrige G1). Com tokens, a maioria dos `dark:` some.
4. Substituir `zinc/orange/emerald/amber/red/blue-*` por utilitários de token, componente por componente (fases 2–7). Um lint simples (`grep` no CI ou regra ESLint `no-restricted-syntax` para classes de paleta) impede regressão — ver Q10.
5. `docs/design/DESIGN.md` é atualizado para apontar para estes tokens ao final da fase 1.
6. Recharts lê cores via `getComputedStyle` das variáveis (G11).

---

## 3. Componentes

Formato: **atual → desejado**, seguido dos estados visuais. Todos os estados: repouso, hover, foco visível (anel 2px `--focus-ring` com afastamento 2px), ativo/pressionado, desabilitado, carregando, erro (quando aplicável). Radix continua como base; nenhuma API de componente muda (mesmas props e variantes).

| Componente                    | Atual                                                                                  | Desejado                                                                                                                                                                                                                                                                                          | Estados                                                                                                                                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Button**                    | `orange-600`, 6 variantes, `rounded-xl`, `active:scale-[0.97]`, foco `ring-orange-500` | `primary` = `--primary` com rótulo branco; `secondary` = `--nav` com tinta; `outline` = surface + `--border-control`; `ghost` = transparente; `danger` = `--danger`; `success` = `--success`. Raio `--radius-sm` (app) / `--radius-lg` (`size="table"`). Sombra nível 0 (só `table` com nível 1). | hover: escurece 1 degrau; ativo: escala 0,98 + 2º degrau; foco: anel; desabilitado: `--nav` + `--ink-3`, sem opacidade 50% (ilegível); carregando: spinner 16px no lugar do ícone, largura preservada |
| **IconButton**                | igual ao Button                                                                        | ícone 20px `--ink-2`, área 44×44 sempre (sem o `sm:min-h-[36px]`)                                                                                                                                                                                                                                 | idem + tooltip                                                                                                                                                                                        |
| **Input / Textarea / Select** | borda zinc-200, foco laranja com borda + anel                                          | fundo surface, borda `--border-control`, raio `--radius-sm`, altura 44, placeholder `--ink-placeholder`, contador à direita em 12px                                                                                                                                                               | hover: borda `--ink-2`; foco: anel; erro: borda e texto `--danger`, ícone ⚠ antes da mensagem; desabilitado: fundo `--nav`; somente leitura: sem borda, fundo `--nav`                                 |
| **Checkbox / Switch**         | Radix, cores zinc/orange                                                               | checkbox 20px raio 6; switch 44×24, ligado `--ink` (claro) / `--ink` claro (escuro) — Wise e Taste preferem tinta neutra ao acento                                                                                                                                                                | foco, desabilitado, carregando (switch salvando: polegar com spinner)                                                                                                                                 |
| **Card**                      | borda + sombra, `rounded-2xl`                                                          | borda `--border`, sem sombra, raio `--radius-md`, padding 20/24                                                                                                                                                                                                                                   | interativo: hover borda `--border-control`; selecionado: borda 2px `--ink`                                                                                                                            |
| **StatCard / KPI**            | cartão com ícone em quadrado colorido, valor mono                                      | **faixa dividida**: um card com colunas separadas por 1px; rótulo 12/500 `--ink-2`, valor 24/600 `tabular-nums`; um KPI líder 32px; meta como badge tint                                                                                                                                          | carregando: barra cinza na altura real do valor; vazio: "0" impresso, ausente: "—"                                                                                                                    |
| **Badge**                     | 6 variantes coloridas com borda                                                        | tint + tinta da mesma família, sem borda, 24px de altura, ícone 14px obrigatório nos de estado                                                                                                                                                                                                    | —                                                                                                                                                                                                     |
| **Tabela (DataTable)**        | borda, cabeçalho comum                                                                 | cabeçalho 12px `--ink-2` sentence case sem faixa; números à direita com `tabular-nums`; linhas 48px; sem zebra; hover de linha `--canvas`                                                                                                                                                         | vazio: frase na largura toda; carregando: linhas com barras; erro: frase + "Tentar novamente" dentro da tabela                                                                                        |
| **Tabs**                      | Radix                                                                                  | dois estilos: sublinhado (Configurações) e controle segmentado em trilho `--nav` com pílula surface (Membros/Desempenho, cenários)                                                                                                                                                                | foco, desabilitado                                                                                                                                                                                    |
| **Dialog**                    | bottom sheet no mobile, centro no desktop, overlay preto/60 + blur                     | igual na forma; raio `--radius-lg`, sombra nível 3, overlay sem blur, × 44px em disco `--nav`, `overscroll-behavior: contain`                                                                                                                                                                     | erro inline no topo do conteúdo (faixa `--danger-tint`), carregando no botão de confirmação                                                                                                           |
| **ConfirmDialog**             | ícone vermelho em quadrado                                                             | destrutivo: botão `danger` cheio + "Cancelar" outline; consequência em 1 frase; campo de digitação do nome mantém `id`/`aria-label`                                                                                                                                                               | —                                                                                                                                                                                                     |
| **Drawer**                    | direita/esquerda/baixo, borda                                                          | igual; sombra nível 3; cabeçalho com título à esquerda (hoje só ×); rodapé fixo para ações                                                                                                                                                                                                        | —                                                                                                                                                                                                     |
| **Toast**                     | canto inferior direito, ícones coloridos                                               | **toast escuro** `--espresso` com texto claro, uma linha, ícone de estado à esquerda; erro mantém borda-esquerda `--danger`; `--z-toast` acima de modais                                                                                                                                          | entrada 200ms, saída 150ms                                                                                                                                                                            |
| **Tooltip**                   | Radix                                                                                  | `--espresso`, 12px, raio 6                                                                                                                                                                                                                                                                        | —                                                                                                                                                                                                     |
| **Navegação (Sidebar)**       | branca com bordas, ativo laranja, logo com sombra laranja                              | fundo `--nav`, sem borda; item ativo pílula `--surface` com tinta `--ink` (ou `--espresso` com texto claro — Q7); ícones 18px `--ink-2`; botão "Painel de Atendimento" como botão outline com ícone Radio **sem pulso**                                                                           | foco, hover `--surface` 60%                                                                                                                                                                           |
| **Bottom nav (mobile)**       | branca/95 + blur                                                                       | `--nav` opaco, ativo: ícone e rótulo `--ink` + barra 3px `--brand` em cima                                                                                                                                                                                                                        | —                                                                                                                                                                                                     |
| **Header do dashboard**       | branco/90 + blur                                                                       | `--canvas` opaco com borda inferior `--border` ao rolar                                                                                                                                                                                                                                           | —                                                                                                                                                                                                     |
| **Skeleton**                  | `animate-pulse` zinc                                                                   | blocos `--nav` na **forma exata** do conteúdo (mesmo número de cards, mesma altura), sem shimmer; pulso suave só se `prefers-reduced-motion: no-preference`                                                                                                                                       | —                                                                                                                                                                                                     |
| **EmptyState**                | ícone em quadrado, título, texto, ação                                                 | mantém estrutura; ícone 32px `--ink-3` sem quadrado; uma frase; ação outline                                                                                                                                                                                                                      | —                                                                                                                                                                                                     |
| **ConnectionIndicator**       | ícone colorido + texto                                                                 | badge tint (sucesso/alerta/perigo) com ícone + texto; reconectando sem `animate-spin` contínuo (ícone estático com reticências no texto já existente)                                                                                                                                             | —                                                                                                                                                                                                     |
| **OfflineBanner**             | faixa zinc-900                                                                         | faixa `--espresso` com ícone Saffron                                                                                                                                                                                                                                                              | —                                                                                                                                                                                                     |
| **Pagination**                | botões                                                                                 | botões outline 44px, página atual em texto                                                                                                                                                                                                                                                        | desabilitado legível                                                                                                                                                                                  |
| **OneTimeSecretDialog**       | mono                                                                                   | mantém `font-mono` + `text-lg` nos mesmos elementos (E2E) e só troca cores                                                                                                                                                                                                                        | —                                                                                                                                                                                                     |

---

## 4. Tela por tela

Legenda: **M** mobile (390), **T** tablet (768), **D** desktop (1440), **TV** (1920+).

### 4.1 Tela da mesa — `/m/[token]` ⭐ (rápida, legível, uma mão)

Pergunta: "quero chamar alguém". O botão principal é o maior elemento e fica na zona do polegar.

- **M**
  - Topo compacto em uma linha: "Mesa N" (badge) à esquerda, conexão à direita — os dois como badges tint, sem vidro.
  - Logo 72px, nome do restaurante 24/700, descrição 14px (opcional), título de boas-vindas 16/600 **sem** pílula branca (hoje cria um "cartão dentro do cartão").
  - Ações ancoradas na metade inferior: "Chamar garçom" 64px+ (rótulo 20/600 → "texto grande" para AA), "Pedir a conta" 64px outline (ou cor `secondary` do restaurante, como hoje). Espaço de 12px entre eles.
  - "Adicionar observação opcional" vira linha de 48px com ícone, acima dos botões; textarea com contador "0/150" à direita.
  - Cards de chamado (pendente/atendido/confirmado) **acima** dos botões, com: ícone do tipo 24px, título 18/600, hora em 14px, cronômetro 20px `tabular-nums` (Inter), cancelar como botão de texto 44px. Sem faixa em gradiente: uma borda superior 3px na cor do estado (`--brand` pendente, `--warning` atendido aguardando avaliação, `--success` confirmado).
  - Avaliação: três botões 64px com ícone 28px e rótulo 14px; selecionado = borda 2px + tint da família.
  - Wi-Fi: uma linha (ícone, nome da rede 14/600, botão "Copiar senha" 44px); rótulo "Wi-Fi do Restaurante" 12px numa linha só.
  - Redes sociais 44px, ícones 20px, sem escala no hover em touch.
  - Esqueleto com exatamente a mesma estrutura (badge row, logo 72, 2 botões 64) — corrige T5.
  - Estados de erro (não encontrada / pausada / suspensa / rede): mesmo layout de card, ícone 32px sem quadrado colorido, título 20/600; "Tentar novamente" primário. Remover `<main>` aninhado (T7).
- **T/D**: coluna central `max-width: 440px` (hoje 448), fundo do restaurante ocupando a tela; nada muda de estrutura.
- **Tema do restaurante:** ver §2.4. Cards da mesa usam `--table-card` (surface clara ou escura conforme a luminância de `--table-bg`), **não** o modo do celular.
- **Desempenho:** só CSS e classes; nenhum JS novo; remove `backdrop-blur` (melhora pintura em Android barato). Meta: JS de `/m/[token]` ≤ 128,8 KB gzip (± 1 KB), CLS 0.

### 4.2 Painel da equipe — `/panel` ⭐ (TV legível a distância; urgência por cor **e** ícone/texto)

Pergunta: "quem está esperando há mais tempo e em que nível?".

**Card de chamado (todas as larguras)**

- Linha 1: **"Mesa N"** em Inter 700 (não mono), à esquerda; **nível** à direita como badge com ícone + palavra (Normal = relógio + "Normal" neutro `--nav`/`--ink`; Alerta = triângulo + "Alerta" Saffron cheio com tinta Cast Iron; Urgente = chama + "Urgente" Chili cheio com branco).
- Linha 2: tipo do chamado (ícone + "Chamar garçom" / "Pedir a conta") **em uma linha** com `text-wrap: balance` e tamanho fluido; cronômetro à direita, `tabular-nums`, cor do nível (texto) — sempre com o rótulo "Espera" ≥ 12px.
- Cor por nível na **borda** (1px neutro → 2px Saffron → 3px Chili) e numa faixa superior de 6px; o fundo do card continua surface (legibilidade).
- **Conta deixa de ser verde**: tipo indicado por ícone de recibo + texto; verde fica reservado para "Assumido por você"/confirmado (corrige P5).
- Urgente: sem `animate-pulse` no texto; pulso opcional de 2s na borda, desligado em reduced-motion (P6).
- Selo "Reaberto (Nx)" vai para a linha do tipo, abaixo do texto quando faltar espaço — o cronômetro nunca encolhe (corrige P1, P2).
- Ações: "Assumir" outline e "Atendido" primário (garçom) ou `success` (conta, como hoje) com 56px (TV 64px).
- Ordenação, textos, `aria-label` e `article[aria-label="Mesa N, chamado de …"]` inalterados (E2E).

**Por largura**

- **M (390):** 1 coluna, cabeçalho em 2 linhas (nome + conexão; contadores + ações). Card com padding 16.
- **T (768):** 2 colunas; cabeçalho em 1 linha; gaveta de recentes como lateral.
- **D (1440):** 3 colunas, máximo 1280px de conteúdo.
- **TV (≥ 1920):** **modo TV por largura** (sem novo estado): fundo `--canvas` escuro opcional (tema do sistema/usuário), 4 colunas a 1920 e 5 a 2560+, overscan 3% já existente; número da mesa e cronômetro em `clamp()` (§2.5) para ~48–64px a 1920; selo de nível ≥ 20px; contadores do cabeçalho ≥ 20px com ícone; relógio grande no cabeçalho.
- **Banners:** desconectado em faixa Chili cheia com ícone + título + "Reconectar agora" 44px (P7); contingência em faixa Saffron tint. Ícones parados (sem bounce/spin) — o texto já diz o estado.
- **Vazio "Tudo em dia":** card sem tracejado, ícone 40px Sage, título 24/700, frase 16px, ações outline.
- **Gaveta de recentes:** linha do tempo por chamado (aberto → assumido → atendido → confirmado) usando os dados já exibidos (Wise 06).
- **Diálogos de início/configurações:** padrão Dialog; o botão "Iniciar Painel Completo" é o primário único.

### 4.3 Dashboard — Resumo do Dia (`/dashboard`, `/dashboard/analytics`) ⭐

Pergunta: "como está o atendimento hoje?".

- **Título da página** 24/700 + subtítulo 14px `--ink-2` com o período (já existe) + seletor de período à direita (chips de período no mobile, como Wise 11).
- **Faixa de KPIs:** um card dividido em colunas. KPI líder = **Tempo médio de espera** (responde a pergunta; ver Q8) em 32px com badge de meta; os outros 5 em 24px. **D:** 6 colunas numa linha (1440 comporta) ou 3+3 alinhadas; **T:** 3×2; **M:** lista de 2 colunas (par) — sem órfãos (D1). Sem ícones coloridos (D2); variação em texto com cor de bom/ruim (tempo de espera menor = bom).
- **Gráfico por hora:** barras de cantos retos (topo 4px) em `--ink-3`/neutro, hora de pico (ou atual, no dia corrente) em `--brand`; linha de meta tracejada com rótulo; 4 linhas de grade; eixos em 12px `--ink-2`. Altura 240 (D), 200 (M). O botão "ver como tabela" continua.
- **Ranking de mesas:** barras horizontais finas (6px) com valor à direita, top 1 em `--ink`, demais `--ink-3`.
- **Tabela de chamados:** padrão de tabela (§3); status como badge com ícone; no **M** vira lista de duas linhas (mesa + tipo / hora + status); filtros em gaveta com contador no botão (Wise 14) — mesmos filtros de hoje, mesmos `aria-label`.
- **Esqueleto:** mesmo número de KPIs e alturas (corrige salto).
- Estados: erro dentro do bloco que falhou com "Tentar novamente" (já existe, só visual); vazio com frase na largura toda.

### 4.4 Shell e navegação (dashboard e admin)

- **D:** sidebar 248px fundo `--nav`, logo TapMesa (ícone + nome) no topo sem sombra colorida, itens 40px, ativo em pílula surface, "Painel de Atendimento" no rodapé. Recolhida: 72px com tooltips.
- **T (768–1023):** sidebar recolhida por padrão (ícones + tooltip).
- **M:** cabeçalho 56px com menu, nome da página e ação "Painel"; bottom nav com 4–5 destinos; gaveta lateral para o resto.
- Corrigir o `xs:` do botão "Painel" (Q11).

### 4.5 Mesas (`/dashboard/tables`)

- **D/T:** tabela com número da mesa 16/600 `tabular-nums`, status Ativa/Pausada como badge com ícone, ações em linha (copiar link, QR, pausar) como IconButtons 44px com tooltip; busca 40px e filtros em pílulas (Wise 14).
- **M:** cards de mesa em lista: número grande à esquerda, status, menu "…" à direita. Mesa pausada: card com tint `--warning-tint` e ícone de pausa ao lado do número (Wise 12, estado sobre o objeto).
- Criação em lote: diálogo com prévia do intervalo em linhas chave-valor.
- Modal de QR: QR centralizado em cartão branco com margem generosa, número da mesa 24/700, URL 14px com botão copiar, ações empilhadas (Wise 07).

### 4.6 Impressão de QR (`/dashboard/tables/print`)

- Tela: prévia A4 igual ao papel, seletores no topo (mesas, 6/4 por folha) em controles segmentados.
- Papel: **preto puro no QR sobre branco** (RNF-20, inalterado), número da mesa grande, nome do restaurante, faixa fina na cor `primary` do restaurante (como hoje); tipografia Inter; linhas de corte tracejadas 0,5pt cinza.

### 4.7 Equipe (`/dashboard/team`)

- Abas "Membros / Desempenho dos Garçons" como controle segmentado (nome da aba inalterado — E2E).
- Membros: tabela (D/T) ou lista (M) com avatar de iniciais em tint estável por pessoa, papel em badge neutro, status com ícone.
- Desempenho: KPIs em faixa dividida + tabela; nota de uso responsável em aviso neutro.
- Senha temporária: `OneTimeSecretDialog` com o mesmo markup mono.

### 4.8 Configurações (`/dashboard/settings`) — Atendimento, Aparência, Notificações

- Abas sublinhadas sincronizadas com `?tab=` (inalterado).
- **Atendimento e Notificações:** layout de "linha de ajuste" (Wise 18): título 16/600 + descrição 14px à esquerda (D) / acima (M), controle à direita; cards por seção sem sombra; botões "Testar…" outline.
- **Barra de alterações pendentes:** fixa no rodapé com fundo `--espresso`, texto claro, "Descartar" ghost e "Salvar" primário; no **M** reserva `padding-bottom` na página para não cobrir o último campo (D6).
- **Aparência:** **D** duas colunas (formulário + pré-visualização do celular fixa); **T/M** abas Formulário/Prévia (como hoje). Seletores de cor 44px com amostra e valor hex; presets de fundo como cartões de opção com borda de seleção e ✓ (Wise 10); avisos de contraste como faixa tint com ícone e razão calculada ("3,2:1 — abaixo de 4,5:1"). A pré-visualização mostra a tela da mesa **já no novo visual**.

### 4.9 Login (`/login`)

- Fundo `--canvas`; marca (ícone Terracotta + "TapMesa" 24/700) acima do cartão; cartão surface sem sombra, raio `--radius-md`; inputs 44px; botão primário de largura total.
- Foco automático continua (comportamento), mas com o anel padrão de 2px (L1).
- Bloqueio 429: faixa `--warning-tint` com contagem regressiva (texto existente).
- **M/T/D**: a mesma coluna de 400px centralizada.

### 4.10 Admin (`/admin`, `/admin/audit`)

- Cabeçalho próprio em `--espresso` com texto claro ("cabeçalho executivo" da paleta), para diferenciar o portal administrativo do dashboard do restaurante; navegação em abas no cabeçalho.
- Restaurantes: tabela com status Ativo/Suspenso (badge + ícone), ações "Suporte" (impersonar), "Suspender", "Excluir" em escala de risco (outline → danger na confirmação).
- Auditoria: tabela densa (linhas 44px), metadados em 12px (não 10), gaveta de detalhes com JSON em mono 13px sobre `--nav`.
- `ImpersonationBar`: faixa Saffron cheia com tinta Cast Iron (6,21:1), ícone e ação "Encerrar".
- **M:** tabelas viram listas de duas linhas; filtros em gaveta.

### 4.11 Estados globais

- `error.tsx`/`loading.tsx` por grupo: mesmo padrão de EmptyState e Skeleton.
- 404: ícone 32px, título 24/700, ação "Voltar".
- `OfflineBanner`: §3.

---

## 5. Acessibilidade e desempenho

| Requisito                | Como o plano atende                                                                                                                                                                                               | Como validar                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Contraste AA             | Tabela §2.3; `--ink-3` restrito; `--primary` escurecido; tintas de badge próprias                                                                                                                                 | script de contraste + axe no Playwright                                 |
| Foco visível             | Anel 2px `--focus-ring` + offset 2px em todos os interativos, só `:focus-visible`; trocar os 12 `focus:ring`                                                                                                      | navegação por Tab nas telas-chave                                       |
| Alvos de toque           | ≥ 44px em tudo (remove `sm:min-h-[36px]`, `h-8`); ≥ 64px nas ações do cliente (chamar, conta, avaliar); 56–64px no painel                                                                                         | medição automática no Playwright (bounding box ≥ 44/64)                 |
| Cor não é a única pista  | Nível do painel = cor + ícone + palavra; status = badge com ícone; Conta ≠ verde                                                                                                                                  | revisão visual + leitor de tela                                         |
| `prefers-reduced-motion` | Bloco global mantido; sem pulsos em repouso; o único pulso (Urgente) desliga                                                                                                                                      | emular `reducedMotion: 'reduce'`                                        |
| Tema                     | `color-scheme: light dark` no `<html>`; `theme-color` com `--canvas` de cada tema                                                                                                                                 | captura claro/escuro                                                    |
| Bundle de `/m/[token]`   | Mudanças só de CSS/classes; nenhuma dependência JS nova; remove código de animação morta. Se Q5 = instalar `tw-animate-css`, é CSS puro (0 KB JS). **Meta: ≤ 279,6 KB gzip ± 1 KB (linha de base medida, §0.4).** | `next build` + análise de chunks (mesmo método do `docs/perf/front.md`) |
| CLS                      | Esqueletos com a mesma forma; fonte única já com `next/font`; sem troca de fonte (se Q1 trocar de fonte, usar `next/font` com `adjustFontFallback`)                                                               | Lighthouse mobile em `/m/[token]` (CLS 0)                               |
| Leitores de tela         | Nenhum `aria-*`, `role` ou texto alterado; `<main>` aninhado corrigido                                                                                                                                            | E2E + VoiceOver rápido na mesa                                          |

---

## 6. Ordem de implementação

Cada fase é um branch/PR pequeno. Em todas: rodar `npm run verify` (lint, typecheck, build), a suíte E2E nos 3 projetos (mobile/tablet/desktop) e as capturas antes/depois com o mesmo roteiro do `design-lab` (390/768/1440, claro e escuro).

### Fase 0 — Linha de base (pré-requisito)

- **Arquivos:** nenhum da app. Subir back-end com seed; capturar **todas** as telas autenticadas (§0.2); medir bundle e Lighthouse atuais.
- **Risco:** nenhum.
- **Pronto quando:** `design-lab/screens/atual/` tem todas as telas da §4 nos 3 viewports e 2 temas; números de bundle/Lighthouse registrados.

### Fase 1 — Tokens e tema

- **Arquivos:** `src/app/globals.css`, `src/app/layout.tsx` (`themeColor`, `color-scheme`), `src/app/manifest.ts` (cores do PWA, se aprovado), `docs/design/DESIGN.md`.
- **O que muda:** variáveis claro/escuro, `@theme inline`, `@custom-variant dark`, z-index, motion, `color-scheme`.
- **Risco:** médio — `@custom-variant` faz o tema escolhido passar a valer de verdade (pode surpreender quem usa "Claro" com sistema escuro). Nada mais muda visualmente ainda.
- **Validar:** build; E2E; capturas iguais às de base exceto onde o tema escolhido ≠ sistema.
- **Pronto quando:** utilitários `bg-canvas`, `text-ink`… disponíveis; tema do seletor governa a UI.

### Fase 2 — Componentes base

- **Arquivos:** `src/shared/ui/*` (button, badge, card, input, textarea, select, checkbox, switch, tabs, dialog, drawer, confirm-dialog, toast, tooltip, skeleton, empty-state, data-table, pagination, stat-card, connection-indicator, offline-banner, one-time-secret-dialog, skip-link), `src/app/dev/ui/ui-showcase.tsx`.
- **Risco:** médio — afeta todas as telas; manter props, variantes, `id`s e classes `font-mono`/`text-lg` do diálogo de credenciais.
- **Validar:** `/dev/ui` antes/depois; E2E; axe nos componentes.
- **Pronto quando:** nenhum `zinc-/orange-/emerald-/amber-/red-/blue-` em `src/shared/ui`; todos os estados da §3 visíveis na vitrine.

### Fase 3 — Shell e navegação

- **Arquivos:** `src/app/(dashboard)/layout.tsx`, `_components/*`, `src/app/(admin)/layout.tsx`, `src/app/_components/user-menu.tsx`, `src/features/auth/ui/impersonation-bar.tsx`, `src/app/login/page.tsx`, `src/features/auth/ui/login-form.tsx`, `error.tsx`/`loading.tsx`/`not-found.tsx`.
- **Risco:** baixo/médio (breakpoint `xs`, Q11).
- **Validar:** E2E de login; captura das 3 larguras; teste de teclado na sidebar.
- **Pronto quando:** sidebar/bottom nav/header no novo visual nos 2 temas, sem rolagem horizontal.

### Fase 4 — Tela da mesa

- **Arquivos:** `src/features/table-screen/ui/*`, `src/features/table-screen/lib/contrast.ts` (só a constante de tinta escura, se Q2), `src/app/m/[token]/page.tsx` (`<main>` aninhado).
- **Risco:** alto — tela pública e de conversão; personalização do restaurante.
- **Validar:** E2E de chamado/cancelamento/avaliação; capturas com 3 temas de exemplo (claro, escuro, imagem) **e** celular em modo escuro; Lighthouse mobile (Performance ≥ 90, A11y ≥ 95, CLS 0); bundle de `/m/[token]`; medição de alvos (64px).
- **Pronto quando:** T1–T8 resolvidos; personalização igual à de hoje; bundle dentro da meta.

### Fase 5 — Painel

- **Arquivos:** `src/features/panel/ui/*`, `src/app/(panel)/panel/page.tsx`, `src/app/(panel)/layout.tsx`.
- **Risco:** alto — uso contínuo e a distância.
- **Validar:** E2E do painel; capturas em 390/768/1440/1920/3840; teste de leitura a 3m (TV real ou captura 1920 vista em tamanho reduzido a 25%); reduced-motion.
- **Pronto quando:** P1–P9 resolvidos (P4 conforme Q9); nível legível sem cor (captura em escala de cinza).

### Fase 6 — Dashboard e configurações

- **Arquivos:** `src/features/analytics/ui/*`, `src/features/tables/ui/*`, `src/features/team/ui/*`, `src/features/settings/ui/*`, páginas em `src/app/(dashboard)/dashboard/**`.
- **Risco:** médio (Recharts, pré-visualização de Aparência, impressão).
- **Validar:** E2E de mesas, aparência, notificações, analytics e equipe; impressão em PDF (A4) comparada; bundle de `/dashboard/*`.
- **Pronto quando:** D1–D6 resolvidos; impressão continua preto-sobre-branco.

### Fase 7 — Admin

- **Arquivos:** `src/features/admin/ui/*`, `src/app/(admin)/admin/**`.
- **Risco:** baixo.
- **Validar:** E2E de admin (criar restaurante, credenciais, nova senha, paginação).
- **Pronto quando:** L2 resolvido; tabelas com o padrão da §3.

### Fase 8 — Limpeza

- Remover classes de animação mortas (ou instalar o plugin, Q5), `transition-all`, `backdrop-blur` remanescente; regra de lint contra paleta crua (Q10); atualizar `docs/design/DESIGN.md`, `a11y-report.md` e `docs/perf/front.md` com os números novos.

---

## 7. Riscos e decisões pendentes (perguntas objetivas)

**Riscos**

- `@custom-variant dark` muda o comportamento visível do seletor de tema (passa a funcionar como esperado).
- A tela da mesa precisa de testes manuais com temas reais de restaurantes (fundos claros, escuros e com imagem) antes do deploy.
- O E2E depende de `span.font-mono.text-lg` e `p.font-mono`: qualquer refatoração do diálogo de credenciais precisa manter essas classes.
- Sem capturas autenticadas, o diagnóstico de mesas, equipe, configurações e admin foi feito pelo código; a Fase 0 pode revelar mais itens.

**Perguntas**

- **Q1. Fonte:** manter **Inter** (recomendado: zero risco de bundle/CLS) ou trocar por uma grotesca com mais caráter (ex.: Figtree, Onest, Instrument Sans) via `next/font`?
- **Q2. Padrões da mesa sem personalização:** quando o restaurante não define cores, a mesa deve usar os tokens TapMesa (fundo `#F9F8F6`, texto `#141615`, Terracotta) em vez dos atuais (`#ffffff`, `#18181b`, `#ea580c`)? Isso inclui os valores padrão do formulário de Aparência e a constante de "tinta escura" do algoritmo de contraste.
- **Q3. Cor primária do restaurante:** hoje `colors.primary` **não** colore o botão "Chamar garçom" na mesa real, mas a pré-visualização em Aparência mostra que colore. Mantemos como está (regra: só sobrescrever o que já sobrescreve) ou alinhamos a mesa à pré-visualização?
- **Q4. Mesa x modo escuro do celular:** a tela da mesa deve seguir **só** o tema do restaurante (recomendado), ignorando o modo escuro do sistema do cliente?
- **Q5. Animações de entrada:** instalar `tw-animate-css` (só CSS, 0 KB JS) para que as animações descritas no F21 funcionem, ou remover essas classes e ficar sem animação de entrada?
- **Q6. Imagem de fundo do restaurante:** manter o `backdrop-blur` da película sobre a imagem (único vidro permitido) ou só escurecer?
- **Q7. Sidebar:** clara em Raw Linen (recomendado, alinhado à Wise e à Taste) ou escura em Deep Espresso (você listou Espresso como "sidebar escura e cabeçalhos executivos")? Proposta atual: sidebar clara no dashboard e cabeçalho Espresso no admin.
- **Q8. KPI líder do Resumo do Dia:** "Tempo médio de espera" (proposto) ou "Total de chamados"?
- **Q9. Cronômetro longo no painel:** exibir horas (`1:02:06`) quando passar de 60 min? É formatação de exibição (`src/shared/lib/clock.ts`), mas toca em lógica compartilhada — preciso da sua autorização.
- **Q10. Proteção contra regressão:** adicionar regra de lint que proíba classes da paleta crua do Tailwind (`zinc-*`, `orange-*` etc.) fora de `globals.css`?
- **Q11. Botão "Painel" no cabeçalho do dashboard:** hoje nunca aparece (breakpoint `xs` inexistente). Torná-lo visível a partir de 400px?
- **Q12. Cores do PWA:** atualizar `manifest.ts` (`#09090b`/`#ea580c`) para `#141615`/`#D94E34`? Muda o ícone/splash instalado nos tablets.
- **Q13. Tema escuro:** aprova a paleta escura da §2.2 como está, ou quer ajustar algum degrau (ex.: cards mais quentes ou mais neutros)?
- **Q14. `.env` local:** corrige a linha `hyNEXT_PUBLIC_API_URL=` você mesmo (recomendado) ou autoriza que eu corrija?
- **Q15. E2E vermelho na linha de base:** como tratar o critério "testes continuam passando" enquanto `smoke.spec.ts` tem senha fixa e o back-end local não envia `x-table-url`?
- **Q16. Aparência padrão do back-end:** a Q2 ("mesa sem personalização usa tokens TapMesa") depende de saber quando o restaurante não personalizou, e o back-end sempre manda cores.

---

## 8. Decisões aprovadas (24/10/2026)

| #              | Decisão                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1             | Manter Inter.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Q2             | Tokens TapMesa (`#F9F8F6`, `#141615`, Terracotta) entram **só** quando o campo de aparência vier ausente ou nulo, como valor padrão do formulário de Aparência e na constante de tinta escura do algoritmo de contraste (ver Q16).                                                                                                                                                                                                                                                                             |
| Q3             | "Chamar garçom" usa a cor primária do restaurante, como na pré-visualização. Salvaguardas: texto com a proteção de contraste existente; fallback para `--primary` sem cor definida; borda de 2px quando a cor do botão tiver menos de 3:1 contra o fundo da mesa.                                                                                                                                                                                                                                              |
| Q4             | A mesa segue só o tema do restaurante e ignora o modo escuro do celular.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Q5             | Instalar `tw-animate-css` (só CSS) e refinar: diálogos, gavetas e toasts (200/150/250 ms, `--ease-out`), surgimento dos cards de chamado, troca de estado na mesa e no painel, toque dos botões e skeletons. Só transform/opacity/cor, nada piscando em repouso, `prefers-reduced-motion` e regras do F21.                                                                                                                                                                                                     |
| Q6             | Sem `backdrop-blur`; sobre imagem de fundo do restaurante, só película escura.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Q7             | Sidebar clara (Raw Linen) no dashboard; cabeçalho Deep Espresso no admin.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Q8             | KPI líder do Resumo do Dia: tempo médio de espera.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Q9             | Cronômetro mostra horas acima de 60 min (ex.: `1:02:06`): só formatação em `clock.ts`, sem mudar cálculo, com teste unitário.                                                                                                                                                                                                                                                                                                                                                                                  |
| Q10            | Regra de lint contra paleta crua do Tailwind fora do `globals.css`, na Fase 8.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Q11            | Botão "Painel" visível a partir de 400px.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Q12            | PWA com `#141615` / `#D94E34`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Q13            | Paleta escura aprovada como está.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Q14            | `.env` corrigido; back-end local em `localhost:3000`.                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Meta de bundle | Não aumentar: `/m/[token]` ≤ 279,6 KB gzip (± 1 KB), CLS 0, Lighthouse mobile mantido ou melhor.                                                                                                                                                                                                                                                                                                                                                                                                               |
| Q15            | `smoke.spec.ts` lê `E2E_ADMIN_USERNAME`/`E2E_ADMIN_PASSWORD` (sem senha fixa). Linha de base em `docs/design/E2E_BASELINE.md`. Critério por fase: nenhuma falha nova e o mesmo ponto de parada nos testes que já falham. `x-table-url` é pendência do back.                                                                                                                                                                                                                                                    |
| Q16            | O front usa as cores que o back devolve; não detecta "sem personalização". Instruções para o novo padrão no back em `docs/design/TABLE_DEFAULT_PALETTE.md`.                                                                                                                                                                                                                                                                                                                                                    |
| Logos          | Usar `public/logo-light.svg` e `public/Logo-dark.svg` no login, sidebar (aberta e recolhida), cabeçalho do admin (versão para fundo escuro), fallback da mesa sem logo e ícones do PWA (192, 512 e maskable, com margem segura) na Fase 3. Versão escolhida pelo tema ativo e pelo fundo; na mesa, pelo fundo do restaurante. `alt="TapMesa"` quando informativo, `alt=""` com texto ao lado. O logo do restaurante sempre tem prioridade. Legibilidade em 24px/favicon mostrada com captura antes de decidir. |
