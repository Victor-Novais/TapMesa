# Guia de Integração Front-end ↔ Back-end — TapMesa

> **Para quem é:** desenvolvedores e agentes de IA que implementam ou corrigem o front-end (repositório `TapMesa`, Next.js) contra esta API.
> **Estado:** conferido contra a API em execução em 22/10/2026 (back-end commit posterior a `eb2dfdc`).
> **Mudanças pendentes no front:** a lista acionável, com arquivos e critérios de aceite, está em [`FRONTEND_CHANGES.md`](FRONTEND_CHANGES.md). Comece por ela se a tarefa é "alinhar o front ao back".

## Fontes de verdade

| O que você precisa                         | Onde está                                                                               |
| :----------------------------------------- | :-------------------------------------------------------------------------------------- |
| Formato exato de request/response (TS)     | [`TYPESCRIPT_CONTRACTS.md`](TYPESCRIPT_CONTRACTS.md), conferido campo a campo com a API |
| Rotas, status, erros e exemplos JSON reais | [`API_REFERENCE.md`](API_REFERENCE.md)                                                  |
| Contrato máquina (gerar tipos, Postman)    | `GET /api/v1/docs/json` ou [`openapi.json`](openapi.json) (69 operações, testado em CI) |
| Regras de negócio (estados, prazos, SLA)   | [`BUSINESS_RULES.md`](BUSINESS_RULES.md)                                                |
| Qual endpoint cada tela usa                | [`FRONTEND_ENDPOINT_MAPPING.md`](FRONTEND_ENDPOINT_MAPPING.md)                          |

Se este guia e o código do back divergirem, o código do back vence; avise para corrigir o guia.

---

## 0. Regras que mais causam bugs

1. **Use os nomes de campo dos contratos, sem adivinhar.** Vários bugs do front vieram de tipos escritos a partir de documentação antiga (`attendants`, `hourly`, `hasMore`, `qrCodeSvg`, `primaryColor`...). Copie as interfaces de `TYPESCRIPT_CONTRACTS.md`.
2. **Eventos SSE têm nomes em minúsculo com ponto** (`call.opened`, `call.attended`...). Os nomes `CALL_CREATED`, `TABLE_PAUSED`, `TABLE_DELETED` etc. **nunca são enviados**.
3. **O link da mesa vem pronto do back** (`table.url`, `PrintViewTable.url`, cabeçalho `X-Table-Url`). Não monte `origin + /m/token` no front.
4. **O horário oficial é o do servidor:** use o campo `serverNow` do corpo das respostas para sincronizar cronômetros.
5. **Rotas públicas têm orçamento de requisições por IP** e todos os clientes de um restaurante costumam sair pelo mesmo IP (Wi-Fi). Não refaça `GET` a cada evento (seção 4).
6. **`POST` de criação e de "reset de senha"/"envio" retornam `201`**, não `200`. Trate qualquer `2xx` como sucesso.

---

## 1. Ambiente e URLs

| Variável              | Lado  | Valor em desenvolvimento                      | Observação                                                                                  |
| :-------------------- | :---- | :-------------------------------------------- | :------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL` | front | `http://localhost:3000/api/v1`                | Inclui o prefixo `/api/v1`.                                                                 |
| `NEXT_PUBLIC_APP_URL` | front | `http://localhost:3001`                       | Origem pública do front.                                                                    |
| `PUBLIC_APP_URL`      | back  | `http://localhost:3001`                       | Base dos QR Codes (`{PUBLIC_APP_URL}/m/{token}`). Deve ser a mesma origem pública do front. |
| `CORS_ORIGINS`        | back  | `http://localhost:3001,http://127.0.0.1:3001` | Lista exata de origens do front (sem `*`).                                                  |

- **Teste no celular (rede local):** use o IP da máquina nas três URLs (`NEXT_PUBLIC_API_URL=http://192.168.x.y:3000/api/v1`, `PUBLIC_APP_URL=http://192.168.x.y:3001`) e inclua `http://192.168.x.y:3001` em `CORS_ORIGINS`. A API escuta em `0.0.0.0`. O back só lê o `.env` quando sobe pelo `docker compose` (recrie o container após editar).
- **Cabeçalhos expostos via CORS:** apenas `X-Table-Url`. Os demais cabeçalhos de resposta (inclusive `X-Server-Now`) não são legíveis pelo browser em cross-origin.
- **Rota pública do cliente:** `/m/{token}`. QR Codes antigos apontam para `/?m={token}`; o front deve redirecionar `/?m=TOKEN` para `/m/TOKEN` (já implementado em `src/app/page.tsx`).

