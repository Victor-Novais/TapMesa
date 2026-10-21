# TapMesa Frontend — Arquitetura, Design e Plano de Execução

*Planejamento do front-end · Next.js + TypeScript + Tailwind · Integração com a API TapMesa · Skills de design: taste-skill, web-design-guidelines, awesome-design, emil-kowalski, impeccable · Versão 1.0 · 21/10/2026 · Base: Análise de Requisitos v1.1, Plano do Back-end v1.0 e documentação em docs/api (back concluído e auditado)*

## 1. Visão geral e decisões

### 1.1 Objetivo

Construir o front-end completo do TapMesa e integrá-lo à API já pronta: a tela que o cliente abre pelo QR Code, o painel em tempo real da equipe, o dashboard do dono (Resumo do Dia, mesas, equipe, configurações) e o portal do administrador do SaaS.

Este documento é também o **roteiro de execução**: a Seção 7 traz as tarefas escritas como prompts, para serem executadas em ordem por um agente de código ou por um desenvolvedor, do repositório vazio ao release. O back-end é a fonte da verdade dos contratos: tudo o que está em docs/api (API\_REFERENCE, TYPESCRIPT\_CONTRACTS, BUSINESS\_RULES, AUTHENTICATION\_AND\_PERMISSIONS, FRONTEND\_INTEGRATION, FRONTEND\_ENDPOINT\_MAPPING, openapi.json e endpoint-inventory.json) prevalece sobre qualquer suposição deste plano.

### 1.2 Escopo

| Superfície | Rota | Quem usa |
| --- | --- | --- |
| Tela da mesa (mobile web via QR Code) | /m/\[token\] | Cliente final, sem login |
| Painel da equipe (tempo real) | /panel | WAITER, OWNER, ADMIN |
| Dashboard do dono | /dashboard/\* | OWNER, ADMIN |
| Portal administrativo | /admin/\* | ADMIN |
| Login | /login | Todos os perfis autenticados |

Fora do escopo desta versão: cobrança e planos, cardápio digital, internacionalização (EN/ES), notificações push e recuperação de senha por e-mail (o back ainda não expõe essas rotas).

### 1.3 Stack

| Camada | Tecnologia | Observação |
| --- | --- | --- |
| Framework | Next.js (App Router) + React + TypeScript strict | Usa NEXT\_PUBLIC\_API\_URL, como nos guias do back |
| Estilo | Tailwind CSS com tokens em variáveis CSS | Tema claro e escuro; tema dinâmico por restaurante na tela da mesa |
| Primitivas de UI | Radix UI (acessíveis), compostas em um design system próprio | Não usar kit pronto sem personalizar: a identidade vem da Seção 2.10 |
| Dados do servidor | TanStack Query | Cache, revalidação, paginação por cursor |
| Estado local e tempo real | Zustand | Sessão, painel, tela da mesa |
| HTTP | Axios | Cliente e interceptor de refresh como em FRONTEND\_INTEGRATION.md |
| Formulários e validação | React Hook Form + Zod | Zod também valida respostas críticas (modo tolerante) |
| Gráficos | Recharts | Com alternativa em tabela para acessibilidade |
| Movimento | Motion (Framer Motion) | Guiado pela skill emil-kowalski |
| Datas | date-fns + date-fns-tz | Sempre no fuso do restaurante |
| Ícones | lucide-react |  |
| PWA | Serwist (ou equivalente) | Instalável no tablet/TV do painel |
| Qualidade | ESLint, Prettier, TypeScript strict, regras de import entre camadas | Sem TDD (Seção 1.5) |
| Container | Docker multi-stage com Next standalone | Seção 5 |

### 1.4 Decisões de arquitetura

| # | Decisão | Justificativa |
| --- | --- | --- |
| D1 | Organização por features (features/auth, table-screen, panel, tables, analytics, team, settings, admin) com camada shared | Cada superfície evolui sozinha; regras de import impedem acoplamento. |
| D2 | Access token somente em memória; refresh por cookie httpOnly (gerenciado pelo back) | Reduz o impacto de XSS. Nada de localStorage para tokens. |
| D3 | Front e API no mesmo site (exemplo: app.tapmesa.com.br e api.tapmesa.com.br), chamadas diretas à API com credentials | O cookie de refresh é SameSite=Strict e tem Path /api/v1/auth. Em desenvolvimento, front na porta 3001 (o back usa a 3000). |
| D4 | Proteção de rotas feita no cliente (AuthGate por perfil) | O cookie de refresh pertence ao domínio da API e não é visível ao servidor Next. |
| D5 | Evento SSE como gatilho + reconciliação: aplicar o patch local e refazer o GET de estado quando o payload for parcial | Os payloads dos eventos são parciais (exemplo: CALL\_CREATED não traz a observação). Evita estado divergente. |
| D6 | Relógio único sincronizado pelo serverNow, um único tick de 1 s compartilhado por todos os cronômetros | Cronômetros corretos mesmo com relógio errado no aparelho e sem um timer por card. |
| D7 | Componentes de tela da mesa são apresentacionais (recebem props) | Permitem a prévia ao vivo da aparência no dashboard (RF-D10) com o mesmo código do cliente. |
| D8 | SVG de QR Code renderizado como imagem (data URI), nunca com dangerouslySetInnerHTML | Elimina risco de XSS vindo de SVG. |
| D9 | Código em inglês; textos da interface em pt-BR centralizados em um arquivo de mensagens | Facilita a futura tradução (RF-C11). |
| D10 | Responsividade como requisito transversal: mobile-first de 320 px a 3840 px, painel pensado para TV e tablet, dashboard que muda de estrutura conforme a largura (Seção 2.11) | RNF-05 e RNF-06. |
| D11 | Tipos copiados de TYPESCRIPT\_CONTRACTS.md e conferidos contra openapi.json | Fonte única e rastreável. Divergências viram ADR e aviso ao responsável. |
| D12 | Download autenticado (CSV) via requisição com blob, nunca por link direto | O endpoint exige Authorization. |

### 1.5 Metodologia: sem TDD, com qualidade por construção

O front **não usa TDD**. A qualidade vem de:

- **Design system primeiro:** tokens e componentes base antes das telas (F02).
- **Contratos tipados:** TypeScript strict, tipos oficiais da API e Zod tolerante nas respostas críticas.
- **Gates automáticos:** `npm run verify` = lint + typecheck + build. O CI repete.
- **Revisão guiada por skills de design** em cada tela (Seção 1.6), registrada em docs/design/review-log.md.
- **Smoke E2E mínimo** (uma jornada completa, F23) e checklist manual de QA contra o back real.

### 1.6 Skills de design (uso obrigatório)

O agente deve usar as cinco skills abaixo nas tarefas de interface. **Antes de começar, confirme quais estão instaladas no ambiente.** Se alguma não estiver disponível, avise o responsável e siga os princípios descritos aqui, sem inventar comandos ou nomes. Registre em docs/design/review-log.md o que cada skill apontou e o que foi corrigido.

| Skill | Papel no projeto | Quando usar |
| --- | --- | --- |
| taste-skill | Direção estética e bom gosto: evitar o visual genérico de interface gerada por IA, escolher tipografia, composição, espaçamento e hierarquia com intenção | Na definição do design system (F02) e antes de desenhar cada tela |
| awesome-design | Referências de sistemas de design de produtos reais, para ancorar tokens, tom e padrões (escolher poucas referências e justificar) | Em F02, para fixar a direção; e quando houver dúvida de padrão |
| emil-kowalski | Princípios de animação e polimento de interações: durações, easing, feedback de toque, movimento com propósito, respeito a reduced motion | Ao implementar qualquer transição ou micro-interação (principalmente tela da mesa e painel) e na passada de F21 |
| web-design-guidelines | Auditoria de conformidade da interface com boas práticas de web design e acessibilidade | Ao concluir cada tela (revisão) e na auditoria geral (F20) |
| impeccable | Crítica e refinamento final de design (revisão, polimento e ajustes finos) | Ao concluir cada superfície e no polimento final (F21) |

**Ritual por tela:** (1) taste-skill e awesome-design para a direção; (2) implementar aplicando emil-kowalski nas interações; (3) rodar web-design-guidelines e corrigir; (4) rodar impeccable e corrigir; (5) registrar no review-log. Nenhuma tela é dada como pronta sem esse ritual.

## 2. Arquitetura

### 2.1 Camadas e regra de dependência

| Camada | Conteúdo | Pode importar de |
| --- | --- | --- |
| app/ | Rotas, layouts e páginas do Next (somente composição) | features, shared |
| features/\<nome> | Componentes, hooks, chamadas de API e stores de uma superfície | shared e a API pública (index) de outras features |
| shared/ui | Design system: tokens, componentes base e padrões | shared/lib |
| shared/lib, api, types, config | Cliente HTTP, relógio, SSE, áudio, formatação, tipos | Nada de features |

A regra é verificada por eslint-plugin-boundaries (ou equivalente) e quebra o `npm run verify`.

### 2.2 Estrutura de pastas

