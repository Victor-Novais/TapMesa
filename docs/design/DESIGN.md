# TapMesa — Design System & Diretrizes Visuais

_Documento de referência oficial de identidade, tokens, tipografia, componentes e padrões de interação do TapMesa Frontend._

## 1. Visão e Personalidade

- **Contextos de Uso:**
  1. **Cliente na mesa com celular:** Acesso imediato via QR Code, sem cadastro. Iluminação diversa (penumbra de bar a sol de praia). Botões ultra-acessíveis com alvos de 64px, feedback sonoro/tátil leve e contagem regressiva visível.
  2. **Garçom no salão (Tablet / TV):** Dispositivo em movimento contínuo ou TV afixada na parede (distância de leitura de até 3 metros). Cards com alto contraste, número da mesa em destaque, cores semânticas acompanhadas sempre de ícones e textos explícitos (Normal, Alerta, Urgente).
  3. **Dono no escritório (Desktop / Celular):** Foco em inteligência analítica, rapidez na tomada de decisão (Resumo do Dia, métricas de equipe, lote de mesas e customização visual com pré-visualização ao vivo).
- **Personalidade da Interface:**
  - _Calma:_ Interface despoluída, sem poluição visual ou alarmismo estressante.
  - _Confiável:_ Transparência do estado da rede (ConnectionIndicator), tratamento tolerante a falhas e confirmação clara em todas as mutações.
  - _Rápida:_ Interações táteis instantâneas (INP < 100ms), transições curtas e objetivas (150ms–200ms), suporte a teclado e foco visível.

## 2. Referências de Design (Awesome Design & Taste)

1. **Linear:** Precisão tipográfica, espaçamento rigoroso, ausência de bordas pesadas e hierarquia equilibrada de superfícies em modo claro e escuro.
2. **Stripe & Wise:** Clareza e densidade de dados analíticos, tabelas com paginação fluida e diálogos de segurança de segredo único (`OneTimeSecretDialog`).
3. **Toast POS:** Alvos de toque generosos, feedback imediato em ambientes de alto ritmo e estados visuais claros para chamados críticos.

## 3. Tokens de Design

### 3.1 Cores Semânticas

Tokens baseados em variáveis CSS compatíveis com claro e escuro:

- **Superfície & Fundo:**
  - `bg-background` (`--bg-background`): `#ffffff` (claro) / `#09090b` (escuro)
  - `bg-surface` (`--bg-surface`): `#f4f4f5` (claro) / `#18181b` (escuro)
  - `bg-surface-elevated` (`--bg-surface-elevated`): `#ffffff` (claro) / `#27272a` (escuro)
- **Texto:**
  - `text-foreground` (`--text-foreground`): `#09090b` (claro) / `#fafafa` (escuro)
  - `text-muted` (`--text-muted`): `#71717a` (claro) / `#a1a1aa` (escuro)
- **Bordas & Divisores:**
  - `border-default` (`--border-default`): `#e4e4e7` (claro) / `#27272a` (escuro)
  - `border-subtle` (`--border-subtle`): `#f4f4f5` (claro) / `#1f1f23` (escuro)
- **Cores de Marca & Ação:**
  - `primary` (`--color-primary`): `#ea580c` (Laranja quente TapMesa — acolhedor, vibrante, alta visibilidade em ambientes gastronômicos)
  - `primary-hover`: `#c2410c`
  - `primary-foreground`: `#ffffff`
- **Feedback Semântico:**
  - `success`: `#16a34a` (claro) / `#22c55e` (escuro)
  - `alert` (Alerta do Painel): `#eab308` (claro) / `#facc15` (escuro)
  - `danger` / `urgent` (Urgência do Painel / Exclusão): `#dc2626` (claro) / `#ef4444` (escuro)
  - `info`: `#2563eb` (claro) / `#3b82f6` (escuro)

### 3.2 Tipografia

- Fonte principal de UI: `Inter` (sans-serif)
- Fonte de dados tabulares, códigos e timers: `JetBrains Mono` ou `ui-monospace` com `tabular-nums`
- Escala:
  - `text-xs`: 12px (0.75rem)
  - `text-sm`: 14px (0.875rem)
  - `text-base`: 16px (1rem) — tamanho mínimo para formulários no iOS (evita zoom indesejado)
  - `text-lg`: 18px (1.125rem)
  - `text-xl`: 20px (1.25rem)
  - `text-2xl`: 24px (1.5rem)
  - `text-3xl`: 30px (1.875rem)
  - `text-4xl`: 36px (2.25rem) — cabeçalhos de TV e destaques de mesa
  - `text-5xl`: 48px (3rem) — número da mesa no painel em TV

### 3.3 Espaçamento & Dimensões

- Escala base de 4px: `0.25rem` (4px), `0.5rem` (8px), `0.75rem` (12px), `1rem` (16px), `1.5rem` (24px), `2rem` (32px), `3rem` (48px), `4rem` (64px).
- **Alvos de toque:**
  - Base / Dashboard / Admin: mínimo **44px** × 44px
  - Tela da Mesa (`/m/[token]`): mínimo **64px** de altura para os botões de ação principal

### 3.4 Breakpoints Responsivos

- `sm`: 390px (Smartphones modernos)
- `md`: 600px (Tablets em modo retrato)
- `lg`: 900px (Tablets em paisagem / Laptops compactos)
- `xl`: 1280px (Desktop Full HD)
- `2xl`: 1920px (Monitores grandes e Smart TVs)
- `3xl`: 3840px (TVs 4K)

### 3.5 Movimento & Transições (Emil Kowalski)

- Duração padrão: 150ms a 200ms
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`
- `prefers-reduced-motion`: Animações transformam-se em opacidade instantânea (0.01ms), preservando a acessibilidade.

## 4. Componentes Base do Design System

Construídos sobre Radix UI e Tailwind CSS em `src/shared/ui/`:

1. `Button` (variantes: primary, secondary, outline, ghost, danger; tamanhos: sm, md, lg, table [64px])
2. `IconButton` (acessível com aria-label obrigatório)
3. `Input` (estados hover, focus-visible, error, disabled)
4. `Textarea` (com contador de caracteres)
5. `Select` (Radix Select com teclado acessível)
6. `Switch` (Radix Switch com rótulo descritivo)
7. `Checkbox` (Radix Checkbox)
8. `Badge` (neutral, success, alert, danger, info)
9. `Card` (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
10. `Dialog` (Radix Dialog; vira bottom-sheet responsivo em mobile)
11. `Drawer` (Bottom sheet para ações e detalhes mobile)
12. `Tabs` (Radix Tabs para alternância de visualizações)
13. `Toast` (Notificações não-bloqueantes com `sonner` ou Radix Toast)
14. `Tooltip` (Radix Tooltip para dicas pontuais)
15. `Skeleton` (Esqueleto de carregamento com animação de pulso sutil)
16. `EmptyState` (Ícone, título, descrição e botão de ação primária)
17. `DataTable` (Tabela acessível com ordenação e container scrollável)
18. `Pagination` (Controles de cursor e páginas)
19. `StatCard` (Exibição de métricas analíticas com variação e meta)
20. `ConnectionIndicator` (Status: conectado, reconectando, offline)
21. `ConfirmDialog` (Diálogo de confirmação para ações destrutivas)
22. `OneTimeSecretDialog` (Exibição de credenciais temporárias uma única vez com botão de cópia)