---

## 2. Autenticação

### 2.1. Tokens

- `POST /auth/login` `{ username, password }` → `200 { accessToken }` e cookie HttpOnly `refresh_token` (`Path=/api/v1/auth`, `SameSite=Strict`).
- Access token JWT de **15 min**, mantido só em memória. Envie em `Authorization: Bearer <token>`.
- `POST /auth/refresh` (sem corpo, cookie enviado pelo browser) → `200 { accessToken }` e novo cookie. Rotação com detecção de reuso: reutilizar um refresh antigo revoga a família inteira (`401 TOKEN_REUSE_DETECTED`).
- `POST /auth/logout` → `200 { message }`, apaga o cookie.
- O axios precisa de `withCredentials: true` para o cookie trafegar. O cliente atual do front (`src/shared/api/client.ts`, fila única de refresh no `401`) está correto; mantenha-o.

### 2.2. `GET /auth/me`

Devolve as **claims do access token**, não um perfil:

```json
{
  "sub": "<userId>",
  "role": "OWNER",
  "rid": "<restaurantId>",
  "iat": 1792698492,
  "exp": 1792699392
}
```

- `imp` aparece quando o token é de impersonação (ID do ADMIN).
- **Não há `username` nem `id`.** Use `sub` como id e `rid` como restaurante. Se precisar exibir o nome de usuário, guarde o que foi digitado no login (a resposta do login não traz o nome).

### 2.3. Perfis e telas

| Perfil   | Pode acessar                                                                                            |
| :------- | :------------------------------------------------------------------------------------------------------ |
| `ADMIN`  | `/admin/*` (restaurantes, auditoria, impersonação). Com token de impersonação, tudo que o OWNER acessa. |
| `OWNER`  | Mesas, configurações, aparência, equipe, notificações, analytics e painel.                              |
| `WAITER` | Painel (`/panel/*`) e `GET /restaurant/current`. Analytics e configurações dão `403`.                   |

### 2.4. Login e bloqueio

- 5 senhas erradas seguidas bloqueiam a conta por 15 min: `401 ACCOUNT_LOCKED` (é **401**, não 403).
- Limite de 5 tentativas de login por minuto por IP (`THROTTLE_LOGIN_RPM`): `429 TOO_MANY_REQUESTS`.
- Restaurante suspenso: `403 RESTAURANT_SUSPENDED`. Usuário desativado: `401 USER_INACTIVE`.

### 2.5. Impersonação (ADMIN)

`POST /admin/restaurants/:id/impersonate` → `200`:

```json
{
  "accessToken": "eyJ...",
  "restaurantId": "…",
  "ownerId": "…",
  "ownerUsername": "dono_x",
  "impersonatedBy": "<adminId>"
}
```

Não vem `restaurantName`; para o cabeçalho, use `GET /restaurant/current` com o token impersonado. Para sair, volte a usar o token original do ADMIN (o back não tem endpoint de "parar").

---

## 3. Erros (RFC 7807)

