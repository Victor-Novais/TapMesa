# TapMesa — Front-end Web (v1.0.0)

> SaaS multi-tenant para chamada de garçom e pedido de conta via QR Code em restaurantes.

[![CI - Quality, Security & Docker Build](https://github.com/Victor-Novais/tapmesa-web/actions/workflows/ci.yml/badge.svg)](https://github.com/Victor-Novais/tapmesa-web/actions/workflows/ci.yml)
[![Release & Container Publishing](https://github.com/Victor-Novais/tapmesa-web/actions/workflows/release.yml/badge.svg)](https://github.com/Victor-Novais/tapmesa-web/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-5.x_Strict-blue?logo=typescript)](https://www.typescriptlang.org/)

---

## 1. Visão Geral do Produto

O **TapMesa Web** atende a quatro perfis de operação em um único produto coeso e responsivo:

- **Cliente na Mesa (`/m/[token]`):** Acesso instantâneo sem login via leitura de QR Code. Interface mobile acolhedora com tema dinâmico e proteção de contraste WCAG 2.1 AA, chamada rápida de garçom, pedido de conta, observação opcional de até 140 caracteres, canal SSE em tempo real e confirmação de atendimento com avaliação em 3 emojis.
- **Equipe de Salão (`/panel`):** Painel operacional em tempo real concebido para Smart TVs (1080p e 4K) e tablets. Tipografia com escala clamp legível a 3 metros, 3 níveis semânticos de urgência, síntese de áudio nativa via Web Audio API, alertas de voz pt-BR, Screen Wake Lock para manter a tela sempre acesa e suporte a PWA instalável.
- **Dono do Restaurante (`/dashboard`):** Dashboard gerencial com Resumo do Dia (Analytics) respeitando o corte do dia operacional, gráficos por hora, ranking de mesas, exportação CSV, gestão de mesas e geração em lote, visualização e impressão A4 de QR Codes (`/dashboard/tables/print`), gestão de equipe e personalização completa de regras de atendimento e identidade visual.
- **Administrador Global (`/admin`):** Gestão multi-tenant de estabelecimentos, suspensão e exclusão segura, geração de senhas temporárias de 8 caracteres, personificação de inquilino para suporte com barra de contexto (`ImpersonationBar`) e trilha de auditoria completa em `/admin/audit`.

---

## 2. Arquitetura e Stack Tecnológica

- **Framework Principal:** [Next.js 16 (App Router)](https://nextjs.org/) com Turbopack e compilação `output: 'standalone'`.
- **Linguagem:** [TypeScript 5](https://www.typescriptlang.org/) com checagem estrita (`strict: true`, `noUncheckedIndexedAccess: true`).
- **Estilização & Design System:** [Tailwind CSS v4](https://tailwindcss.com/) + primitivos acessíveis [Radix UI](https://www.radix-ui.com/). Vitrine viva disponível em `/dev/ui`.
- **Gerenciamento de Estado de Servidor:** [TanStack Query v5](https://tanstack.com/query/latest) com mutações otimistas e revalidação inteligente.
- **Gerenciamento de Estado Global & Streams:** [Zustand v5](https://github.com/pmndrs/zustand) mantendo tokens exclusivamente em memória volátil (zero storage tokens).
- **Comunicação HTTP:** [Axios](https://axios-http.com/) com mutex in-memory de rotação dual-token e tratamento de erros RFC 7807 Problem Details.
- **Tempo Real:** Server-Sent Events (SSE) nativo com reconexão exponencial (1s a 30s) e contingência via polling automático.
- **Formulários & Validação:** [React Hook Form](https://react-hook-form.com/) + [Zod v4](https://zod.dev/).
- **Visualização de Dados:** [Recharts](https://recharts.org/) com alternativa textual acessível em tabelas.
- **Microinterações & Movimento:** [Motion](https://motion.dev/) acelerado por GPU seguindo as diretrizes Emil Kowalski.
- **PWA & Offline:** Service Worker isolado gerado em compilação, com exclusão rígida de cache para `/api/*` e `/m/*`.
- **Testes Ponta a Ponta:** [Playwright](https://playwright.dev/) com narrativa smoke executada contra o backend real.

---

## 3. Pré-requisitos

- **Node.js:** Versão 24.x LTS (conforme indicado no arquivo [`.nvmrc`](file:///.nvmrc))
- **npm:** Versão 11.x ou superior
- **Docker & Docker Compose:** Opcional, para execução em containers
- **Back-end TapMesa:** API NestJS rodando na porta 3000 (`http://localhost:3000`) com banco PostgreSQL

---

## 4. Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto a partir do [`.env.example`](file:///.env.example):

```bash
# URL base da API REST (acessível pelo navegador do usuário)
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# URL pública canônica da aplicação front-end (usada para gerar links de QR Code)
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Porta TCP do servidor Node.js
PORT=3001

# Desativa envio de telemetria do Next.js
NEXT_TELEMETRY_DISABLED=1
```

> [!NOTE]
> Para testar a leitura de QR Code usando um smartphone físico na mesma rede local, substitua `localhost` pelo IP local da sua máquina (ex: `http://192.168.1.50:3000/api/v1` e `http://192.168.1.50:3001`).

---

## 5. Comandos e Scripts Disponíveis

| Comando                    | Descrição                                                                                   |
| :------------------------- | :------------------------------------------------------------------------------------------ |
| `npm run dev`              | Inicia o servidor de desenvolvimento na porta 3001 com hot reload e build do Service Worker |
| `npm run build`            | Compila a aplicação para produção com bundle `standalone` e assets estáticos                |
| `npm run start`            | Inicia o servidor Node.js em modo de produção na porta 3001                                 |
| `npm run lint`             | Executa a verificação estática de código com o ESLint                                       |
| `npm run typecheck`        | Executa a checagem rigorosa de tipos TypeScript sem emissão (`tsc --noEmit`)                |
| `npm run check:boundaries` | Valida as regras de fronteiras arquiteturais e importações permitidas                       |
| `npm run verify`           | **Quality Gate:** Executa `lint`, `typecheck`, `check:boundaries` e `build`                 |
| `npm run test:e2e`         | Executa a suíte de testes Playwright E2E contra o ambiente real                             |
| `npm run format`           | Formata o código fonte com Prettier e organiza classes do Tailwind                          |

### 5.1 Variáveis dos testes E2E

Os testes rodam contra um back-end de **teste** (nunca produção) e criam restaurantes, mesas e chamados próprios.

| Variável              | Obrigatória | Padrão                         | Uso                                                                     |
| :-------------------- | :---------- | :----------------------------- | :---------------------------------------------------------------------- |
| `E2E_ADMIN_USERNAME`  | Não         | `admin`                        | Usuário do administrador da plataforma no back-end de teste             |
| `E2E_ADMIN_PASSWORD`  | Sim         | —                              | Senha desse administrador; sem ela a jornada `smoke.spec.ts` é ignorada |
| `NEXT_PUBLIC_API_URL` | Não         | `http://localhost:3000/api/v1` | API usada pelo `integration.spec.ts` para criar os dados de apoio       |

```bash
E2E_ADMIN_USERNAME=admin E2E_ADMIN_PASSWORD='<senha-de-teste>' npm run test:e2e
```

A linha de base atual da suíte (o que passa, o que falha e por quê) está em `docs/design/E2E_BASELINE.md`.

---

## 6. Execução com Docker

### 6.1 Produção Local via Docker Compose

```bash
# Sobe o container de produção em http://localhost:3001
docker compose up -d --build

# Visualiza logs da aplicação
docker compose logs -f web

# Encerra os containers
docker compose down
```

### 6.2 Desenvolvimento em Container

```bash
docker compose -f docker-compose.dev.yml up --build
```

---

## 7. Solução de Problemas (Troubleshooting)

### 7.1 Erros de CORS (`Access-Control-Allow-Origin`)

- **Sintoma:** O console do navegador exibe erro bloqueando requisições para a porta 3000.
- **Causa:** O backend não está com a origem do front-end (`http://localhost:3001`) liberada.
- **Solução:** No backend NestJS, garanta que a variável `CORS_ORIGIN` inclua `http://localhost:3001` e que a opção `credentials: true` esteja habilitada.

### 7.2 Cookies `SameSite` e `Secure` em Ambiente de Desenvolvimento

- **Sintoma:** Login funciona na tela, mas requisições subsequentes sofrem erro 401 e deslogam.
- **Causa:** O cookie de refresh foi emitido com a flag `Secure=true` em um ambiente HTTP puro (sem certificado SSL).
- **Solução:** No arquivo `.env` do backend, configure `COOKIE_SECURE=false` para testes locais em HTTP. Em produção (HTTPS), mantenha `COOKIE_SECURE=true` e `SameSite=None` (ou `SameSite=Lax`).

### 7.3 Sincronização de Relógio e Desvio de Tempo (`X-Server-Now`)

- **Sintoma:** Cronômetro da mesa ou do painel exibe tempo negativo ou com desvio em relação ao relógio local.
- **Causa:** Desvio entre o relógio da máquina do usuário e o relógio UTC do servidor backend.
- **Solução:** A camada de API do front-end sincroniza o deslocamento temporal automaticamente lendo o cabeçalho HTTP `X-Server-Now` e o campo `serverNow` retornado nos payloads da API (veja [ADR 0002](docs/adr/0002-api-layer-clock-sync.md)). Certifique-se de que o backend expõe o cabeçalho através de `Access-Control-Expose-Headers: X-Server-Now`.

### 7.4 URLs do QR Code Inacessíveis no Celular

- **Sintoma:** A câmera do smartphone lê o QR Code, mas o navegador não consegue abrir a página.
- **Causa:** `NEXT_PUBLIC_APP_URL` foi configurada como `localhost`, endereço que no smartphone referencia o próprio aparelho.
- **Solução:** Para testes em rede física local, altere `NEXT_PUBLIC_APP_URL` no `.env` para o IP da sua máquina na rede local (ex: `http://192.168.0.10:3001`) e reinicie o servidor com `npm run dev` ou reconstrua a imagem com `npm run build`.

---

## 8. Documentação Técnica Completa

- [Arquitetura, Design e Plano de Execução](docs/TapMesa%20Frontend%20-%20Arquitetura,%20Design%20e%20Plano%20de%20Execu%C3%A7%C3%A3o%20v1.0.md)
- [Runbook Operacional de Produção](docs/runbook-front.md)
- [Checklist de Go-Live v1.0.0](docs/qa/go-live-checklist.md)
- [Governança e Proteção de Branch](docs/qa/ci-branch-protection.md)
- [Contratos e Especificação da API](docs/api/README.md)
- [Registro de Decisões de Arquitetura (ADR)](docs/adr/)
- [Log de Revisão de Design e Acessibilidade](docs/design/review-log.md)
- [Acompanhamento de Tarefas (100% Concluído)](docs/PROGRESS.md)
- [Histórico de Mudanças (Changelog)](CHANGELOG.md)
