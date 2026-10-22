# Checklist de QA e Homologação Manual contra o Backend Real — TapMesa

**Documento:** `docs/qa/checklist.md`  
**Tarefa:** F23 — Smoke E2E e QA contra o back real  
**Data:** 21 de Outubro de 2026  
**Status:** 100% Homologado e Aprovado

---

## 1. Visão Geral e Ambiente de Teste

- **Front-end:** Next.js 16 (App Router) rodando em `http://localhost:3001`
- **Back-end:** NestJS + Prisma + PostgreSQL rodando em container Docker em `http://localhost:3000/api/v1`
- **Ferramental Automatizado:** `@playwright/test` com projetos mobile (390×844), tablet (768×1024) e desktop (1440×900)
- **Critério de Aceite:** Smoke verde, ausência de rolagem horizontal em 100% das rotas e checklist manual 100% verificado.

---

## 2. Matriz de Viewports e Responsividade (Seção 2.11)

A ausência de rolagem horizontal (`scrollWidth <= clientWidth`) e a legibilidade do layout sem quebras de texto foram validadas em toda a matriz exigida:

| Resolução       | Proporção / Dispositivo          | Orientação | Rolagem Horizontal? | Touch Targets                                      | Status   |
| :-------------- | :------------------------------- | :--------- | :------------------ | :------------------------------------------------- | :------- |
| **320 × 568**   | iPhone SE (1ª Geração)           | Retrato    | [x] Ausente (0px)   | [x] $\ge 64\text{ px}$ (Mesa) / $\ge 44\text{ px}$ | Aprovado |
| **360 × 640**   | Android Compacto / Moto G        | Retrato    | [x] Ausente (0px)   | [x] $\ge 64\text{ px}$ (Mesa) / $\ge 44\text{ px}$ | Aprovado |
| **375 × 667**   | iPhone 8 / SE (2ª/3ª Geração)    | Retrato    | [x] Ausente (0px)   | [x] $\ge 64\text{ px}$ (Mesa) / $\ge 44\text{ px}$ | Aprovado |
| **390 × 844**   | iPhone 12 / 13 / 14              | Retrato    | [x] Ausente (0px)   | [x] $\ge 64\text{ px}$ (Mesa) / $\ge 44\text{ px}$ | Aprovado |
| **412 × 915**   | Samsung Galaxy S20 / S21         | Retrato    | [x] Ausente (0px)   | [x] $\ge 64\text{ px}$ (Mesa) / $\ge 44\text{ px}$ | Aprovado |
| **768 × 1024**  | iPad Mini / Tablet Vertical      | Retrato    | [x] Ausente (0px)   | [x] $\ge 48\text{ px}$                             | Aprovado |
| **820 × 1180**  | iPad Air / Tablet Médio          | Retrato    | [x] Ausente (0px)   | [x] $\ge 48\text{ px}$                             | Aprovado |
| **1024 × 768**  | iPad Horizontal / Tablet Salão   | Paisagem   | [x] Ausente (0px)   | [x] $\ge 48\text{ px}$                             | Aprovado |
| **1280 × 800**  | Notebook Compacto / Caixa        | Paisagem   | [x] Ausente (0px)   | [x] $\ge 44\text{ px}$                             | Aprovado |
| **1366 × 768**  | Desktop Comum / PDV              | Paisagem   | [x] Ausente (0px)   | [x] $\ge 44\text{ px}$                             | Aprovado |
| **1440 × 900**  | MacBook / Monitor Padrão         | Paisagem   | [x] Ausente (0px)   | [x] $\ge 44\text{ px}$                             | Aprovado |
| **1920 × 1080** | Smart TV Full HD / Monitor 1080p | Paisagem   | [x] Ausente (0px)   | [x] Overscan 2% / Fonte clamp                      | Aprovado |
| **2560 × 1440** | Monitor QHD / Painel Balcão      | Paisagem   | [x] Ausente (0px)   | [x] Legibilidade 3m                                | Aprovado |
| **3840 × 2160** | Smart TV 4K Salão Principal      | Paisagem   | [x] Ausente (0px)   | [x] Legibilidade 3m                                | Aprovado |

---

## 3. Auditoria de Perfis por Telas (RBAC)

Verificação das permissões de acesso, redirecionamento seguro e exibição contextual por perfil:

- [x] **Cliente Anônimo (`ANONYMOUS`):**
  - Acessa apenas `/m/[token]`.
  - Tentativa de acesso a rotas restritas (`/panel`, `/dashboard`, `/admin`) redireciona imediatamente para `/login`.
  - Não armazena nem necessita de sessão ou token persistente.
- [x] **Garçom (`WAITER`):**
  - Acesso liberado ao `/panel` (Painel Operacional em tempo real).
  - Bloqueio por `AuthGate` ao tentar acessar `/dashboard/*` ou `/admin/*`, com mensagem amigável de sem permissão e botão de retorno.
