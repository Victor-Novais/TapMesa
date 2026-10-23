# Documentação Oficial de Integração Frontend — TapMesa Backend API

Bem-vindo à documentação técnica oficial de integração da **TapMesa API**. Este documento e seus módulos complementares foram construídos a partir de uma **auditoria profunda, sistemática e baseada em evidências** de 100% do código-fonte do backend, cobrindo da Fase 0 (Fundação) até a Fase 6 (V1/T26).

---

## 1. Visão Geral do Sistema

O **TapMesa** é um SaaS multi-tenant de **chamada de garçom e pedido de conta via QR Code físico nas mesas**.

- **Para o Cliente (Mesa):** Não exige download de aplicativo, cadastro nem login. O cliente escaneia o QR Code físico da mesa, visualiza a identidade visual do restaurante e pode solicitar atendimento (Garçom ou Conta) em um toque, acompanhando o status em tempo real via **Server-Sent Events (SSE)**.
- **Para a Equipe (Garçons/Atendentes):** Painel operacional em tempo real via SSE com alerta sonoro/visual, cronômetro de tempo de espera, sinalização de atraso (_Warning_ e _Urgent_), possibilidade de assumir chamados (_Assumir / Acknowledge_) e finalizar o atendimento.
- **Para o Dono/Gerente (Owner):** Gestão de mesas e impressão de QR Codes em lote, gestão da equipe e controle de acesso (RBAC), personalização de identidade visual e regras de atendimento, e o **Resumo do Dia** (métricas consolidadas de SLA, tempos médios, distribuição horária e exportação CSV).
- **Para o Administrador Geral (Admin):** Gestão central de restaurantes (criação, suspensão, reativação, reset de credenciais), impersonação segura auditada e auditoria global imutável.

---

## 2. Stack Tecnológica e Padrões Arquiteturais

| Componente                   | Tecnologia / Versão              | Detalhes no Código                                                     |
| :--------------------------- | :------------------------------- | :--------------------------------------------------------------------- |
| **Runtime**                  | Node.js `>= 24.0.0` (LTS)        | `package.json`, `.nvmrc`                                               |
| **Framework**                | NestJS `11.0.1`                  | Módulos desacoplados, Dependency Injection estrita                     |
| **Linguagem**                | TypeScript `5.7.3`               | `strict: true`, `noUncheckedIndexedAccess: true`                       |
| **Banco de Dados**           | PostgreSQL 17 + Prisma `6.19.3`  | Schema relacional com migrations imutáveis e índices parciais          |
| **Tempo Real**               | Server-Sent Events (SSE)         | Pub/Sub via `EventEmitter2` ou `ioredis` (escalável horizontalmente)   |
| **Segurança & Criptografia** | Argon2id + JWT + Helmet          | Tokens HMAC SHA-256 para mesas, cookies HttpOnly rotativos             |
| **Observabilidade**          | Pino Logger + Prometheus Metrics | `pino-http` com redação de segredos e métricas em `/metrics`           |
| **Arquitetura**              | DDD + Clean Architecture         | Domain puro (sem framework), Application, Infrastructure, Presentation |

---

## 3. Convenções Globais da API

### 3.1. Prefixos Globais e Ambientes

Todas as rotas de negócio da API estão sob o prefixo global `/api/v1` (configurado em [`src/platform/bootstrap/configure-app.ts`](../../src/platform/bootstrap/configure-app.ts)).

- **Desenvolvimento Local:** `http://localhost:3000/api/v1`
- **Produção:** `https://api.tapmesa.com.br/api/v1` (ou domínio configurado no ambiente)
- **Documentação Interativa (Swagger/Scalar):** `/api/v1/docs` (JSON em `/api/v1/docs/json` ou raiz `/openapi.json`)
- **Métricas Prometheus:** `/metrics` (raiz para scrapers) e `/api/v1/metrics`
- **Healthchecks:** `/api/v1/health/live` e `/api/v1/health/ready`

### 3.2. Formato de Erros (RFC 7807 Problem Details)

Em conformidade com a RFC 7807, todos os erros retornados pela API (4xx e 5xx) seguem rigorosamente a estrutura:

```json
{
  "type": "about:blank",
  "title": "Validation Error",
  "status": 400,
  "detail": "startNumber must be an integer number",
  "instance": "/api/v1/tables",
  "requestId": "9c8e1a82-749e-4a4b-85d1-d2d140e79391"
}
```

Cada resposta de erro inclui o `requestId` correspondente ao cabeçalho `X-Request-Id` recebido ou gerado pelo gateway.

### 3.3. Sincronização de Relógio (`serverNow`)

Para evitar divergências causadas pelo relógio local do celular do cliente ou da estação dos garçons, as respostas de chamados, painel e analytics, e os snapshots SSE, trazem o instante UTC do servidor no campo `serverNow` do corpo. Os cronômetros do front devem usar esse referencial. O cabeçalho `X-Server-Now` existe apenas em `GET /panel/calls` e `GET /panel/calls/recent` e não é exposto via CORS.

