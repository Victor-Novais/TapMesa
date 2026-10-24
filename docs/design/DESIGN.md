# TapMesa — Design System & Diretrizes Visuais

_Referência de identidade, tokens, tipografia, componentes e padrões de interação do TapMesa Frontend. Fonte da verdade dos valores: `src/app/globals.css`. Plano e decisões: [`DESIGN_PLAN.md`](./DESIGN_PLAN.md)._

## 1. Visão e Personalidade

- **Contextos de uso:**
  1. **Cliente na mesa com celular:** acesso por QR Code, sem cadastro, em qualquer luz. Botões de 64px, feedback imediato e tempo de espera visível. A tela segue **só o tema do restaurante**, nunca o modo escuro do celular.
  2. **Garçom no salão (tablet/TV):** leitura a até 3 m. Número da mesa e cronômetro grandes, nível sempre com ícone + palavra (Normal, Alerta, Urgente), nada piscando.
  3. **Dono no escritório (desktop/celular):** Resumo do Dia, equipe, mesas e aparência com pré-visualização ao vivo.
- **Personalidade:** calma (sem alarmismo), confiável (estado da conexão sempre visível) e rápida (transições de 150–250 ms).

## 2. Cores

Use **sempre** os tokens abaixo. A paleta crua do Tailwind (`bg-zinc-100`, `text-red-600`…) é bloqueada pelo ESLint fora de `globals.css` (exceção: `table-print-card.tsx`, que é papel).

### 2.1 Tokens (claro / escuro)

| Token (utilitário)                       | Claro     | Escuro    | Uso                                                     |
| ---------------------------------------- | --------- | --------- | ------------------------------------------------------- |
| `bg-canvas`                              | `#F9F8F6` | `#141615` | Fundo da página                                         |
| `bg-nav`                                 | `#F2EFE9` | `#1F1D1B` | Sidebar, trilhos de abas, blocos de apoio               |
| `bg-surface`                             | `#FFFFFF` | `#2A2421` | Cards, tabelas, cabeçalhos                              |
| `bg-raised`                              | `#FFFFFF` | `#36302C` | Diálogos, menus, gavetas                                |
| `bg-espresso` / `text-on-espresso`       | `#2A2421` | `#2A2421` | Cabeçalho do admin                                      |
| `text-ink`                               | `#141615` | `#F9F8F6` | Texto principal                                         |
| `text-ink-2`                             | `#5C5852` | `#C9C3BA` | Texto secundário (≥ 4,5:1)                              |
| `text-ink-3`                             | `#948F87` | `#A39C92` | Só ícones, desabilitado ou texto ≥ 24px                 |
| `bg-brand` / `text-brand`                | `#D94E34` | `#D94E34` | Marca, destaques gráficos, foco                         |
| `bg-primary` / `text-on-primary`         | `#C4452D` | —         | Botão primário (branco 4,96:1)                          |
| `text-primary-ink`                       | `#B23E29` | `#E86E55` | Terracotta como texto/link                              |
| `bg-success` / `text-success`            | `#2E6F40` | `#62B079` | Sucesso, "assumido por você", confirmado                |
| `bg-warning` / `text-on-warning`         | `#D9822B` | `#E39343` | Alerta (preenchido com tinta escura)                    |
| `text-warning-ink`                       | `#8F531A` | `#E39343` | Alerta como texto                                       |
| `bg-danger` / `text-on-danger`           | `#C92A2A` | `#EC7066` | Urgente, destrutivo                                     |
| `text-danger-ink`                        | `#A82424` | `#EC7066` | Erro como texto                                         |
| `bg-{success,warning,danger,brand}-tint` | claros    | escuros   | Fundos de badge e aviso (sempre com a tinta da família) |
| `border-border` / `border-border-subtle` | `#E6E1D8` | `#433D3B` | Divisórias e contornos de card                          |
| `border-border-control`                  | `#8F887E` | `#7A736D` | Contorno de campo (3,5:1)                               |
| `ring-focus-ring`                        | `#D94E34` | `#E86E55` | Anel de foco 2px com afastamento                        |

### 2.2 Regras de uso

- Cor nunca é o único sinal: nível, status e erro levam ícone e palavra.
- Verde é reservado a sucesso/confirmado. "Conta" não é verde (ícone de recibo + texto).
- Tint + tinta da mesma família para badges; preenchimento cheio só para estado crítico (Urgente, desconectado).
- Sem gradientes, `backdrop-blur` ou sombras coloridas. Sobre imagem de fundo do restaurante, só um filme escuro (`bg-black/60`).

### 2.3 Tela da mesa e personalização do restaurante