```
tapmesa-web/
├── docs/                       api/ (docs do back), design/ (DESIGN.md, review-log.md), adr/, PROGRESS.md
├── public/                     ícones, manifest, sounds/
├── src/
│   ├── app/
│   │   ├── (public)/m/[token]/          tela da mesa
│   │   ├── (auth)/login/
│   │   ├── (staff)/panel/
│   │   ├── (dashboard)/dashboard/       analytics, tables, team, settings
│   │   ├── (admin)/admin/               restaurantes, audit
│   │   └── layout.tsx, not-found.tsx, error.tsx
│   ├── features/
│   │   └── auth, table-screen, panel, tables, analytics, team, settings, admin
│   └── shared/
│       ├── api/ (client, interceptors, endpoints por domínio, problem-details)
│       ├── ui/ (design system)
│       ├── lib/ (clock, format, sse, audio, fullscreen, wake-lock)
│       ├── messages/ (textos pt-BR)
│       └── types/ (api.ts copiado dos contratos)
├── next.config.ts, Dockerfile, docker-compose.yml, .env.example, .gitignore
└── README.md, CHANGELOG.md
```

### 2.3 Mapa de rotas e perfis

| Rota | Perfis | Observação |
| --- | --- | --- |
| / | Público | Redireciona por perfil (ADMIN → /admin, OWNER → /dashboard, WAITER → /panel) ou para /login. Compatibilidade: /?m=TOKEN redireciona para /m/TOKEN. |
| /m/\[token\] | Anônimo | Sem login. O token vem do QR (https://app.tapmesa.com.br/m/TOKEN). |
| /login | Público | Já autenticado é redirecionado. |
| /panel | WAITER, OWNER, ADMIN | Tela cheia, tempo real. |
| /dashboard | OWNER, ADMIN | Redireciona para /dashboard/analytics (Resumo do Dia). |
| /dashboard/analytics, /tables, /tables/print, /team, /settings | OWNER, ADMIN | ADMIN precisa estar impersonando um restaurante. |
| /admin, /admin/audit | ADMIN | Gestão do SaaS. |

### 2.4 Telas e endpoints

| Tela | Endpoints (prefixo /api/v1) |
| --- | --- |
| Login e sessão | POST /auth/login, POST /auth/refresh, POST /auth/logout, GET /auth/me |
| Tela da mesa | GET /public/tables/:token; GET /public/tables/:token/stream (SSE); POST /public/tables/:token/calls; POST .../calls/:callId/cancel, /confirm (body rating 1 a 3) e /contest |
| Painel | POST /panel/stream-ticket; GET /panel/stream?ticket= (SSE); GET /panel/state; GET /panel/calls; POST /panel/calls/:id/assume (usar esta; acknowledge é equivalente); POST /panel/calls/:id/attend; GET /panel/calls/recent?limit= |
| Resumo do Dia | GET /analytics/summary, /by-hour, /tables-ranking, /calls, /summary/compare, /export.csv |
| Mesas | GET /tables; GET /tables/next-number; POST /tables (startNumber, count); PATCH /tables/:id/pause e /resume; DELETE /tables/:id; GET /tables/print; GET /tables/:id/qr?format=svg |
| Equipe | GET e POST /restaurant/users; GET /restaurant/users/metrics; PATCH /restaurant/users/:id/status; POST /restaurant/users/:id/reset-password; DELETE /restaurant/users/:id |
| Configurações | GET e PUT /settings/service; GET e PUT /settings/appearance; POST /settings/appearance/reset, /logo e /background (multipart, campo file); GET e PATCH /restaurant/notifications/settings; POST /restaurant/notifications/send-daily-summary |
| Admin | GET e POST /admin/restaurants; DELETE /admin/restaurants/:id (body confirmName); PATCH .../suspend e /reactivate; POST .../reset-owner-password e /impersonate; GET /admin/audit |

### 2.5 Autenticação e sessão no front

1. **Login:** POST /auth/login devolve só o accessToken (o usuário não vem no corpo). Em seguida, GET /auth/me para obter id, username, role e restaurantId.
2. **Boot da aplicação:** ao carregar, tenta POST /auth/refresh (o cookie vai sozinho). Sucesso → guarda o token em memória e chama /auth/me. Falha → vai para /login.
3. **Renovação:** interceptor de resposta trata 401 com fila única de refresh, como em FRONTEND\_INTEGRATION.md. TOKEN\_REUSE\_DETECTED e INVALID\_REFRESH\_TOKEN encerram a sessão e levam a /login?expired=true.
4. **Erros de login:** mapear INVALID\_CREDENTIALS, ACCOUNT\_LOCKED (bloqueio de 15 min), ACCOUNT\_INACTIVE, RESTAURANT\_SUSPENDED e 429 para mensagens claras em pt-BR.
5. **Impersonação:** POST /admin/restaurants/:id/impersonate devolve outro accessToken (role OWNER, claim imp). O front guarda esse token em memória, separado do token do admin, e exibe uma **barra fixa** de modo suporte com a ação Sair da impersonação (volta ao token do admin). Ao recarregar a página, a impersonação termina (o cookie de refresh é do admin).
6. **Logout:** POST /auth/logout, limpa memória, caches e fecha streams SSE.

### 2.6 Tempo real (SSE) e relógio

- **Painel:** a cada conexão, POST /panel/stream-ticket (ticket de uso único, 60 s) e então `new EventSource(.../panel/stream?ticket=)`. Nunca reutilizar ticket: toda reconexão pede um novo. O primeiro evento é snapshot (estado completo).
- **Mesa:** `new EventSource(.../public/tables/:token/stream)`, sem ticket.
- **Reconexão:** backoff exponencial (1 s até 30 s). Ao reconectar, ao voltar para a aba (visibilitychange) e ao recuperar rede (evento online), refazer o GET de estado. Enquanto o SSE estiver caído, o painel faz polling de GET /panel/state a cada 10 s.
- **Indicador de conectividade:** conectado, reconectando, offline (RF-C02, RNF-15), sempre visível.
- **Relógio:** toda resposta traz serverNow (corpo e, quando exposto por CORS, o header X-Server-Now). `syncClock()` calcula o offset. Cronômetro = serverNow estimado − createdAt. Um único tick de 1 s alimenta todos os cards.

### 2.7 Máquina de estados da UI do cliente

Cada tipo de chamado (WAITER e BILL) tem seu próprio estado, e os dois podem coexistir.

| Estado da UI | Condição | O que o cliente vê e pode fazer |
| --- | --- | --- |
| Carregando | Primeira carga | Esqueleto com a marca |
| QR inválido | 404 TABLE\_NOT\_FOUND | Mensagem amigável, sem botões |
| Indisponível | available = false (TABLE\_PAUSED ou RESTAURANT\_SUSPENDED) | Mensagem do restaurante, botões desativados |
| Livre | Sem chamado ativo do tipo | Botão do tipo ativo, campo de observação opcional |
| Pendente | status PENDING | Botão em estado pendente com o horário; cronômetro se showWaitTimeToCustomer; ação Cancelar chamado; selo de reaberto quando reopenCount > 0 |
| Atendido | status ATTENDED | Pergunta Tudo certo?: três carinhas (1 Ruim, 2 Regular, 3 Bom) que confirmam; botão Garçom não veio (contest); contagem regressiva até confirmationDeadline. O botão do tipo volta a ficar livre para novo chamado |
| Confirmado | status CONFIRMED | Agradecimento breve e vibração leve, depois volta a Livre |
| Encerrado | CLOSED\_UNCONFIRMED, CANCELLED ou EXPIRED | Volta a Livre; EXPIRED mostra aviso gentil para chamar de novo |

Regras: observação com no máximo o limite aceito pelo back (a documentação cita 140 caracteres, a análise de requisitos cita 150; usar a constante do openapi.json). Resposta 200 com alreadyPending = true não é erro: mostrar o chamado existente. Após o limite de 2 reaberturas o back mantém ATTENDED com contested = true: não oferecer mais Garçom não veio.

### 2.8 Painel: eventos e níveis de alerta

| Evento SSE | Efeito no painel |
| --- | --- |
| snapshot | Substitui todo o estado (calls, alertSec, urgentSec, contadores, serverNow) |
| CALL\_CREATED | Adiciona o card, toca o som do tipo e anuncia por voz; refaz GET /panel/calls para completar campos ausentes (observação) |
| CALL\_ACKNOWLEDGED, CALL\_ASSUMED | Marca o card como assumido por quem assumiu |
| CALL\_ATTENDED | Remove o card da fila e o leva para a gaveta de recentes |
| CALL\_CONFIRMED, CALL\_CLOSED\_UNCONFIRMED | Atualiza o status na gaveta de recentes |
| CALL\_REOPENED (se emitido) | Card volta à fila com selo Reaberto e som |
| CALL\_CANCELLED, CALL\_EXPIRED | Remove o card |
| Evento desconhecido | Refaz GET /panel/state (com debounce de 300 ms) |

Níveis (BUSINESS\_RULES.md): **Normal** abaixo de alertSec; **Alerta** de alertSec até urgentSec; **Urgente** a partir de urgentSec. Os limites vêm do snapshot (configuráveis por restaurante). Ordenação do mais antigo para o mais recente; Conta tem destaque.

### 2.9 Tema dinâmico por restaurante (tela da mesa)

- A aparência vem de GET /public/tables/:token (colors, texts, socials, logoUrl, backgroundType e backgroundValue) e vira variáveis CSS no contêiner da tela.
- **Proteção de contraste:** o dono escolhe cores livres. O front calcula contraste (WCAG) entre texto e fundo e, se ficar abaixo de 4,5:1, usa uma cor de texto segura e avisa o dono no editor.
- Fundo com imagem recebe película (overlay) para garantir legibilidade (RF-D08). Cores e textos ausentes usam os padrões do design system.
- Links de redes sociais aceitam só http, https ou handle (@usuario), abrem com rel=noopener noreferrer e a página /m/\* usa Referrer-Policy no-referrer para não vazar o token.

### 2.10 Design system

- **Tokens** (variáveis CSS + Tailwind): cores semânticas (superfície, texto, borda, primária, sucesso, alerta, perigo) em claro e escuro; escala tipográfica com no máximo duas famílias; espaçamento em escala de 4 px; raios; sombras; durações e easings de movimento.
- **Alvos de toque** de no mínimo 64 px na tela da mesa (RNF-05) e 44 px no restante; tipografia base de 16 px.
- **Painel em TV:** alto contraste, tipografia grande, legível a distância (RNF-06).
- **Componentes base:** Button, IconButton, Input, Textarea, Select, Switch, Checkbox, Badge, Card, Dialog, Drawer, Tabs, Toast, Tooltip, Skeleton, EmptyState, DataTable, Pagination, StatCard, ConnectionIndicator, ConfirmDialog, OneTimeSecretDialog.
- **Acessibilidade:** foco visível, rótulos ARIA, regiões aria-live para alertas e cronômetros importantes, suporte a prefers-reduced-motion (WCAG 2.1 AA, RNF-07).
- A direção visual é decidida em F02 com as skills taste-skill e awesome-design e registrada em docs/design/DESIGN.md.

### 2.11 Responsividade (requisito transversal)

Toda tela precisa funcionar bem de 320 px a 3840 px de largura, sem rolagem horizontal da página e sem perder função em nenhum tamanho. A abordagem é mobile-first, e os layouts mudam de estrutura (lista vira card, tabela vira lista, abas viram colunas), não apenas encolhem.

**Faixas e dispositivos de referência** (os cinco breakpoints viram tokens na F02: 390, 600, 900, 1280 e 1920 px)

| Faixa | Largura | Dispositivos de referência | Superfícies principais |
| --- | --- | --- | --- |
| Celular pequeno | 320 a 389 px | iPhone SE, Android compacto | Tela da mesa (largura mínima suportada) |
| Celular | 390 a 599 px | iPhone 15, Pixel, Galaxy | Tela da mesa, painel do garçom, dashboard |
| Tablet retrato | 600 a 899 px | iPad mini, tablets Android | Painel, dashboard |
| Tablet paisagem e notebook pequeno | 900 a 1279 px | iPad, notebook de 13 polegadas | Painel, dashboard, admin |
| Desktop | 1280 a 1919 px | Notebook e monitor Full HD | Dashboard, admin, impressão |
| TV e telas grandes | 1920 a 3840 px | TV Full HD e 4K, lida a 3 metros | Painel |

**Princípios**

- **Mobile-first:** estilos base para 320 px e crescimento com min-width. Unidades relativas (rem, %, clamp()), tipografia e espaçamento fluidos, grid e flex com minmax. Nenhuma largura fixa em px para conteúdo.
- **Sem rolagem horizontal da página** em qualquer largura de 320 a 3840 px. Só tabelas largas e gráficos podem rolar dentro do próprio contêiner, com indicação visual.
- **Viewport e áreas seguras:** meta viewport com viewport-fit=cover; env(safe-area-inset-\*) em barras fixas e rodapés; altura com dvh ou svh (nunca 100vh); o campo focado nunca fica atrás do teclado.
- **Orientação:** retrato e paisagem funcionam em celular e tablet.
- **Componentes adaptáveis:** card de chamado, StatCard e tela da mesa respondem ao espaço do contêiner (container queries), o que também serve à pré-via da aparência.
- **Texto e zoom:** zoom do usuário até 200% e fonte ampliada do sistema sem quebrar o layout; nunca bloquear o zoom; campos de formulário com no mínimo 16 px (evita o zoom automático do iOS).
- **Toque e ponteiro:** alvos de 64 px (tela da mesa) e 44 px (demais); hover nunca é o único caminho; @media (pointer: coarse) amplia controles; todo gesto tem alternativa por botão.
- **TV:** margem de segurança de 2% a 3% nas bordas (overscan), tipografia fluida legível a 3 metros, alto contraste.
- **Imagens:** logo e fundo com srcset e proporção reservada, para evitar salto de layout.

**Padrões por componente**

| Componente | Celular (até 599 px) | Tablet (600 a 1279 px) | Desktop (1280 px ou mais) |
| --- | --- | --- | --- |
| Navegação do dashboard | Barra inferior | Sidebar recolhida em ícones | Sidebar expandida |
| Tabelas (chamados, equipe, restaurantes, auditoria) | Lista de cards com 3 dados principais e detalhes em drawer | Tabela com colunas essenciais | Tabela completa |
| Gráfico por hora | Tooltip por toque e tabela alternativa | Gráfico completo | Gráfico completo e tabela alternativa |
| StatCards do Resumo | 1 a 2 por linha | 2 a 3 por linha | 4 ou mais por linha |
| Formulários | Uma coluna, rótulo acima, botão Salvar fixo no rodapé | Uma a duas colunas | Duas colunas |
| Pré-via da aparência | Abas Editar e Pré-via | Lado a lado | Lado a lado, pré-via fixa |
| Diálogos | Bottom sheet (tela cheia se longo) | Diálogo centralizado | Diálogo centralizado |
| Painel de chamados | Lista única, botões de largura total | 2 colunas (retrato) e 3 (paisagem) | 3 a 4 colunas; em TV, 4 ou mais com tipografia ampliada |
| Gaveta de recentes do painel | Bottom sheet | Painel lateral | Painel lateral |

**Verificação obrigatória:** testar nos viewports 320×568, 360×640, 390×844, 430×932, 768×1024, 1024×768 (paisagem), 1280×800, 1440×900, 1920×1080 e 3840×2160, no DevTools e em dispositivos reais (iOS Safari, Android Chrome e TV). Critérios: sem rolagem horizontal, nenhum texto cortado ou sobreposto, todos os controles visíveis e alcançáveis, teclado aberto sem esconder o campo ativo e safe areas respeitadas.

## 3. Segurança do front-end

| Ameaça | Controles |
| --- | --- |
| Roubo de sessão por XSS | Access token só em memória; nenhum token em localStorage, sessionStorage, URL ou log; refresh em cookie httpOnly gerenciado pelo back |
| XSS por conteúdo do restaurante ou do cliente | Todo texto renderizado como texto (sem dangerouslySetInnerHTML); SVG de QR como imagem data URI; URLs de redes sociais validadas; CSP restritiva configurada em next.config |
| CSRF | Cookie SameSite=Strict e deploy no mesmo site; requisições de mutação só com Bearer |
| Vazamento do token da mesa | Referrer-Policy no-referrer em /m/\*; links externos com rel=noopener noreferrer; token nunca enviado a terceiros nem a ferramentas de analytics |
| Redirecionamento aberto | Pós-login só redireciona para caminhos internos conhecidos |
| Ticket SSE | Pedido imediatamente antes de conectar, nunca persistido, nunca registrado em log |
| Credenciais temporárias (senha de novo restaurante ou membro) | Exibidas uma vez em OneTimeSecretDialog, mantidas apenas em estado do componente, fora do cache do TanStack Query, da URL e do storage; apagadas ao fechar o diálogo |
| Impersonação | Barra permanente de modo suporte; token separado em memória; mutações ficam auditadas pelo back |
| Clickjacking | frame-ancestors none na CSP |
| Abuso e limites | Tratar 429 com mensagem e backoff; desabilitar o botão durante envio; sem retry automático em mutações |
| Privacidade (LGPD) | Nenhum dado pessoal do cliente final; sem trackers de terceiros; sem coleta de identificadores sem necessidade |
| Dependências | package-lock versionado, npm audit no CI, Renovate ou Dependabot |
| Configuração | Somente variáveis NEXT\_PUBLIC\_\* públicas; nenhum segredo no front |

## 4. Qualidade e fluxo de trabalho (sem TDD)

### 4.1 Gates automáticos

`npm run verify` executa lint, typecheck, verificação de camadas (boundaries) e build de produção. O pre-commit (husky + lint-staged) formata e roda lint; o commit-msg (commitlint) exige Conventional Commits; o CI repete tudo.

### 4.2 Regras de código

- TypeScript strict, sem any. Union types em vez de strings soltas. Tipos da API vêm de shared/types/api.ts.
- Componentes pequenos e sem regra de negócio: a lógica fica em hooks e models da feature.
- Todo texto de interface vem de shared/messages (pt-BR). Datas, números e durações com Intl no fuso do restaurante.
- Todo erro de API passa por parseApiError (RFC 7807) e vira mensagem amigável. Nunca mostrar stack ou texto técnico ao usuário.
- Proibido: dangerouslySetInnerHTML, console.log em produção, token em storage, chave ou segredo no código.

### 4.3 Estados obrigatórios de toda tela

Carregando (esqueleto), vazio (com orientação do próximo passo), erro (com ação de tentar de novo), offline, sem permissão e sucesso. Telas sem esses seis estados não passam no Definition of Done.

### 4.4 Metas de desempenho e acessibilidade

| Item | Meta |
| --- | --- |
| FCP de /m/\[token\] em 4G (RNF-02) | ≤ 2 s |
| Lighthouse mobile em /m/\[token\] | Desempenho e acessibilidade ≥ 90 |
| INP | < 200 ms |
| JavaScript inicial de /m/\[token\] | Mínimo possível (sugestão: ≤ 150 KB gzip) |
| Acessibilidade | WCAG 2.1 AA, foco visível, teclado completo, prefers-reduced-motion |
| Alvos de toque | 64 px na tela da mesa, 44 px no restante |
| Responsividade (Seção 2.11) | De 320 a 3840 px, sem rolagem horizontal da página e sem texto cortado |

### 4.5 Git

- Uma branch por tarefa (exemplo: feat/F07-table-calls). A main é protegida.
- Conventional Commits com escopo igual à feature (feat(panel): ...). Commits pequenos.
- Pull request com o checklist do Definition of Done e, nas telas, o registro do ritual de skills em docs/design/review-log.md.

## 5. Ambiente, Docker e .gitignore

### 5.1 Variáveis de ambiente (.env.example)

| Variável | Descrição | Exemplo |
| --- | --- | --- |
| NEXT\_PUBLIC\_API\_URL | Base da API (inclui /api/v1) | http://localhost:3000/api/v1 |
| NEXT\_PUBLIC\_APP\_URL | URL pública do front (usada em links e metadata) | http://localhost:3001 |
| PORT | Porta do front | 3001 |
| NEXT\_TELEMETRY\_DISABLED | Desliga telemetria do Next | 1 |

As variáveis NEXT\_PUBLIC\_\* são gravadas no build. Mudou o valor, refaça o build.

### 5.2 Pré-requisitos no back-end

- CORS\_ORIGINS do back inclui a origem do front (exemplo: http://localhost:3001) com credenciais habilitadas.
- Em desenvolvimento, COOKIE\_SECURE=false no back. Em produção, front e API no mesmo site (subdomínios de um mesmo domínio).
- O back expõe o header X-Server-Now via Access-Control-Expose-Headers. Se não expuser, o front usa apenas o serverNow do corpo (registrar no ADR da F03).
- A base do QR no back (PUBLIC\_APP\_URL) deve apontar para o front, formando https://app.tapmesa.com.br/m/TOKEN.

### 5.3 Dockerfile (multi-stage, referência)

```dockerfile
FROM node:24-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS dev
COPY . .
EXPOSE 3001
CMD npm run dev

FROM deps AS build
COPY . .
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN npm run build

FROM base AS prod
ENV NODE_ENV=production PORT=3001 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3001
CMD node server.js
```

### 5.4 docker-compose.yml (referência)

```yaml
services:
  web:
    build:
      context: .
      target: prod
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
        NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL}
    ports: [3001:3001]
    read_only: true
    tmpfs: [/tmp, /app/.next/cache]
    cap_drop: [ALL]
    security_opt: [no-new-privileges:true]
    restart: unless-stopped
    healthcheck:
      test: [CMD-SHELL, wget -qO- http://localhost:3001/ || exit 1]
      interval: 15s
      timeout: 3s
      retries: 5
```

Um docker-compose.override.yml de desenvolvimento usa target dev, volumes de src e public e hot reload. Para rodar com o back, o front entra na mesma rede Docker do back (rede externa) ou acessa a API publicada em localhost:3000.

### 5.5 .gitignore (conteúdo oficial)

```gitignore
# Dependências
node_modules/
.pnp.*
.yarn/*
!.yarn/patches

# Next.js e build
.next/
out/
build/
dist/
*.tsbuildinfo
next-env.d.ts

# Ambiente e segredos
.env
.env.*
!.env.example
*.pem
*.key
*.crt
secrets/

# Logs
logs/
*.log
npm-debug.log*

# Testes e relatórios
coverage/
playwright-report/
test-results/
blob-report/
.lighthouseci/
reports/

# PWA gerado
public/sw.js
public/sw.js.map
public/swe-worker-*.js
public/workbox-*.js

# Docker local
docker-compose.override.local.yml

# IDEs e sistema operacional
.idea/
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
*.swp
.DS_Store
Thumbs.db

# Temporários e caches
tmp/
temp/
.cache/
.eslintcache
.turbo/
.husky/_/
.vercel/
```

O .dockerignore repete node\_modules, .next, .git, .env\*, coverage e docs, para manter a imagem pequena e sem segredos.

## 6. Plano de execução

### 6.1 Contrato do agente (vale para todas as tarefas)

1. Antes de qualquer código, leia docs/api (documentação do back) e este plano. Os contratos do back prevalecem. Se algo no back contradizer este plano, registre em ADR, siga o back e avise o responsável. Não altere o back-end.
2. Execute as tarefas na ordem do mapa (6.3). Só avance quando o Definition of Done da tarefa atual estiver cumprido.
3. Não use TDD. A qualidade vem do design system, dos tipos, dos gates e do ritual de skills (Seção 1.6).
4. Em toda tarefa de interface, execute o ritual de skills e registre o resultado em docs/design/review-log.md. Se uma skill não estiver instalada, avise e siga os princípios do plano.
5. Respeite a regra de dependência entre camadas e a Seção 3 (segurança). Nunca guarde token fora da memória.
6. Não adicione dependências fora da Seção 1.3 sem ADR curto explicando o motivo.
7. Diante de ambiguidade, adote o padrão da Seção 9, registre ADR e siga em frente. Pergunte ao responsável apenas se estiver bloqueado.
8. Em cada tarefa: branch, commits convencionais, `npm run verify` verde, docs/PROGRESS.md atualizado.
9. Teste cada tela manualmente contra o back real (docker compose do back), nas larguras da matriz de responsividade (2.11), antes de marcá-la como pronta.
10. Ao fim de cada tarefa, reporte: o que foi feito, decisões, divergências encontradas no back e pendências.

### 6.2 Definition of Done (por tarefa)

- Critérios de aceite atendidos e fluxo testado manualmente contra o back real.
- Os seis estados obrigatórios de tela (4.3) implementados e a tela validada nas larguras da matriz de responsividade (2.11), sem rolagem horizontal.
- Ritual de skills concluído e registrado, sem achado crítico em aberto.
- `npm run verify` verde; sem segredo, console.log ou código morto.
- Documentação atualizada (README, ADR quando houver decisão, DESIGN.md quando houver token ou padrão novo).

### 6.3 Mapa de tarefas

| Fase | ID | Tarefa | Depende de |
| --- | --- | --- | --- |
| 0 Fundação | F00 | Bootstrap do repositório | — |
| 0 | F01 | Projeto Next.js, qualidade e headers | F00 |
| 0 | F02 | Direção de design e design system | F01 |
| 0 | F03 | Camada de API, tipos, erros e relógio | F01 |
| 0 | F04 | Autenticação e sessão | F03 |
| 0 | F05 | App shell, navegação e estados globais | F02, F04 |
| 1 Tela da mesa | F06 | Tela da mesa: carga, tema e estados | F02, F03 |
| 1 | F07 | Chamados do cliente | F06 |
| 1 | F08 | Tempo real da mesa, confirmação e contestação | F07 |
| 2 Painel | F09 | Painel: conexão, estado e ações | F04, F03 |
| 2 | F10 | Painel: interface de operação | F02, F09 |
| 2 | F11 | Painel: modo operação (tela cheia, áudio, voz, PWA) | F10 |
| 3 Dashboard | F12 | Mesas: gestão, QR e lote | F05 |
| 3 | F13 | Impressão de QR Codes | F12 |
| 3 | F14 | Resumo do Dia | F05 |
| 3 | F15 | Equipe | F05 |
| 3 | F16 | Configurações: atendimento | F05 |
| 3 | F17 | Configurações: aparência com pré-via ao vivo | F08, F16 |
| 3 | F18 | Configurações: notificações | F16 |
| 4 Admin | F19 | Portal administrativo e auditoria | F05 |
| 5 Qualidade e release | F20 | Auditoria de acessibilidade e UX | F19 |
| 5 | F21 | Movimento e polimento final | F20 |
| 5 | F22 | Desempenho, segurança e PWA | F21 |
| 5 | F23 | Smoke E2E e QA contra o back real | F22 |
| 5 | F24 | Docker e CI | F23 |
| 5 | F25 | Release e documentação | F24 |

## 7. Tarefas (prompts de execução)

Cada tarefa é um prompt autocontido. Em todas, siga o Contrato do agente (6.1) e o Definition of Done (6.2). Onde houver a linha **Skills**, execute o ritual da Seção 1.6.

### Fase 0 — Fundação

### F00 — Bootstrap do repositório

**Depende de:** nada

**Prompt:** Você vai iniciar o repositório do front-end TapMesa. Esta tarefa não tem código de aplicação.

**Passos:**

1. Use a pasta do projeto (ou crie tapmesa-web) e rode git init com a branch main.
2. Crie o .gitignore com o conteúdo exato da Seção 5.5, o .dockerignore, o .editorconfig (UTF-8, LF, 2 espaços) e o .nvmrc com a Node LTS vigente.
3. Garanta docs/api com os 11 arquivos da documentação do back (README, API\_REFERENCE, AUTHENTICATION\_AND\_PERMISSIONS, BUSINESS\_RULES, DATA\_MODEL, FRONTEND\_INTEGRATION, FRONTEND\_ENDPOINT\_MAPPING, TYPESCRIPT\_CONTRACTS, AUDIT\_REPORT, endpoint-inventory.json e openapi.json). Se faltar algum, pare e avise.
4. Crie docs/design (DESIGN.md e review-log.md com cabeçalho), docs/adr/0001-architecture-decisions.md registrando D1 a D12 e docs/PROGRESS.md com a tabela F00 a F25 (status todo).
5. Verifique quais das cinco skills de design estão instaladas (taste-skill, web-design-guidelines, awesome-design, emil-kowalski, impeccable) e registre a lista (instaladas e ausentes) no topo do review-log.md.
6. Crie o README inicial (visão, stack, pré-requisitos, comandos) e .github/pull\_request\_template.md com o Definition of Done.
7. Commit: chore: bootstrap repository.

**Aceite:** git status limpo; `git check-ignore .env` confirma o ignore; docs/ completa; lista de skills registrada.

### F01 — Projeto Next.js, qualidade e headers

**Depende de:** F00

**Prompt:** Crie o projeto Next.js com a base de qualidade e segurança de borda.

**Passos:**

1. Scaffold com create-next-app (App Router, TypeScript, Tailwind, ESLint, src/, npm). Scripts dev e start na porta 3001. TypeScript com strict e noUncheckedIndexedAccess. Alias @/\*.
2. Prettier com plugin do Tailwind. eslint-plugin-boundaries com as regras da Seção 2.1. Scripts lint, typecheck, check:boundaries e verify (lint + typecheck + boundaries + build).
3. husky + lint-staged + commitlint (Conventional Commits).
4. Crie a árvore de pastas da Seção 2.2 com .gitkeep.
5. Valide as variáveis de ambiente com zod em src/shared/config/env.ts (NEXT\_PUBLIC\_API\_URL e NEXT\_PUBLIC\_APP\_URL), falhando no boot com mensagem clara. Crie o .env.example (Seção 5.1).
6. next.config.ts com output standalone e headers de segurança: CSP inicial (default-src self; connect-src com a origem da API; img-src self, data e a origem das imagens da API; frame-ancestors none), X-Content-Type-Options nosniff, Permissions-Policy restritiva, Referrer-Policy strict-origin-when-cross-origin e **no-referrer para /m/**\*.
7. Layout raiz com lang pt-BR, metadata e viewport (viewport-fit cover, theme-color).

**Validação:** `npm run verify` verde; `curl -I` mostra os headers; importar features de outra feature fora do index quebra o check:boundaries.

**Aceite:** app sobe em localhost:3001; build standalone gerado.

### F02 — Direção de design e design system

**Depende de:** F01

**Prompt:** Esta é a tarefa mais importante de design. Defina a identidade do TapMesa e construa o design system antes de qualquer tela.

**Skills:** taste-skill, awesome-design, emil-kowalski, impeccable.

**Passos:**

1. **Direção antes do código.** Considere os três contextos de uso: cliente no salão com o celular, garçom em movimento com tablet ou TV, dono analisando números. Escolha 2 ou 3 referências com awesome-design e justifique. Use taste-skill para definir personalidade (calma, confiável, rápida), tipografia, composição e hierarquia, evitando o visual genérico. Registre tudo em docs/design/DESIGN.md (princípios, referências, decisões).
2. **Tokens** em variáveis CSS e no tema do Tailwind: cores semânticas (superfície, texto, borda, primária, sucesso, alerta, perigo) em claro e escuro, no máximo duas famílias tipográficas via next/font, escala de espaçamento de 4 px, raios, sombras, e tokens de movimento (durações curtas, easing de entrada e saída, reduced motion) seguindo emil-kowalski. Tema com prefers-color-scheme e alternância manual.
3. **Componentes base** da Seção 2.10 em src/shared/ui sobre Radix, com variantes tipadas e todos os estados (hover, focus-visible, active, disabled, loading). Alvos de toque de 44 px (64 px na variante da tela da mesa). Inclua ConnectionIndicator, ConfirmDialog e OneTimeSecretDialog (mostra um segredo uma vez, botão Copiar, aviso de que não será exibido de novo, limpa o estado ao fechar).
4. Crie a rota /dev/ui (retorna not-found em produção) com a vitrine de tokens, componentes e estados.
5. Rode web-design-guidelines e impeccable na vitrine e corrija. Registre no review-log.

**Responsividade:** defina os tokens de breakpoint da Seção 2.11 (390, 600, 900, 1280 e 1920 px), tipografia e espaçamento fluidos com clamp() e utilitários de safe area (env(safe-area-inset-\*)) e de altura dinâmica (dvh). Os componentes base devem se adaptar ao espaço do contêiner (container queries) e ter a variante bottom sheet para diálogos no celular. A vitrine /dev/ui ganha um seletor de largura (320 a 3840 px) para conferir cada componente.

**Aceite:** vitrine completa em claro e escuro; contraste AA; reduced motion respeitado; DESIGN.md e review-log preenchidos.

### F03 — Camada de API, tipos, erros e relógio

**Depende de:** F01

**Prompt:** Construa a base de integração com o back conforme docs/api/FRONTEND\_INTEGRATION.md.

**Passos:**

1. Copie os tipos de TYPESCRIPT\_CONTRACTS.md para src/shared/types/api.ts e confira cada endpoint e payload contra openapi.json e endpoint-inventory.json. Registre divergências em docs/adr/0002-api-divergences.md. Itens já conhecidos para verificar: limite de caracteres da observação (140 ou 150), limite de upload (10 MB), formato da resposta de /analytics/summary/compare (não documentado), existência de /restaurant/current (senão usar /auth/me), emissão do evento CALL\_REOPENED, exposição do header X-Server-Now por CORS.
2. Cliente Axios (baseURL do env, withCredentials, X-Request-Id) com o interceptor de 401 e a fila única de refresh de FRONTEND\_INTEGRATION.md. Token só em memória. Ignora /auth/login e /auth/refresh.
3. parseApiError (RFC 7807) e o mapa de códigos para mensagens em pt-BR em shared/messages/errors.ts: TABLE\_NOT\_FOUND, INVALID\_CREDENTIALS, ACCOUNT\_LOCKED, ACCOUNT\_INACTIVE, USER\_INACTIVE, RESTAURANT\_SUSPENDED, TOKEN\_REUSE\_DETECTED, INVALID\_REFRESH\_TOKEN, USERNAME\_ALREADY\_EXISTS, CONFIRMATION\_NAME\_MISMATCH, CANNOT\_IMPERSONATE\_SUSPENDED\_RESTAURANT, INVALID\_RATING, VALIDATION\_ERROR, conflito de mesas duplicadas (409 com duplicates) e 429.
4. Módulos de endpoints por domínio (auth, publicTable, panel, analytics, tables, team, settings, notifications, admin) com funções tipadas.
5. QueryClient com padrões (retry limitado e nunca em 4xx, sem retry em mutações) e chaves de query centralizadas.
6. Utilitário de relógio (syncClock, getServerNowMs, calculateElapsedSec, formatTimer) e o hook useNow com um único tick de 1 s compartilhado.
7. Schemas Zod tolerantes para PublicTableDto, PanelStateDto e payloads de eventos: em divergência, registrar em desenvolvimento e continuar, sem quebrar a tela.
8. Função downloadAuthenticated(url, filename) que baixa por blob com Authorization.

**Aceite:** typecheck verde; ADR de divergências escrito; nenhuma chamada HTTP fora de shared/api.

### F04 — Autenticação e sessão

**Depende de:** F03

**Prompt:** Implemente login, sessão em memória, renovação e proteção de rotas conforme a Seção 2.5.

**Skills:** ritual na tela de login.

**Passos:**

1. Store de autenticação (Zustand): accessToken, user, status (loading, authenticated, anonymous) e dados de impersonação.
2. AuthProvider com o boot: POST /auth/refresh e depois GET /auth/me.
3. Página /login (React Hook Form + Zod): mensagens por código de erro, bloqueio de 15 min com explicação, 429 com contagem regressiva, mostrar ou ocultar senha, foco inicial no usuário.
4. AuthGate por perfil no cliente com redirecionamento (ADMIN para /admin, OWNER para /dashboard, WAITER para /panel). Pós-login só redireciona para caminhos internos conhecidos (?next= validado).
5. Logout (limpa memória, caches do TanStack Query e streams). Sessão expirada leva a /login?expired=true com aviso.
6. ImpersonationBar fixa (Seção 2.5) e a página raiz / com o redirecionamento por perfil e a compatibilidade /?m=TOKEN para /m/TOKEN.

**Validação manual:** login com ADMIN, OWNER e WAITER contra o back real; refresh automático; reuso de token exibe mensagem e desloga.

**Aceite:** nenhuma rota protegida abre sem sessão; token nunca aparece em storage ou log.

### F05 — App shell, navegação e estados globais

**Depende de:** F02, F04

**Prompt:** Crie as estruturas de layout e os estados globais usados por todas as telas autenticadas.

**Skills:** ritual no shell do dashboard.

**Passos:**

1. Layout do dashboard: sidebar recolhível no desktop e navegação inferior ou drawer no mobile, com os itens Resumo, Mesas, Equipe e Configurações. Layout do admin e layout mínimo do painel (sem chrome).
2. Cabeçalho com o nome do restaurante e menu do usuário (perfil, tema, sair).
3. Toasts globais, error.tsx por grupo de rotas, not-found, loading.tsx com esqueleto, OfflineBanner e alternância de tema.
4. Arquivo de mensagens pt-BR com os textos base.

**Responsividade:** navegação inferior no celular, sidebar em ícones no tablet e sidebar completa no desktop (Seção 2.11). O cabeçalho não quebra em 320 px, áreas fixas respeitam safe areas e nenhuma página tem rolagem horizontal.

**Aceite:** navegação entre as páginas vazias funciona por perfil; ADMIN sem impersonação é direcionado ao /admin ao tentar abrir /dashboard.

### Fase 1 — Tela da mesa (cliente)

### F06 — Tela da mesa: carga, tema e estados

**Depende de:** F02, F03

**Prompt:** Implemente /m/\[token\], a tela mais vista do produto, com carga, tema dinâmico e estados.

**Skills:** ritual completo (taste-skill e awesome-design antes; web-design-guidelines e impeccable ao final).

**Passos:**

1. features/table-screen com useTableQuery(token) (GET /public/tables/:token), sincronizando o relógio com serverNow.
2. Estados Carregando, QR inválido (404) e Indisponível (Seção 2.7).
3. Componente apresentacional TableScreen (recebe props; será reaproveitado na pré-via da F17): logo, nome, descrição, título de boas-vindas (texts.welcomeTitle com o número da mesa), fundo (cor sólida ou imagem com película), links de redes sociais e Wi-Fi (nome e botão Copiar senha), ConnectionIndicator.
4. ThemeProvider por restaurante com proteção de contraste (Seção 2.9).
5. metadata com o nome do restaurante, noindex e theme-color. Referrer-Policy no-referrer.
6. Desempenho: shell leve, fonte otimizada, imagens com dimensões, JavaScript mínimo. Medir o FCP em 4G simulado.

**Responsividade:** a tela da mesa funciona de 320 a 430 px em retrato e em paisagem, e continua centrada e legível em tablet e desktop (coluna com largura máxima). Use dvh em vez de 100vh, safe areas, viewport sem bloqueio de zoom e campos com no mínimo 16 px. O campo de observação nunca fica atrás do teclado.

**Aceite:** abre pelo QR real; três temas de exemplo (claro, escuro, com imagem) legíveis; 404 e mesa pausada tratadas; FCP dentro da meta.

### F07 — Chamados do cliente

**Depende de:** F06

**Prompt:** Implemente a abertura, o acompanhamento e o cancelamento de chamados.

**Skills:** emil-kowalski (feedback de toque e transições de estado), web-design-guidelines, impeccable.

**Passos:**

1. Botões grandes (64 px ou mais) Chamar garçom e Pedir a conta, com os textos de texts.waiterButton e texts.billButton. Campo de observação opcional com contador de caracteres no limite aceito pelo back.
2. POST /public/tables/:token/calls com interface otimista. Tratar 201 e 200 com alreadyPending (mostrar o chamado existente, sem erro).
3. Estados por tipo (Livre e Pendente, Seção 2.7): horário do pedido, cronômetro quando showWaitTimeToCustomer for verdadeiro, selo de reaberto, ação Cancelar chamado com confirmação leve.
4. Vibração leve (navigator.vibrate quando existir) ao confirmar ações (RF-C08).
5. Erros: mesa pausada, 429, rede. Manter o botão disponível para tentar de novo. Bloquear duplo toque durante o envio.

**Aceite:** WAITER e BILL coexistem pendentes; segundo toque não duplica; cancelar volta ao estado livre.

### F08 — Tempo real da mesa, confirmação e contestação

**Depende de:** F07

**Prompt:** Conecte a tela da mesa ao SSE e implemente o fluxo de confirmação do atendimento.

**Skills:** emil-kowalski (transição Atendido para Confirmado), web-design-guidelines, impeccable.

**Passos:**

1. Hook useTableStream(token): EventSource em /public/tables/:token/stream, backoff exponencial de 1 s a 30 s, reconciliação (GET de estado) ao reconectar, ao voltar para a aba e ao recuperar rede. Os eventos são gatilhos: aplicar o patch local e refazer o GET.
2. TABLE\_DELETED leva ao estado QR inválido; TABLE\_PAUSED e TABLE\_RESUMED atualizam a disponibilidade.
3. Estado Atendido: pergunta Tudo certo? com três carinhas (rating 1 a 3, POST .../confirm), botão Garçom não veio (POST .../contest) e contagem regressiva até confirmationDeadline. Se o back aceitar confirmação sem nota, oferecer também a confirmação simples.
4. Estado Confirmado: agradecimento breve e vibração. Estados encerrados (CLOSED\_UNCONFIRMED, CANCELLED, EXPIRED) voltam a Livre, com aviso gentil no EXPIRED.
5. Com contested = true, esconder a ação Garçom não veio. Tratar erro INVALID\_RATING e demais 400.

**Aceite:** fluxo completo chamar, painel atender, cliente confirmar e contestar funcionando com o painel real; reconexão após derrubar a rede.

### Fase 2 — Painel da equipe

### F09 — Painel: conexão, estado e ações

**Depende de:** F03, F04

**Prompt:** Implemente a camada de dados do painel (sem a interface final), seguindo FRONTEND\_INTEGRATION.md seção 2.2 e a Seção 2.8.

**Passos:**

1. panelStore (Zustand): calls, recent, thresholds (alertSec e urgentSec), contadores, status da conexão e quem assumiu cada chamado.
2. usePanelStream: pedir ticket novo a cada conexão, abrir o EventSource, aplicar snapshot e eventos (tabela da Seção 2.8), backoff, polling de GET /panel/state a cada 10 s quando o SSE estiver caído, resincronização em visibilitychange e online.
3. Mesclar eventos parciais e refazer GET /panel/calls com debounce quando faltarem campos.
4. Ações assume e attend com interface otimista e rollback em erro. As respostas alreadyAcknowledged e alreadyAttended não são erro.
5. Gaveta de recentes: GET /panel/calls/recent?limit=15.
6. Acesso para WAITER, OWNER e ADMIN (com impersonação). Renderização mínima de depuração apenas para validar.

**Aceite:** chamado criado pela tela da mesa aparece no store em menos de 2 s; queda e retorno do SSE reconstroem o estado pelo snapshot.

### F10 — Painel: interface de operação

**Depende de:** F02, F09

**Prompt:** Construa a interface do painel da equipe sobre o store da F09. Ela será lida a distância, em TV, tablet e celular.

**Skills:** ritual completo (taste-skill e awesome-design antes; emil-kowalski nas animações; web-design-guidelines e impeccable ao final).

**Passos:**

1. Grade responsiva de cards do mais antigo ao mais recente. Cada card: número da mesa em destaque, tipo (ícone e texto; Conta com destaque visual), observação, cronômetro mm:ss (useNow), nível Normal, Alerta ou Urgente (cor, ícone e texto, nunca só cor), selo Reaberto quando reopenCount for maior que 0 e quem assumiu.
2. Botões grandes **Assumir** e **Atendido** por card, com feedback imediato e proteção contra toque duplo.
3. Cabeçalho: nome do restaurante, relógio, contadores (total, garçom, conta), ConnectionIndicator e atalhos de som, tela cheia e gaveta.
4. Gaveta de recentes com status de confirmação (aguardando, confirmado com nota, encerrado sem confirmação).
5. Estado vazio positivo (Tudo em dia), erro e desconectado.
6. Layouts: TV (4 colunas ou mais, tipografia grande), tablet e celular (lista única). Animações de entrada, mudança de nível e saída; aria-live polite para novos chamados; reduced motion.

**Responsividade:** o painel é a superfície mais exigente. Celular: lista única de cards com botões de largura total. Tablet: 2 colunas em retrato e 3 em paisagem. Desktop e TV: 3 a 4 colunas ou mais, com tipografia fluida (clamp) legível a 3 metros em 1920 e 3840 px e margem de segurança de 2% a 3% nas bordas (overscan). A gaveta de recentes vira bottom sheet no celular e painel lateral a partir do tablet.

**Aceite:** legível a 3 metros em TV; nível muda nos limites configurados; fluxo assumir e atender funciona contra o back real.

### F11 — Painel: modo operação (tela cheia, áudio, voz, PWA)

**Depende de:** F10

**Prompt:** Torne o painel confiável para ficar ligado o dia todo (RF-D14, RF-D18).

**Skills:** emil-kowalski (feedback sonoro e visual), web-design-guidelines.

**Passos:**

1. Tela inicial **Iniciar painel** (exige gesto do usuário). Ao tocar: liberar o áudio do navegador, entrar em tela cheia (Fullscreen API), manter a tela ligada (Wake Lock, readquirindo ao voltar à aba) e abrir o painel.
2. Sons distintos para Garçom, Conta e Urgente (arquivos curtos em public/sounds ou gerados com Web Audio). Alarme de urgente repetido em intervalo configurável enquanto houver chamado urgente. Controle de volume e mudo, com preferência salva (apenas preferência, nunca dado sensível).
3. Voz em pt-BR com speechSynthesis (exemplo: Mesa 5 chama o garçom). Fila para não sobrepor falas; se não houver suporte, seguir só com o som.
4. PWA: manifest (nome, ícones, display standalone ou fullscreen), service worker apenas para o shell e os assets. **Nunca** cachear respostas da API nem /m/\*. Convite para instalar.
5. Se a conexão cair ou a aba for suspensa, mostrar faixa persistente (Painel desconectado, chamados podem não aparecer) e tentar restabelecer.

**Validação manual:** tablet Android, iPad Safari e navegador de TV.

**Aceite:** painel segue ativo por horas sem a tela apagar; som e voz disparam em chamado novo; instalável.

### Fase 3 — Dashboard do dono

### F12 — Mesas: gestão, QR e lote

**Depende de:** F05

**Prompt:** Implemente /dashboard/tables.

**Skills:** ritual completo.

**Passos:**

1. Lista de mesas (número, status ativa ou pausada, link) com busca por número.
2. Criar em lote: diálogo com startNumber preenchido por GET /tables/next-number e count de 1 a 50 (usar o nome de campo que o openapi.json exigir). Tratar o 409 listando os números duplicados.
3. Pausar e retomar (PATCH) com atualização otimista. Excluir com ConfirmDialog explicando que o QR deixa de funcionar e os chamados pendentes são removidos.
4. Ver QR: modal com o SVG como imagem data URI, botão Copiar link e Baixar SVG (downloadAuthenticated em /tables/:id/qr?format=svg).
5. Estado vazio com a ação Criar as primeiras mesas.

**Responsividade:** no celular, a lista de mesas vira cards e o diálogo de criação em lote vira bottom sheet; a partir do tablet, tabela. Ações secundárias entram em um menu de três pontos em telas estreitas.

**Aceite:** RF-D02 a D05 e D23 cobertos; QR abre /m/TOKEN no celular.

### F13 — Impressão de QR Codes

**Depende de:** F12

**Prompt:** Implemente /dashboard/tables/print para imprimir os QR Codes em A4 (RF-D06, RNF-20).

**Skills:** taste-skill (peça impressa), impeccable.

**Passos:**

1. Consumir GET /tables/print. Seleção de mesas (todas por padrão).
2. Grade A4 com logo, nome do restaurante, Mesa N, instrução curta (Aponte a câmera e chame o garçom) e QR como imagem data URI, em preto sobre branco e com tamanho mínimo confortável para leitura. Cor primária do restaurante apenas em detalhes.
3. Botão Imprimir (window.print) e CSS @media print: esconde o shell, define @page A4, evita quebra de página no meio de um cartão.
4. Pré-via na tela idêntica à impressão.

**Aceite:** impressão em PDF sai com todos os cartões; QR lido a 30 cm por dois celulares diferentes.

### F14 — Resumo do Dia

**Depende de:** F05

**Prompt:** Implemente /dashboard/analytics, a tela de maior valor para o dono (RF-R01 a R10, R14 a R16).

**Skills:** ritual completo.

**Passos:**

1. Filtro de período: Hoje, Ontem, 7 dias, 30 dias e personalizado, com from e to em YYYY-MM-DD no fuso do restaurante. Hoje significa o **dia operacional atual** (usar timezone e dayCutoffHour de /settings/service).
2. KPIs (StatCards): total (garçom e conta), concluídos, cancelados, expirados, % dentro da meta, tempo médio, mediana, P90 e P95 em mm:ss, satisfação média e quantidade de avaliados. Destacar o que estiver fora da meta (responseGoalSec).
3. Comparativo (GET /analytics/summary/compare): variação contra ontem e contra o mesmo dia da semana anterior, no formato real do openapi.json.
4. Gráfico por hora (Recharts): volume e espera média, com tabela alternativa acessível.
5. Ranking de mesas: maior volume e maior espera.
6. Tabela de chamados com paginação por cursor, filtros de tipo, status e mesa, linha do tempo (criado, atendido, confirmado) e nota.
7. Exportar CSV com downloadAuthenticated.
8. Atualizar a cada 30 s quando o período inclui hoje. Estados: sem dados (mensagem orientadora), erro e esqueleto.
9. A API ainda não devolve taxa de confirmação nem total de reabertos no resumo: não inventar. Registrar a solicitação no ADR para o back.

**Responsividade:** no celular, StatCards em 1 a 2 colunas, tabela de chamados em lista de cards (3 dados principais, detalhes em drawer) e filtros em uma folha recolhível. O gráfico por hora usa tooltip por toque e só rola dentro do próprio contêiner se necessário, sempre com a tabela alternativa. Tablet e desktop seguem os padrões da Seção 2.11.

**Aceite:** números conferem com o CSV exportado; período de 30 dias carrega em até 2 s.

### F15 — Equipe

**Depende de:** F05

**Prompt:** Implemente /dashboard/team.

**Skills:** ritual completo.

**Passos:**

1. Lista (usuário, papel, ativo, criado em).
2. Novo membro (username, papel WAITER ou OWNER, senha opcional) exibindo a senha temporária em OneTimeSecretDialog. Tratar USERNAME\_ALREADY\_EXISTS.
3. Ativar ou bloquear (PATCH status) e remover (ConfirmDialog). Desabilitar, com explicação, as ações sobre o próprio usuário.
4. Resetar senha com confirmação e OneTimeSecretDialog.
5. Desempenho por garçom (GET /restaurant/users/metrics): total atendido, tempo médio de reação, de execução e avaliação média, com ordenação. Incluir nota de uso responsável das métricas individuais.

**Responsividade:** membros em cards no celular, com ações em menu; métricas por garçom em cards no celular e tabela a partir do tablet.

**Aceite:** senha temporária nunca persiste após fechar o diálogo; garçom bloqueado perde o acesso no próximo login.

### F16 — Configurações: atendimento

**Depende de:** F05

**Prompt:** Implemente /dashboard/settings com abas (Atendimento, Aparência, Notificações) e a aba Atendimento. A aba ativa fica na URL (?tab=).

**Skills:** ritual.

**Passos:**

1. Formulário (React Hook Form + Zod) para GET e PUT /settings/service: responseGoalSec, alertSec, urgentSec, confirmationWindowSec, timezone, dayCutoffHour e showWaitTimeToCustomer.
2. Validações espelhando o back: alertSec menor que urgentSec; janela de confirmação entre 30 e 900 s; dayCutoffHour de 0 a 11; fuso IANA válido (campo com busca, padrão America/Sao\_Paulo).
3. Ajuda contextual em cada campo, com exemplo do dia operacional (02:30 pertence ao dia anterior quando o corte é 05:00). Valores exibidos em minutos e segundos.
4. Salvar e Descartar com estado de alterações pendentes. Aviso de que o novo limite vale para o painel a partir do próximo carregamento.

**Aceite:** valores inválidos não são enviados; salvar reflete no painel.

### F17 — Configurações: aparência com pré-via ao vivo

**Depende de:** F08, F16

**Prompt:** Implemente a aba Aparência (RF-D07 a D12) com pré-via ao vivo da tela do cliente.

**Skills:** taste-skill, impeccable, web-design-guidelines, emil-kowalski.

**Passos:**

1. Formulário: identidade (nome e descrição), cores (primary, secondary, background, text) com campo de cor e aviso de contraste, textos (welcomeTitle, waiterButton, billButton), fundo (cor sólida, imagem ou preset) e redes sociais (instagram, wifiName, wifiPassword). Links sem protocolo recebem https:// (RF-D12) e só http, https ou handle são aceitos.
2. Upload de logo e de fundo (POST multipart, campo file): aceitar png, jpg e webp (não oferecer SVG), validar o tamanho contra o limite do back (documentado como 10 MB), mostrar pré-visualização, progresso e erros.
3. Restaurar padrão com ConfirmDialog (POST /settings/appearance/reset).
4. **Pré-via ao vivo:** mockup de celular ao lado renderizando o TableScreen da F06 com os valores do formulário, alternando entre Livre, Pendente e Atendido.
5. Nada vai para o cliente antes de Salvar (RN-06): usar PUT apenas no Salvar, com Descartar e alerta de alterações não salvas ao sair.

**Responsividade:** no celular, formulário e pré-via ficam em abas (Editar e Pré-via), com botão Salvar fixo no rodapé respeitando a safe area; a partir do tablet, lado a lado.

**Aceite:** a pré-via é idêntica à tela real; cores de baixo contraste geram aviso; restaurar volta ao padrão.

### F18 — Configurações: notificações

**Depende de:** F16

**Prompt:** Implemente a aba Notificações.

**Skills:** ritual.

**Passos:**

1. GET e PATCH /restaurant/notifications/settings: resumo diário por e-mail (liga e destinatário), alerta de urgência (liga e destinatário) e cooldown em minutos. Validação de e-mail e campos habilitados conforme as chaves.
2. Botão Enviar resumo de teste (POST /restaurant/notifications/send-daily-summary) com feedback de sucesso ou erro.
3. Após salvar, refazer o GET e refletir o estado real devolvido pelo back. Registrar no ADR o achado da auditoria do back: as preferências estão em memória e podem voltar ao padrão após reinício até a persistência ser implementada.

**Aceite:** alternar chaves e salvar reflete o estado retornado; teste de envio dá feedback claro.

### Fase 4 — Admin

### F19 — Portal administrativo e auditoria

**Depende de:** F05

**Prompt:** Implemente /admin e /admin/audit.

**Skills:** ritual completo.

**Passos:**

1. Tabela de restaurantes (nome, status, mesas, usuários, criado em) com paginação por cursor.
2. Cadastrar restaurante (name e ownerUsername) e exibir usuário e senha temporária em OneTimeSecretDialog.
3. Suspender e reativar com ConfirmDialog que explica os efeitos. Resetar senha do owner (OneTimeSecretDialog).
4. Impersonar (POST .../impersonate): guardar o token separado em memória, abrir /dashboard e exibir a ImpersonationBar. Tratar CANNOT\_IMPERSONATE\_SUSPENDED\_RESTAURANT.
5. Excluir restaurante: diálogo que exige digitar o nome exato e envia confirmName, deixando claro que é irreversível.
6. /admin/audit: tabela paginada com filtros (restaurantId, action, actorUserId), destaque para IMPERSONATED\_ACTION e detalhes em drawer com o meta exibido como texto escapado.

**Responsividade:** as tabelas de restaurantes e de auditoria viram listas de cards no celular, com ações em menu e detalhes em drawer. Diálogos sensíveis (excluir restaurante, credenciais) ocupam a tela cheia no celular.

**Aceite:** todas as ações do back para o admin cobertas; credenciais nunca persistem; impersonação auditada visível no log.

### Fase 5 — Qualidade e release

### F20 — Auditoria de acessibilidade e UX

**Depende de:** F19

**Prompt:** Audite todas as telas e corrija.

**Skills:** web-design-guidelines (principal) e impeccable.

**Passos:** percorra todos os fluxos com um checklist: responsividade em toda a matriz de viewports da Seção 2.11 (sem rolagem horizontal, sem texto cortado, safe areas e teclado aberto), teclado completo, foco visível e ordem lógica, rótulos e ARIA, aria-live em novos chamados e erros, contraste AA nos temas claro, escuro e nos temas de restaurantes, zoom de 200%, alvos de toque, prefers-reduced-motion, leitores de tela (VoiceOver, TalkBack ou NVDA) nos fluxos da mesa e do painel, erros de formulário ligados aos campos, nenhuma informação só por cor. Corrija tudo e registre antes e depois em docs/design/a11y-report.md.

**Aceite:** sem achado crítico ou alto aberto; Lighthouse de acessibilidade ≥ 95 nas telas principais.

### F21 — Movimento e polimento final

**Depende de:** F20

**Prompt:** Faça a passada final de movimento e acabamento em todas as superfícies.

**Skills:** emil-kowalski (principal), impeccable e taste-skill.

**Passos:** revise transições de cards, diálogos, drawers, abas e troca de carregamento para conteúdo; feedback de toque nos botões do cliente e do painel; esqueletos coerentes; microcopy em pt-BR; ritmo, alinhamento e consistência de tokens. Remova animações sem propósito, evite animar propriedades que forçam layout, mantenha 60 fps e reduced motion. Registre antes e depois no review-log.

**Aceite:** nenhuma tela com acabamento destoante; reduced motion testado.

### F22 — Desempenho, segurança e PWA

**Depende de:** F21

**Prompt:** Feche as metas da Seção 4.4 e revise a segurança.

**Passos:**

1. Medir /m/\[token\] com Lighthouse mobile em 4G: FCP ≤ 2 s. Reduzir JavaScript (divisão de código, imports dinâmicos), otimizar imagens e fontes.
2. Analisar o bundle e definir orçamento por rota.
3. Revisar a CSP final (evitar unsafe-inline, usar nonce quando possível) e os demais headers. Buscar no código: dangerouslySetInnerHTML, token em storage e console.log. Rodar npm audit.
4. Validar a instalabilidade do painel e confirmar que o service worker não cacheia API nem /m/\*.
5. Revisar o tratamento de 429 e erros em todos os fluxos.
6. Documentar os resultados em docs/perf/front.md.

**Aceite:** metas atingidas; nenhum achado de segurança aberto.

### F23 — Smoke E2E e QA contra o back real

**Depende de:** F22

**Prompt:** Valide a jornada completa com o back real.

**Passos:**

1. Suba o back (docker compose do back) e o front.
2. Playwright com **um** teste narrativo (smoke): ADMIN cria restaurante e copia as credenciais; OWNER faz login e cria mesas; abre /m/\[token\] em viewport mobile e chama o garçom; o painel (outro contexto) recebe; o WAITER assume e atende; o cliente confirma com nota 3; em outro chamado, o cliente contesta; o Resumo do Dia mostra os números esperados.
3. Checklist manual em docs/qa/checklist.md: perfis por telas, queda e retorno de rede, tema escuro, temas de restaurante, impressão, iOS Safari, Android Chrome e TV.
4. Corrija os bugs encontrados.

**Responsividade:** rode o smoke em três projetos do Playwright (celular 390×844, tablet 768×1024 e desktop 1440×900) e inclua uma verificação automática de ausência de rolagem horizontal (scrollWidth menor ou igual a clientWidth) nas rotas principais. Complete o checklist manual com a matriz de viewports da Seção 2.11 (de 320×568 a 3840×2160), retrato e paisagem, teclado aberto e dispositivos reais.

**Aceite:** smoke verde; checklist 100% marcado.

### F24 — Docker e CI

**Depende de:** F23

**Prompt:** Containerize e automatize.

**Passos:** valide o Dockerfile (5.3) e o compose (5.4): imagem de produção rodando como usuário node, build standalone, healthcheck. GitHub Actions ci.yml com instalação, lint, typecheck, boundaries, build, npm audit (nível alto), gitleaks e Trivy na imagem; workflow manual opcional para o smoke com o back via compose; release.yml que publica a imagem ao criar a tag; Renovate ou Dependabot; documente as regras de proteção da main.

**Aceite:** pipeline verde em um PR de teste; imagem sobe e responde.

### F25 — Release e documentação

**Depende de:** F24

**Prompt:** Prepare o release v1.0.0.

**Passos:** README final (arquitetura, comandos, variáveis, solução de problemas: CORS, cookie SameSite e Secure, X-Server-Now, URL do QR); docs/runbook-front.md (deploy, variáveis NEXT\_PUBLIC definidas no build, rollback, integração com o back); CHANGELOG; docs/PROGRESS.md 100%; execute e anexe o checklist da Seção 8; crie a tag v1.0.0.

**Aceite:** checklist de go-live 100%.

## 8. Checklist final de aceite (go-live)

**Funcional**

- Jornada completa (ADMIN, OWNER, WAITER e cliente) funcionando contra o back real (F23).
- Painel recebe chamado em até 2 s, mantém o cronômetro correto após recarregar e se reconecta sozinho.
- Resumo do Dia confere com o CSV exportado.
- Todas as ações do back para cada perfil têm tela correspondente.

**Segurança**

- Token somente em memória; nenhum dado sensível em storage, URL ou log.
- Credenciais temporárias exibidas uma única vez.
- CSP, headers e Referrer-Policy conferidos; nenhum dangerouslySetInnerHTML.
- npm audit, gitleaks e Trivy sem achados altos ou críticos.

**Design e acessibilidade**

- Ritual de skills registrado para todas as telas, sem achado crítico aberto.
- WCAG 2.1 AA verificada; reduced motion respeitado; temas dos restaurantes legíveis; responsividade validada de 320 a 3840 px sem rolagem horizontal.

**Desempenho e operação**

- FCP de /m/\[token\] ≤ 2 s em 4G; Lighthouse mobile ≥ 90.
- Painel instalável, tela ligada e áudio funcionando em tablet e TV.
- Imagem Docker, CI e runbook prontos; tag v1.0.0 criada.

## 9. Pendências e pontos a confirmar no back

Quando o agente encontrar um destes pontos, adota o padrão abaixo, registra um ADR curto e avisa o responsável. Nenhum deles exige alterar o back para começar.

| Ponto | Padrão adotado | Ação |
| --- | --- | --- |
| Limite da observação: 140 (API\_REFERENCE) ou 150 (requisitos) | Usar o valor do openapi.json; na dúvida, 140 | Alinhar com o back |
| Limite de upload: 10 MB (back) contra 2 MB (plano do back) | Aceitar até o limite do back; oferecer só png, jpg e webp | Sugerir ao back reduzir e validar tipo |
| Rota /restaurant/current citada na documentação de permissões | Usar /auth/me e /settings/service | Verificar no openapi.json |
| Formato de /analytics/summary/compare não documentado | Ler openapi.json e endpoint-inventory.json | Documentar no ADR |
| Taxa de confirmação e reabertos fora do resumo | Não exibir | Solicitar ao back |
| Evento CALL\_REOPENED listado nos tipos mas não nas listas de SSE | Tratar se vier; senão reconciliar por GET | Confirmar com o back |
| Header X-Server-Now exposto por CORS | Usar serverNow do corpo como fonte principal | Confirmar com o back |
| Preferências de notificação em memória no back (achado médio da auditoria) | Tela funciona e reflete o estado devolvido | Back deve persistir (fase 7 do back) |
| Rotas acknowledge e assume equivalentes | Usar /assume | — |
| Impersonação some ao recarregar | Aceito (o cookie é do admin) | — |
| Métricas individuais por garçom | Visíveis só ao OWNER, com nota de uso responsável | \[A VALIDAR\] política |
| Recuperação de senha, push, idiomas EN/ES e cobrança | Fora do escopo | Fases futuras |
| Skills de design ausentes no ambiente | Avisar e seguir os princípios do plano | Instalar e repetir o ritual |
