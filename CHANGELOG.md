# Changelog

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

O formato baseia-se em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.0.0] - 2026-10-22

### Added

#### Fundação e Arquitetura (Fase 0)

- Inicialização do repositório com Next.js 16 (App Router), TypeScript estrito, Tailwind CSS e `eslint-plugin-boundaries`.
- Design System customizado baseado em tokens CSS e componentes primitivos Radix UI com showcase vivo em `/dev/ui`.
- Camada de API com cliente Axios, interceptor de renovação com mutex in-memory para rotação dual-token, tratamento de erros RFC 7807 e sincronização de relógio de servidor via cabeçalho `X-Server-Now` (ADR 0002).
- Autenticação e sessão com Zustand in-memory store (0 tokens em storage), formulário de login com proteção contra brute-force e sanitização anti-open-redirect.
- App Shell responsivo com suporte a desktop (sidebar retrátil), tablet (gaveta lateral) e mobile (bottom-nav), com error boundaries e skeletons granulares por rota.

#### Mesa Pública do Cliente (Fase 1)

- Tela pública da mesa `/m/[token]` com `TableThemeProvider` provendo algoritmo algorítmico de proteção de contraste WCAG 2.1 AA (4.5:1).
- Suporte a 6 estados visuais: Skeleton, Mesa Pausada, Estabelecimento Suspenso, Erro 404 QR Inválido, Offline/Rede e Estado Normal.
- Chamados de garçom e pedido de conta com botões táteis de 64px, coexistência independente, campo de observação de até 140 caracteres, cancelamento com diálogo seguro e feedback háptico.
- Canal Server-Sent Events (SSE) `/public/tables/:token/stream` com reconexão exponencial (1s a 30s), ressincronização em visibilidade/rede, avaliação rápida com 3 carinhas (1 a 3), contestação "Garçom não veio" e contagem regressiva de auto-confirmação.

#### Painel da Equipe de Salão (Fase 2)

- Painel operacional em tempo real `/panel` projetado para Smart TVs 1080p/4K e tablets de salão.
- `PanelHeader` com relógio digital em tempo real, contadores de chamados e identidade visual da casa.
- `PanelCallCard` com tipografia fluida clamp (legível a 3 metros em TVs) e 3 níveis semânticos: Normal, Alerta e Urgente.
- Modo de operação contínua 24/7 com Screen Wake Lock API (`useWakeLock`), síntese nativa de chimes com Web Audio API, alarme recorrente urgente, fila de voz nativa pt-BR (`speechSynthesis`) e suporte PWA instalável via Service Worker dedicado.
- Conexão em tempo real via tickets descartáveis de uso único (`POST /panel/stream-ticket`) com contingência automática via polling de 10 segundos.

#### Dashboard do Dono e Gestão (Fase 3)

- Gestão de mesas em `/dashboard/tables` com busca rápida por número, criação sequencial em lote (1 a 50) com sugestão automática de `next-number` e tratamento amigável de erro 409 duplicado.
- Ações otimistas de pausar e retomar mesas, exclusão segura com diálogo de confirmação e modal de visualização/download autenticado de QR Code vetorial SVG.
- Impressão de QR Codes em `/dashboard/tables/print` com grade A4 padronizada, seleção dinâmica de mesas e estilos `@media print` otimizados para PDF e impressão física sem quebra de cards.
- Resumo do Dia e Analytics em `/dashboard/analytics` com seletor de períodos respeitando o dia operacional (`dayCutoffHour`), KPIs com alertas visuais fora da meta, comparativo temporal, gráficos Recharts por hora com alternativa textual acessível, ranking de mesas e exportação direta para CSV.
- Gestão de equipe em `/dashboard/team` com listagem de colaboradores, métricas individuais de atendimento, criação de membros com credenciais provisórias em modal de uso único (`OneTimeSecretDialog`) e exclusão de equipe.
- Configurações de atendimento (`/dashboard/settings?tab=service`) com SLAs customizáveis, corte de dia operacional e barra de ações pendentes com confirmação de saída.
- Configurações de aparência (`/dashboard/settings?tab=appearance`) com mockup de smartphone interativo em tempo real, seletores de cor, uploads de logo e imagem de fundo, além de cálculo instantâneo de contraste WCAG AA.
- Configurações de notificações (`/dashboard/settings?tab=notifications`) com envio de e-mail diário e testes de disparo.

#### Portal Administrativo Global (Fase 4)

- Gestão multi-tenant em `/admin` com cadastro de restaurantes, geração automática de senhas fortes de 8 caracteres e suspensão/exclusão segura de inquilinos.
- Fluxo de suporte com personificação de inquilino via `ImpersonationBar` fixa no topo da interface.
- Trilha de auditoria em `/admin/audit` com visualização tabular e drawer de metadados JSON formatados.

#### Qualidade, Release e Infraestrutura (Fase 5)

- Auditoria de acessibilidade WCAG 2.1 AA em 100% das superfícies, componente `SkipLink`, targets táteis >= 64px e conformidade com leitores de tela.
- Refinamento de movimento conforme a filosofia Emil Kowalski com transições aceleradas por GPU, feedback `active:scale-[0.97]` e skeletons sem layout shift (CLS = 0).
- Auditoria de performance mobile (FCP ~1.4s em 4G) e endurecimento de CSP sem `unsafe-eval`.
- Suíte automatizada de testes Playwright E2E (`e2e/smoke.spec.ts`) validando a jornada completa contínua contra containers reais do backend em 3 viewports.
- Containerização com `Dockerfile` multi-stage (Node 24 Alpine, usuário `node`, build standalone) e `docker-compose.yml`.
- Pipelines de automação CI/CD no GitHub Actions (`ci.yml`, `e2e-smoke.yml`, `release.yml`), Dependabot e documentação de branch protection.
- Runbook operacional em `docs/runbook-front.md` e checklist de go-live em `docs/qa/go-live-checklist.md`.

### Security

- Content Security Policy (CSP) restritivo ativado em produção com `script-src 'self' 'unsafe-inline'` (sem `unsafe-eval`).
- Zero armazenamento de credenciais ou tokens em `localStorage`, `sessionStorage` ou cookies JavaScript (`httpOnly`).
- Exclusão rigorosa de rotas dinâmicas `/api/*` e `/m/*` no cache do Service Worker.
- Sanitização estrita de URLs de redirecionamento pós-login contra vulnerabilidades de open-redirect.
- Credenciais temporárias geradas exibidas em tela uma única vez e destruídas ao fechar o diálogo.