- O restaurante sobrepõe `background`, `primary`, `primaryText`, `secondary` e `text`. Os padrões TapMesa (`#F9F8F6`, `#C4452D`, `#FFFFFF`, `#2A2421`, `#141615`) valem só quando o campo vem ausente/nulo.
- `TableThemeProvider` decide o tom pela luminância do fundo (`data-surface="table-light|table-dark"`, também no `<html>` em `/m`). Os tokens dentro da tela seguem esse tom; o modo escuro do celular é ignorado.
- "Chamar garçom" usa a cor primária do restaurante; o rótulo passa pela proteção de contraste e, se o botão tiver menos de 3:1 contra o fundo, ganha borda de 2px na cor do texto.
- Proposta de paleta padrão para o back-end: [`TABLE_DEFAULT_PALETTE.md`](./TABLE_DEFAULT_PALETTE.md).

## 3. Tipografia

- Fonte única: **Inter**. Números em `tabular-nums`; `font-mono` só para URLs, códigos, IDs e credenciais (o E2E depende de `p.font-mono` e `span.font-mono.text-lg` no diálogo de credenciais).
- Escala: 12 (mínimo para texto), 14, 16 (campos e corpo), 18, 20, 24 (título de página), 30, 36.
- Painel em TV: tamanhos fluidos com `clamp()` — número da mesa `clamp(2rem, 2.2vw + 1rem, 4.5rem)`, cronômetro `clamp(1.75rem, 1.6vw + 1rem, 3.5rem)`, nível `clamp(0.875rem, 0.75vw + 0.375rem, 1.5rem)` (≥ 20px a 1920).
- Cronômetro: `mm:ss` até 59:59, depois `h:mm:ss` (ex.: `1:02:06`).

## 4. Forma, espaço e elevação

- Raios: `rounded-chip` 6px · `rounded-control` 10px · `rounded-card` 14px · `rounded-sheet` 20px.
- Elevação: `shadow-elevation-1` (cards em destaque), `-2` (barras flutuantes, toasts), `-3` (diálogos). No escuro a elevação 1 some; a superfície mais clara faz o papel.
- Espaçamento em múltiplos de 4px. Gutter: 16 (mobile), 24 (tablet), 32 (desktop), 48–64 (TV).
- Alvos de toque: 44px no dashboard/admin/painel; 64px nos botões principais da mesa; 56px (64px em TV) nas ações do card do painel.

## 5. Breakpoints

| Nome  | Largura | Uso principal                            |
| ----- | ------- | ---------------------------------------- |
| `xs`  | 400px   | Botão "Painel" no cabeçalho do dashboard |
| `sm`  | 640px   | Painel em 2 colunas                      |
| `md`  | 768px   | Tablet retrato                           |
| `lg`  | 1024px  | Sidebar fixa; painel em 3 colunas        |
| `xl`  | 1280px  | Desktop                                  |
| `2xl` | 1536px  | Desktop largo                            |
| `3xl` | 1920px  | Painel em TV: 4 colunas, botões 64px     |
| `4xl` | 2560px  | TV grande: 5 colunas                     |

## 6. Movimento

- Durações: 100 (feedback de toque), 150 (saída), 200 (entrada de diálogo/gaveta), 250 ms (toast). Easing de entrada `ease-out-soft` (`cubic-bezier(0.16, 1, 0.3, 1)`).
- Só `transform`, `opacity` e cor; nunca `transition-all`.
- Nada pisca em repouso: sem `animate-pulse`/`ping`/`bounce` fora de esqueletos e carregamentos (`motion-safe:`).
- `prefers-reduced-motion`: animações e transições caem para ~0 ms.

## 7. Logos

- `BrandLogo` (`src/shared/ui/brand-logo.tsx`) com `<img>` e largura/altura fixas (CLS 0, 0 KB de JS). `tone="auto"` alterna pela classe `dark`; `tone="dark"` para fundos escuros (cabeçalho do admin).
- `alt="TapMesa"` quando o logo é o único nome visível; `alt=""` quando há texto ao lado.
- Na tela da mesa, o logo do restaurante tem prioridade; o TapMesa é só o fallback, no tom do fundo do restaurante.
- Favicon: ver pendência em `PROGRESS_1.md` (16px pouco legível).

## 8. Componentes (`src/shared/ui/`)

Button (primary, secondary, outline, ghost, danger, success; sm/md/lg/table), IconButton (44px, `aria-label` obrigatório), Input, Textarea, Select, Switch, Checkbox, Badge (neutral, success, alert, danger, info, primary), Card, Dialog, Drawer, Tabs (padrão e segmentado), Toast, Tooltip, Skeleton, EmptyState, DataTable, Pagination, StatCard (`emphasis` para o KPI líder), ConnectionIndicator, ConfirmDialog, OneTimeSecretDialog, BrandLogo, SkipLink, OfflineBanner.

A vitrine viva fica em `/dev/ui` (só em desenvolvimento), com os tokens, os componentes e a tela da mesa nos temas claro, escuro e com imagem.