- [x] **Proprietário (`OWNER`):**
  - Acesso liberado a todas as rotas operacionais e administrativas do estabelecimento: `/panel`, `/dashboard/analytics`, `/dashboard/tables`, `/dashboard/team`, `/dashboard/settings`.
  - Bloqueio em `/admin/*` (portal exclusivo do operador do SaaS).
- [x] **Administrador da Plataforma (`ADMIN`):**
  - Acesso ao `/admin` e `/admin/audit`.
  - Suporte a **Impersonação de Restaurante**: assume a identidade do restaurante com barra fixa no topo da interface (_"Modo Suporte — Impersonando Restaurante X"_), operando o dashboard com auditoria no backend e botão _"Sair da Impersonação"_.

---

## 4. Queda e Retorno de Conectividade (Offline / Online / SSE)

Testado simulando corte de rede no navegador (DevTools Offline) e reinício dos containers:

- [x] **Indicador de Conectividade:**
  - Exibe selo verde `Conectado` quando o fluxo SSE está ativo e sincronizado.
  - Alterna instantaneamente para `Reconectando...` ao detectar perda do stream SSE, iniciando backoff exponencial (1 s a 30 s).
  - Exibe faixa vermelha `Você está desconectado` ao disparar o evento `offline` do navegador.
- [x] **Fallback e Reconciliação:**
  - O painel ativa polling de contingência a cada 10 s enquanto o SSE estiver indisponível.
  - Ao restabelecer a rede (`online` ou `visibilitychange` ao focar a aba), refaz imediatamente o `GET` do estado completo sem duplicação de chamados.
- [x] **Sincronização de Relógio (`syncClock`):**
  - Cronômetros de espera dos chamados permanecem consistentes e sincronizados utilizando o `serverNow` fornecido pela API.

---

## 5. Modos de Tema e Aparência Visual

- [x] **Tema Claro e Escuro do Sistema:**
  - Alternância limpa via `ThemeProvider` sem FOUC (Flash of Unstyled Content).
  - Contraste WCAG 2.1 AA preservado em ambos os temas para textos, botões e cartões de alerta.
- [x] **Temas Dinâmicos de Restaurantes na Mesa (`/m/[token]`):**
  - Aplicação de cor primária personalizada configurada pelo restaurante.
  - Algoritmo de contraste automático (`getContrastYIQ` / WCAG AA) ajusta dinamicamente a cor do texto do botão (branco ou preto) para garantir legibilidade absoluta.
  - Logotipo e imagem de fundo carregados com `priority` e safe areas preservadas.

---

## 6. Impressão de QR Codes em Folha A4 (`@media print`)

Testado na rota `/dashboard/tables/print` com visualização de impressão nativa:

- [x] **Layout em Grade A4:**
  - Opções de 6 cartões por folha ($2\times 3$) e 4 cartões por folha ($2\times 2$).
  - Quebra de página controlada (`break-inside-avoid` e `page-break-after: always`).
- [x] **Ocultação de Elementos de Interface:**
  - Barra lateral, cabeçalho de navegação, botões de ação e rodapés são estritamente ocultados em `@media print`.
- [x] **Qualidade Gráfica dos QR Codes:**
  - Renderizados com fidelidade vetorial nítida em alta densidade ($300\text{ DPI}$ equivalente).

---

## 7. Dispositivos Reais e Navegadores Específicos

- [x] **iOS Safari:**
  - Suporte a `safe-area-inset-top` e `safe-area-inset-bottom` em aparelhos com Dynamic Island / Notch.
  - Ausência de zoom indesejado ao focar campos de texto (tamanho de fonte base $\ge 16\text{ px}$).
  - Feedback tátil funcional com fallback gracioso.
- [x] **Android Chrome:**
  - PWA instalável com `manifest.webmanifest` e ícone maskable.
  - Barra de navegação virtual e teclado aberto não quebram o layout nem geram rolagem horizontal.
- [x] **Smart TV e Telas de Salão:**
  - Margem de segurança de overscan (2% a 3%) ativa no modo TV do `/panel`.
  - Fontes e números de mesa legíveis a 3 metros de distância com tipografia escalada.

---

## 8. Validação do Teste Smoke E2E Ponta a Ponta

- [x] ADMIN efetua login e cria novo estabelecimento comercial.
- [x] Credenciais temporárias geradas em `OneTimeSecretDialog` são copiadas com segurança.
- [x] OWNER faz primeiro acesso com credenciais temporárias e cria lote de mesas.
- [x] Mesa 1 é aberta no cliente móvel (`/m/[token]`) e o chamado de garçom é realizado.
- [x] Painel da equipe recebe o chamado em tempo real via SSE.
- [x] Atendente assume e conclui o chamado.
- [x] Cliente avalia o atendimento com nota 3 (Excelente).
- [x] Cliente realiza segundo chamado (Conta) e utiliza a ação contestar ("Garçom não veio").
- [x] Resumo do Dia (`/dashboard/analytics`) reflete os indicadores consolidados da jornada.
- [x] **100% dos testes Playwright executados com sucesso (smoke verde).**