Erros de validação de DTO (`title: "Validation Error"`) não trazem `code`; erros de regra de negócio trazem (ver `FRONTEND_INTEGRATION.md`, seção 3).

---

## 4. Índice da Suíte de Documentação

A documentação está dividida em arquivos especializados para consulta rápida e aprofundada:

1. **[`README.md`](README.md)** (este documento): Visão geral, arquitetura, convenções e sumário executivo.
2. **[`API_REFERENCE.md`](API_REFERENCE.md)**: Contratos detalhados de todos os 69 endpoints, parâmetros, payloads e respostas.
3. **[`AUTHENTICATION_AND_PERMISSIONS.md`](AUTHENTICATION_AND_PERMISSIONS.md)**: Fluxo completo de JWT, rotação de refresh token com cookie HttpOnly, detecção de reúso, matriz RBAC e impersonação.
4. **[`DATA_MODEL.md`](DATA_MODEL.md)**: Schema Prisma completo, enums, diagramas ER, índices, restrições e mapeamento Domínio vs DTO.
5. **[`BUSINESS_RULES.md`](BUSINESS_RULES.md)**: Máquinas de estado de chamados, regras de expiração (20 min), SLA, janela de confirmação, contestações e rollups diários.
6. **[`FRONTEND_INTEGRATION.md`](FRONTEND_INTEGRATION.md)**: Guia de como o front consome a API: autenticação, erros, limites de requisição, SSE (eventos, payloads e como atualizar o estado), fluxo da mesa, painel, mesas/QR, aparência, analytics, equipe, notificações e admin.
   6.1. **[`FRONTEND_CHANGES.md`](FRONTEND_CHANGES.md)**: Lista acionável (22/10/2026) do que mudar no repositório do front para alinhá-lo à API real, com arquivos, prioridade e critérios de aceite.
7. **[`TYPESCRIPT_CONTRACTS.md`](TYPESCRIPT_CONTRACTS.md)**: Interfaces TypeScript, DTOs, Enums e tipos de eventos SSE prontos para copiar e colar no frontend.
8. **[`FRONTEND_ENDPOINT_MAPPING.md`](FRONTEND_ENDPOINT_MAPPING.md)**: Mapeamento tela por tela (Mesa do Cliente, Painel do Garçom, Dashboard do Gerente e Portal Admin).
9. **[`AUDIT_REPORT.md`](AUDIT_REPORT.md)**: Relatório da auditoria técnica do código, divergências entre OpenAPI e código real, análise de cobertura de testes e recomendações.
10. **[`endpoint-inventory.json`](endpoint-inventory.json)**: Inventário estruturado legível por máquina de todos os endpoints auditados e comprovados.
11. **[`openapi.json`](openapi.json)**: Especificação formal OpenAPI 3.1.0 extraída da aplicação.

---

## 5. Guia de Leitura Recomendado

- **Se você vai implementar a Tela da Mesa (Mobile Cliente via QR Code):**
  1. Leia [`BUSINESS_RULES.md`](BUSINESS_RULES.md) (Ciclo de vida do chamado e avaliação rápida).
  2. Consulte [`FRONTEND_ENDPOINT_MAPPING.md`](FRONTEND_ENDPOINT_MAPPING.md) na seção "Tela Pública da Mesa".
  3. Copie os contratos de [`TYPESCRIPT_CONTRACTS.md`](TYPESCRIPT_CONTRACTS.md).
  4. Siga os exemplos de SSE em [`FRONTEND_INTEGRATION.md`](FRONTEND_INTEGRATION.md).

- **Se você vai implementar o Painel da Equipe (Garçons/Cozinha):**
  1. Leia [`AUTHENTICATION_AND_PERMISSIONS.md`](AUTHENTICATION_AND_PERMISSIONS.md) para autenticação e ticket de stream (`/panel/stream-ticket`).
  2. Consulte [`FRONTEND_ENDPOINT_MAPPING.md`](FRONTEND_ENDPOINT_MAPPING.md) na seção "Painel da Equipe em Tempo Real".
  3. Veja como consumir o fluxo de reconexão SSE em [`FRONTEND_INTEGRATION.md`](FRONTEND_INTEGRATION.md).

- **Se você vai implementar o Painel do Dono / Gerente (Settings, Mesas, Equipe e Resumo do Dia):**
  1. Leia [`AUTHENTICATION_AND_PERMISSIONS.md`](AUTHENTICATION_AND_PERMISSIONS.md) (RBAC `OWNER`).
  2. Consulte os endpoints de Settings, Mesas e Analytics em [`API_REFERENCE.md`](API_REFERENCE.md).
  3. Entenda o cálculo do Dia Operacional e Rollup em [`BUSINESS_RULES.md`](BUSINESS_RULES.md).