Toda resposta de erro tem o formato:

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Mensagem em pt-BR",
  "instance": "/api/v1/...",
  "requestId": "uuid",
  "code": "TABLE_PAUSED"
}
```

- Erros de validação de DTO: `400`, `title: "Validation Error"`, **sem `code`**; `detail` concatena as mensagens.
- `409 DUPLICATE_TABLE_NUMBER` traz também `duplicates: number[]`.
- Mostre `detail` ao usuário quando não houver tradução específica; registre `requestId` em logs.

| Status | `code`                                                                          | Quando                                                                    |
| :----- | :------------------------------------------------------------------------------ | :------------------------------------------------------------------------ |
| 400    | `INVALID_USERNAME`                                                              | Username fora do padrão ou reservado (`admin`).                           |
| 400    | `TABLE_PAUSED`                                                                  | Cliente tentou abrir chamado em mesa pausada.                             |
| 400    | `INVALID_CALL_NOTE`                                                             | Observação com mais de 150 caracteres.                                    |
| 400    | `INVALID_CALL_TRANSITION`                                                       | Ação incompatível com o estado do chamado (ex.: atender já confirmado).   |
| 400    | `INVALID_RATING`                                                                | `rating` fora de 1..3.                                                    |
| 400    | `INVALID_TABLE_NUMBER` / `INVALID_TABLE_BATCH_COUNT`                            | Número de mesa inválido / lote fora de 1..50.                             |
| 400    | `INVALID_SERVICE_SETTINGS` / `INVALID_APPEARANCE`                               | Configuração ou aparência inválida (cor, link, texto).                    |
| 400    | `MISSING_FILE` / `INVALID_IMAGE_FORMAT` / `FILE_TOO_LARGE`                      | Upload sem arquivo / não é JPEG, PNG ou WebP / maior que 2 MB.            |
| 400    | `INVALID_DATE_RANGE` / `DATE_RANGE_EXCEEDS_LIMIT`                               | Período de analytics inválido / maior que 90 dias.                        |
| 400    | `INVALID_CONFIRMATION_NAME`                                                     | Nome digitado não confere ao excluir restaurante.                         |
| 400    | `CANNOT_DELETE_SELF` / `CANNOT_MODIFY_OWN_STATUS` / `CANNOT_ASSIGN_ADMIN_ROLE`  | Regras de equipe.                                                         |
| 400    | `SUMMARY_EMAIL_DISABLED` / `URGENT_ALERT_DISABLED`                              | Envio manual com a notificação desligada.                                 |
| 401    | `INVALID_CREDENTIALS` / `ACCOUNT_LOCKED` / `USER_INACTIVE` / `ACCOUNT_INACTIVE` | Login.                                                                    |
| 401    | `INVALID_REFRESH_TOKEN` / `TOKEN_REUSE_DETECTED`                                | Refresh inválido: mandar para o login.                                    |
| 403    | `RESTAURANT_SUSPENDED`                                                          | Restaurante suspenso (login, painel, impersonação).                       |
| 403    | (sem `code`)                                                                    | Perfil sem permissão ou recurso de outro restaurante.                     |
| 404    | `TABLE_NOT_FOUND`                                                               | Token de mesa inválido ou mesa excluída (tela "Mesa não encontrada").     |
| 404    | `CALL_NOT_FOUND` / `USER_NOT_FOUND` / `RESTAURANT_NOT_FOUND`                    | Recurso inexistente.                                                      |
| 409    | `USERNAME_ALREADY_EXISTS` / `DUPLICATE_TABLE_NUMBER`                            | Conflitos de cadastro.                                                    |
| 409    | `ALERT_COOLDOWN_ACTIVE`                                                         | Alerta urgente dentro do cooldown (use `force: true` para testes).        |
| 413    | `PAYLOAD_TOO_LARGE`                                                             | Corpo acima de 10 KB (rotas públicas) / 100 KB (demais) / 10 MB (upload). |
| 429    | `TOO_MANY_REQUESTS`                                                             | Limite de requisições (seção 4). Pode trazer `retryAfter` (segundos).     |

---

## 4. Limites de requisição

| Escopo                                          | Limite (por IP, janela de 60 s)                  | Observação                                                 |
| :---------------------------------------------- | :----------------------------------------------- | :--------------------------------------------------------- |
| Qualquer rota                                   | 100 por rota                                     | Limite geral.                                              |
| `POST /auth/login`                              | 5                                                | `THROTTLE_LOGIN_RPM`.                                      |
| Rotas `/public/*` (geral)                       | 60 por rota                                      | `THROTTLE_PUBLIC_RPM`.                                     |
| Rotas `/public/*` — `GET` (inclui abrir stream) | **60 somados entre todas as mesas**              | Guard próprio; não configurável por env hoje.              |
| Rotas `/public/*` — `POST`                      | **10 por IP**, 10 por mesa, 10 por `X-Device-Id` | Abrir, cancelar, confirmar e contestar contam juntos.      |
| Token de mesa inválido                          | 5 erros → IP penalizado por 60 s                 | Anti-enumeração: tudo responde `429` durante a penalidade. |
| Streams SSE                                     | 30 conexões/min; 5 abertas por IP; 10 por mesa   | Excedeu: `429` ao abrir o stream.                          |

**Regras para o front (tela pública da mesa):**

- Os clientes de um restaurante normalmente compartilham o mesmo IP (Wi-Fi). Os limites por IP valem para **o restaurante inteiro**.
- Carregue `GET /public/tables/:token` **uma vez** ao abrir a página. Depois, atualize o estado a partir dos eventos SSE e da resposta dos `POST` (eles devolvem o chamado atualizado).
- Se precisar recarregar após reconectar o stream, use `GET /public/tables/:token/calls` (só os chamados), no máximo uma vez por reconexão e com debounce.
- Não reabra o stream em loop: backoff exponencial começando em 1 s, máximo 30 s.
- Envie um `X-Device-Id` estável por aparelho (UUID salvo em `localStorage`) nos `POST` públicos.
- Em `429`, mostre "Muitas solicitações, tente em instantes" e respeite `retryAfter` quando vier.

---

## 5. Relógio do servidor

- Respostas de chamados, painel e analytics trazem `serverNow` (ISO 8601) no corpo; o snapshot SSE também.
- Calcule o offset (`serverNow - Date.now()`) a cada resposta e use-o em todos os cronômetros. O front já faz isso em `src/shared/lib/clock.ts` (`syncClock`).
- O cabeçalho `X-Server-Now` só existe em `GET /panel/calls` e `GET /panel/calls/recent` e não é exposto via CORS; não dependa dele.

---

## 6. Tempo real (SSE)

### 6.1. Canais

| Canal           | URL                                 | Autenticação                                                     | Heartbeat                            |
| :-------------- | :---------------------------------- | :--------------------------------------------------------------- | :----------------------------------- |
| Mesa (cliente)  | `GET /public/tables/:token/stream`  | Pública (token na URL)                                           | comentário `: heartbeat` a cada 25 s |
| Painel (equipe) | `GET /panel/stream?ticket=<ticket>` | Ticket de `POST /panel/stream-ticket` (JWT, **uso único**, 60 s) | comentário `: heartbeat` a cada 25 s |

- `EventSource` não envia `Authorization`; por isso o painel usa ticket. Em toda reconexão, peça **um novo ticket** (reusar dá `401`).
- O primeiro evento é sempre `snapshot`.

### 6.2. Snapshots

```ts
// Mesa
type TableSnapshot = {
  tableNumber: number;
  calls: PublicCallStateDto[];
  serverNow: string;
};
// Painel: mesmo formato de GET /panel/state
type PanelSnapshot = PanelStateDto; // { activeCalls, recentCalls, thresholds: { alertSec, urgentSec }, serverNow }
```

### 6.3. Eventos e payloads

Nomes exatos do campo `event:`:

| Evento              | Quando                                                           |           Canal mesa            | Canal painel |
| :------------------ | :--------------------------------------------------------------- | :-----------------------------: | :----------: |
| `call.opened`       | Cliente abriu chamado                                            |                ✓                |      ✓       |
| `call.acknowledged` | Garçom assumiu (`assume`/`acknowledge`)                          |                ✓                |      ✓       |
| `call.attended`     | Garçom marcou atendido                                           |                ✓                |      ✓       |
| `call.confirmed`    | Cliente confirmou (com `rating` opcional)                        |                ✓                |      ✓       |
| `call.reopened`     | Cliente contestou ("Ainda não"); volta a `PENDING`               |                ✓                |      ✓       |
| `call.cancelled`    | Cliente cancelou                                                 |                ✓                |      ✓       |
| `call.expired`      | 20 min pendente sem atendimento                                  |                ✓                |      ✓       |
| `call.closed`       | Janela de confirmação acabou sem resposta (`CLOSED_UNCONFIRMED`) |                ✓                |      ✓       |
| `table.removed`     | Mesa excluída                                                    | ✓ (e o servidor fecha o stream) |      ✓       |
| `alert.raised`      | Alerta de urgência (job ou envio manual)                         |                —                |      ✓       |

**Não existem** eventos de pausar/retomar mesa. A tela do cliente descobre a pausa pelo `400 TABLE_PAUSED` ao tentar chamar (ou ao recarregar a mesa).

Payload no **canal do painel** (`PanelCallEventData`):

```ts
{
  callId: string; restaurantId: string; tableId: string | null; actorUserId: string | null;
  type: string;        // em call.opened = "WAITER" | "BILL"; nos demais = tipo do evento ("ATTENDED", "REOPENED"...)
  source: "CUSTOMER" | "STAFF" | "SYSTEM";
  occurredAt: string;
  note?: string | null;  tableNumber?: number;   // só em call.opened
  rating?: number;                                // só em call.confirmed
  reopenCount?: number;                           // só em call.reopened, já com o valor novo
}
```

Payload no **canal da mesa** (`PublicCallEventData`, sem dados internos):

```ts
{ callId: string; tableId: string; type: string; actorUserId: string | null; occurredAt: string; tableNumber?: number }
```

`table.removed`: no painel `{ tableId, tableNumber, occurredAt }`; na mesa `{ message: "Esta mesa foi desativada pelo restaurante." }`.

`alert.raised`: `{ restaurantId, tableNumber, callType, waitDurationSec, urgentThresholdSec, note, raisedAt }`.

### 6.4. Como cada evento deve atualizar o estado

Painel (`activeCalls` = fila, `recentCalls` = gaveta):

| Evento                            | Ação                                                                                                                                                                                                                                                                  |
| :-------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `call.opened`                     | Adicionar em `activeCalls` (`id = callId`, `tableNumber`, `type`, `note`, `createdAt = occurredAt`, `status = PENDING`). Tocar alerta.                                                                                                                                |
| `call.acknowledged`               | No item de `activeCalls`: `acknowledgedAt = occurredAt`, `acknowledgedById = actorUserId`.                                                                                                                                                                            |
| `call.attended`                   | Remover de `activeCalls` e inserir em `recentCalls` **copiando `tableNumber`, `type` e `note` do item removido** (o payload não traz o tipo do chamado nem a mesa). `confirmationStatus = AWAITING_CONFIRMATION`.                                                     |
| `call.confirmed`                  | Em `recentCalls`: `status = CONFIRMED`, `confirmationStatus = CONFIRMED`, `rating`.                                                                                                                                                                                   |
| `call.closed`                     | Em `recentCalls`: `status = CLOSED_UNCONFIRMED`, `confirmationStatus = CLOSED_UNCONFIRMED`.                                                                                                                                                                           |
| `call.reopened`                   | O chamado **não está** em `activeCalls` (saiu ao ser atendido). Recarregar `GET /panel/calls` (debounce) ou movê-lo de `recentCalls` para `activeCalls` com `status = PENDING`, `reopened = true`, `reopenCount` do payload (não somar +1). Destacar como "Reaberto". |
| `call.cancelled` / `call.expired` | Remover de `activeCalls`.                                                                                                                                                                                                                                             |
| `table.removed`                   | Remover de `activeCalls` os chamados com esse `tableId`.                                                                                                                                                                                                              |
| `alert.raised`                    | Toast/som de urgência com mesa e tempo de espera.                                                                                                                                                                                                                     |

Mesa (cliente): para qualquer `call.*`, atualizar o chamado `callId` localmente quando possível (`call.attended` → `status = ATTENDED`, `attendedAt = occurredAt`; `call.confirmed`/`call.closed` → sai da tela; `call.reopened` → `PENDING`) e, se precisar do estado completo, um único `GET /public/tables/:token/calls` com debounce. Em `table.removed`, mostrar a mensagem e não reconectar.

---

## 7. Tela pública da mesa (`/m/{token}`)

Fluxo:

1. `GET /public/tables/:token` → `PublicTableDto` (aparência, `available`, `unavailableReason`, `calls`, `showWaitTimeToCustomer`, `serverNow`). `404 TABLE_NOT_FOUND` = QR inválido ou mesa excluída.
2. Abrir o stream da mesa (seção 6).
3. **Chamar garçom / pedir conta:** `POST /public/tables/:token/calls` `{ type: "WAITER" | "BILL", note? }`.
   - `201` chamado novo; `200` com `alreadyPending: true` se já havia um pendente do mesmo tipo (idempotente: não é erro).
   - `note`: até **150 caracteres** depois de remover HTML e espaços extras (acima disso `400 INVALID_CALL_NOTE`). Use `maxLength={150}`.
   - Garçom e conta podem estar pendentes ao mesmo tempo.
4. **Cancelar:** `POST .../calls/:callId/cancel` → `200` com `status: CANCELLED` (só enquanto `PENDING`).
5. Quando chega `call.attended`, mostrar "Você foi atendido?":
   - **Confirmar:** `POST .../calls/:callId/confirm` `{ rating?: 1 | 2 | 3 }` → `200` `status: CONFIRMED`. A avaliação é opcional; a primeira resposta vale.
   - **Contestar:** `POST .../calls/:callId/contest` → `200` `status: PENDING`, `reopenCount` +1. Máximo de **2 reaberturas**; na 3ª o chamado continua `ATTENDED` e fica marcado como contestado no painel.
   - Sem resposta até `confirmationDeadline`, o servidor fecha como `CLOSED_UNCONFIRMED` (evento `call.closed`).
6. Chamado pendente por 20 min vira `EXPIRED` (`call.expired`).
7. Mesa pausada: `available: false`, `unavailableReason: "TABLE_PAUSED"`, `message` com o texto para o cliente. Restaurante suspenso: `RESTAURANT_SUSPENDED`.

Aparência na tela do cliente (`PublicTableDto.appearance`): `restaurantName`, `description`, `logoUrl`, `backgroundType` (`color` | `image`), `backgroundValue`, `colors`, `texts`, `socials` (seção 10).

---

## 8. Painel da equipe

- Carga inicial: o `snapshot` do SSE (ou `GET /panel/state` como fallback/polling).
- `GET /panel/calls` → `PanelCallDto[]` (fila ativa, mais antigo primeiro).
- `GET /panel/calls/recent?limit=10` → `RecentAttendedCallDto[]` (máx. 50), com `confirmationStatus`: `AWAITING_CONFIRMATION` | `CONFIRMED` | `CONTESTED` | `CLOSED_UNCONFIRMED`.
- `POST /panel/calls/:id/assume` (ou `acknowledge`) → `AcknowledgedCallDto`; idempotente (`alreadyAcknowledged`).
- `POST /panel/calls/:id/attend` → `AttendedCallDto`; idempotente (`alreadyAttended`). Em chamado já confirmado: `400 INVALID_CALL_TRANSITION`.
- Cronômetro: `elapsed = serverNowAjustado - createdAt`. `createdAt` reinicia na contestação; `originalCreatedAt` guarda a abertura original. Cores: até `thresholds.alertSec` normal; até `urgentSec` alerta; acima, urgente.
- `reopened: true` = já foi contestado ao menos uma vez (selo "Reaberto"); `contested: true` = esgotou as 2 reaberturas.

---

## 9. Mesas e QR Code

- `GET /tables`, `POST /tables` `{ startNumber, count }` (1..50; `409 DUPLICATE_TABLE_NUMBER` com `duplicates`), `PATCH /tables/:id/pause|resume`, `DELETE /tables/:id` (`204`).
- Todo `TableDto` traz `url`: a URL canônica do QR (`{PUBLIC_APP_URL}/m/{token}`). **"Copiar link" e o texto exibido devem usar `table.url`.**
- `GET /tables/:id/qr?format=png|svg` (padrão `png`): imagem binária com `Content-Disposition` e cabeçalho `X-Table-Url` (o mesmo valor que está no QR). Para SVG em texto, use `responseType: "text"`.
- `GET /tables/print` → `{ restaurant: { name, logoUrl }, tables: [{ id, number, token, paused, url, qrSvg }] }`. O QR vem em `qrSvg` (markup SVG pronto). Não há cor no payload; para a cor da marca use `GET /settings/appearance` → `colors.primary`.
- `GET /tables/next-number` → `{ nextNumber }`.

---

## 10. Configurações e aparência

- `GET`/`PUT /settings/service` → `ServiceSettings` (`responseGoalSec`, `alertSec`, `urgentSec`, `confirmationWindowSec`, `timezone`, `dayCutoffHour`, `showWaitTimeToCustomer`). O `PUT` aceita parcial.
- `GET`/`PUT /settings/appearance` → `RestaurantAppearance`. Regras de merge do `PUT`:
  - `colors` e `texts`: **mesclados** com o que já existe (só as chaves enviadas mudam). Cores em hexadecimal. Texto até 200 caracteres e não pode ser vazio.
  - `socials`: **substitui o objeto inteiro**. Envie sempre todos os links; chave ausente ou vazia é removida.
- **Chaves canônicas de `texts`** (são as que o back cria e que a tela do cliente deve ler): `welcomeTitle`, `callWaiterButton`, `requestBillButton`, `notePlaceholder`, `pendingMessage`, `attendedPrompt`, `confirmButton`, `contestButton`, `cancelButton`. Não use `waiterButton`/`billButton`.
- **Chaves de `colors`:** `primary`, `background`, `surface`, `text` (outras chaves hex são aceitas e guardadas).
- **`socials`:** links externos (`instagram`, `whatsapp`, `googleReview`, `website`, `facebook`...) recebem `https://` automaticamente e só aceitam http(s). Exceção: **`wifiName` e `wifiPassword` são texto puro** (até 100 caracteres), exibidos ao cliente.
- `POST /settings/appearance/reset` → aparência padrão.
- **Upload** `POST /settings/appearance/logo` e `.../background` (`multipart/form-data`, campo `file`):
  - Só JPEG, PNG e WebP (verificados pelo conteúdo), até **2 MB**. **SVG é recusado.** Valide no front antes de enviar.
  - Resposta `200`: a aparência completa atualizada (no fundo, `backgroundType` vira `image`).
  - Com `STORAGE_DRIVER=local` (padrão em dev), a URL gerada é `{PUBLIC_APP_URL}/storage/<arquivo>` e **nada serve esse caminho hoje**: a imagem aparece quebrada. Com `STORAGE_DRIVER=s3` funciona. Pendência do back.
- `GET /restaurant/current` → `{ id, name, status, createdAt, impersonatedBy }`.

---

## 11. Analytics (OWNER/ADMIN)

Todos aceitam `from` e `to` (`YYYY-MM-DD`, dia operacional; padrão hoje; máximo 90 dias). Formatos completos em `TYPESCRIPT_CONTRACTS.md`, seção 9.

- `GET /analytics/summary` → `{ range, summary: { overview, byType, byHour, ranking }, serverNow }`.
  - `overview`: `totalCalls`, `waiterCalls`, `billCalls`, `statusCounts{pending,attended,confirmed,cancelled,expired,closed}`, `attendedCount`, `expiredCount`, `cancelledCount`, `reopenedCount`, `responseTimes`, `reactionTimes`, `executionTimes` (cada um `{ averageResponseTimeSec, medianResponseTimeSec, p90ResponseTimeSec, maxWaitTimeSec, sampleCount }`), `ratings{"1","2","3",total,average}`, `percentageWithinTarget`, `confirmationRate`. **Não existe p95.**
- `GET /analytics/by-hour` → `{ range, byHour: HourlyMetric[], serverNow }` (24 itens, `hour` 0..23, `averageResponseTimeSec`).
- `GET /analytics/tables-ranking` → `{ range, ranking: { all, waiter, bill }, serverNow }`, cada um `{ byVolume, byResponseTime }` com `{ tableNumber, totalCalls, attendedCalls, averageResponseTimeSec }`.
- `GET /analytics/summary/compare` → `{ today, yesterday, sameDayLastWeek, serverNow }`; cada dia `{ day, metrics }`; `yesterday` e `sameDayLastWeek` trazem `delta` = hoje menos o dia (`deltaTotalCalls`, `deltaAverageResponseTimeSec`, `deltaPercentageWithinTarget`, `deltaConfirmationRate`, em unidades absolutas/pontos percentuais).
- `GET /analytics/calls?cursor&limit&type&status&table&from&to` → `{ items, nextCursor, totalCount, serverNow }`. Filtro de mesa é **`table`**. Há mais páginas enquanto `nextCursor !== null`.
- `GET /analytics/export.csv?from&to` → CSV UTF-8 com BOM, separador `;`, todos os campos entre aspas. Baixe com o axios autenticado (`responseType: "blob"`).

---

## 12. Equipe (OWNER/ADMIN)

- `GET /restaurant/users` → `TeamUser[]` (`id`, `restaurantId`, `username`, `role`, `active`, `failedAttempts`, `isLocked`, `createdAt`).
- `POST /restaurant/users` `{ username, role?: "WAITER" | "OWNER", password? }` → `201 CreateTeamUserResponse`; `temporaryPassword` vem quando a senha foi gerada.
- `PATCH /restaurant/users/:id/status` `{ active }` → `200 { id, username, role, active }`.
- `POST /restaurant/users/:id/reset-password` → **`201`** `{ id, username, temporaryPassword }`.
- `DELETE /restaurant/users/:id` → `204`.
- `GET /restaurant/users/metrics` → `{ restaurantId, totalCallsAttended, waiters: [{ userId, username, totalCallsAttended, avgResponseTimeSec, fastestResponseSec, slowestResponseSec }] }`. Não há avaliação média nem tempo de reação por garçom.

---

## 13. Notificações (OWNER/ADMIN)

- `GET`/`PATCH`/`PUT /restaurant/notifications/settings` → `{ restaurantId, emailSummaryEnabled, summaryEmailRecipient?, urgentAlertEnabled, urgentAlertRecipient?, alertCooldownMinutes }`. Os destinatários **ficam ausentes** até serem configurados.
- `POST /restaurant/notifications/send-daily-summary` (corpo opcional `{ operationalDay?, recipientEmail? }`) → **`201`** `{ sent, recipient, subject, operationalDay }`.
- `POST /restaurant/notifications/send-urgent-alert` → **`201`** `{ sent, recipient, subject, tableNumber, waitDurationSec }`. **Corpo obrigatório:** `{ tableNumber, callType, waitDurationSec, urgentThresholdSec, note?, force? }`. Para um botão "testar", envie valores de exemplo e `force: true` (ignora o cooldown).
- **Aviso:** o back ainda não tem provedor de e-mail. As respostas dizem `sent: true`, mas nenhum e-mail sai do servidor. Não prometa ao usuário que o e-mail chegou.

---

## 14. Administração (ADMIN)

- `GET /admin/restaurants?cursor&limit` → `{ data: [{ id, name, ownerUsername, createdAt, status }], nextCursor? }`. A lista vem em **`data`**; `nextCursor` **some** na última página. Não há contagem de mesas/usuários.
- `POST /admin/restaurants` `{ name, ownerUsername }` → `201 { restaurantId, ownerUsername, ownerPasswordPlain }` (senha exibida uma única vez).
- `PATCH /admin/restaurants/:id/suspend|reactivate` → `204`.
- `POST /admin/restaurants/:id/reset-owner-password` → **`201 { newPasswordPlain }`** (exibir uma única vez).
- `DELETE /admin/restaurants/:id` com corpo `{ confirmName }` → `204`.
- `GET /admin/audit?cursor&limit&restaurantId&action&actorUserId` → `{ items: [{ id, at, action, actorUserId, restaurantId, target, ip, meta }], nextCursor, totalCount }`. O horário é **`at`**; não há `actorRole`.

---

## 15. Paginação

| Endpoint                               | Lista em     | Fim da lista          |
| :------------------------------------- | :----------- | :-------------------- |
| `GET /admin/restaurants`               | `data`       | `nextCursor` ausente  |
| `GET /admin/audit`                     | `items`      | `nextCursor === null` |
| `GET /analytics/calls`                 | `items`      | `nextCursor === null` |
| `GET /tables`, `GET /restaurant/users` | array direto | sem paginação         |

Passe o `nextCursor` recebido como `cursor` na próxima chamada. Nenhum endpoint retorna `hasMore`.

---

## 16. Como verificar uma integração

1. Suba o back (`docker compose up -d`) e confira `GET /api/v1/health/ready` → `200`.
2. Compare o tipo usado no front com a interface de mesmo nome em `TYPESCRIPT_CONTRACTS.md`.
3. Para eventos SSE: `curl -N http://localhost:3000/api/v1/public/tables/<TOKEN>/stream` e, em outro terminal, abra um chamado; o evento `call.opened` deve aparecer.
4. Para o QR: baixe `GET /tables/:id/qr`, decodifique e compare com `table.url` e com o cabeçalho `X-Table-Url`.
