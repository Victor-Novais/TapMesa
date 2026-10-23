# Referência Completa da API (API Reference) — TapMesa Backend

Este documento descreve detalhadamente todos os **69 endpoints** da API do TapMesa, organizados por módulo funcional. Todos os contratos foram verificados diretamente no código-fonte em TypeScript e contêm rastreabilidade para seus respectivos controllers, use cases e DTOs.

> **Prefixo Global da API:** Todas as rotas de negócio são servidas sob o prefixo `/api/v1`.

---

## 1. Módulo: Identidade e Autenticação (`IdentityAccess`)

Controlador: [`AuthController`](../../src/modules/identity-access/presentation/AuthController.ts)

### 1.1. Login de Usuário

- **Método / Rota:** `POST /api/v1/auth/login`
- **Finalidade:** Autentica um usuário existente (ADMIN, OWNER ou WAITER). Emite um `accessToken` JWT (15 minutos) e grava um `refresh_token` em cookie `HttpOnly` rotativo (30 dias).
- **Autenticação:** Pública (`@Public()`).
- **Rate Limit:** 5 requisições por 60 segundos por IP (via `@Throttle({ default: { limit: 5, ttl: 60000 } })`).
- **Corpo da Requisição (`application/json`):**
  ```json
  {
    "username": "admin",
    "password": "MinhaSenhaForte@123"
  }
  ```
- **Resposta de Sucesso (`200 OK`):**
  - **Set-Cookie:** `refresh_token=<token_rotativo>; Path=/api/v1/auth; HttpOnly; SameSite=Strict; Secure`
  - **Body:**
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
- **Erros Possíveis:**
  - `400 Bad Request` (`VALIDATION_ERROR`): Campos ausentes ou inválidos.
  - `401 Unauthorized` (`INVALID_CREDENTIALS`): Nome de usuário ou senha incorretos.
  - `401 Unauthorized` (`ACCOUNT_LOCKED`): Conta temporariamente bloqueada após 5 falhas consecutivas (bloqueio de 15 minutos).
  - `403 Forbidden` (`ACCOUNT_INACTIVE` / `USER_INACTIVE`): Usuário com flag `active: false`.
  - `403 Forbidden` (`RESTAURANT_SUSPENDED`): Restaurante ao qual o usuário pertence está suspenso.
  - `429 Too Many Requests`: Limite de taxa de tentativas de login excedido.
- **Evidência de Código:** [`AuthController.login`](../../src/modules/identity-access/presentation/AuthController.ts#L61-L91), [`LoginUseCase`](../../src/modules/identity-access/application/use-cases/LoginUseCase.ts).

---

### 1.2. Renovação de Token (Refresh Token Rotation)

- **Método / Rota:** `POST /api/v1/auth/refresh`
- **Finalidade:** Renova a sessão do usuário. Rotaciona o refresh token contido no cookie `HttpOnly`, invalida o anterior e emite um novo `accessToken` e um novo cookie.
- **Autenticação:** Pública (`@Public()`), lê o cookie `refresh_token`.
- **Cabeçalhos:**
  - `Cookie: refresh_token=<token>` (automático pelo navegador se `credentials: 'include'`).
- **Resposta de Sucesso (`200 OK`):**
  - **Set-Cookie:** Novo `refresh_token` emitido.
  - **Body:**
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
- **Erros Possíveis:**
  - `401 Unauthorized`: Cookie `refresh_token` não encontrado.
  - `401 Unauthorized` (`INVALID_REFRESH_TOKEN`): Token expirado ou inexistente.
  - `401 Unauthorized` (`TOKEN_REUSE_DETECTED`): **Detecção de Reúso!** O token já havia sido utilizado anteriormente por terceiros; toda a família de sessões do usuário é revogada imediatamente por segurança. O cookie é limpo (`clearCookie`).
- **Evidência de Código:** [`AuthController.refresh`](../../src/modules/identity-access/presentation/AuthController.ts#L93-L121).

---

### 1.3. Encerramento de Sessão (Logout)

- **Método / Rota:** `POST /api/v1/auth/logout`
- **Finalidade:** Revoga a família do refresh token atual no banco e limpa o cookie `refresh_token`.
- **Autenticação:** Pública (`@Public()`).
- **Resposta de Sucesso (`200 OK`):**
  - **Set-Cookie:** Limpa o cookie `refresh_token` com Max-Age 0.
  - **Body:**
    ```json
    {
      "message": "Logged out successfully"
    }
    ```
- **Evidência de Código:** [`AuthController.logout`](../../src/modules/identity-access/presentation/AuthController.ts#L123-L135).

---

### 1.4. Identificação do Usuário Logado

- **Método / Rota:** `GET /api/v1/auth/me`
- **Finalidade:** Retorna as informações do usuário atual extraídas do Access Token.
- **Autenticação:** Obrigatória (`Bearer <accessToken>`).
- **Perfis Permitidos:** `ADMIN`, `OWNER`, `WAITER`.
- **Resposta de Sucesso (`200 OK`):**
  ```json
  {
    "sub": "2a94f1a2-6a3f-4481-b75d-c29b6e072851",
    "role": "OWNER",
    "rid": "23037aa0-94d2-4a84-ab18-af0251eff7ba",
    "iat": 1792698738,
    "exp": 1792699638
  }
  ```
- **Erros Possíveis:**
  - `401 Unauthorized`: Token ausente, inválido ou expirado.
- **Evidência de Código:** [`AuthController.me`](../../src/modules/identity-access/presentation/AuthController.ts#L137-L141).

---

## 2. Módulo: Usuários da Equipe (`IdentityAccess - Team`)

Controlador: [`RestaurantUsersController`](../../src/modules/identity-access/presentation/RestaurantUsersController.ts)  
Guards aplicados: `JwtAuthGuard`, `RolesGuard`, `TenantGuard`  
Perfis permitidos: `OWNER`, `ADMIN`  
Contexto de Tenant: Obrigatório (`@RequireTenant()`)

### 2.1. Criar Membro da Equipe

- **Método / Rota:** `POST /api/v1/restaurant/users`
- **Finalidade:** Cadastra um garçom (`WAITER`) ou sócio/gerente (`OWNER`) vinculado ao restaurante.
- **Corpo da Requisição (`application/json`):**
  ```json
  {
    "username": "garcom_joao",
    "role": "WAITER",
    "password": "SenhaOpcional123"
  }
  ```
  _(Se `password` for omitida, uma senha temporária aleatória de alta entropia será gerada)._
- **Resposta de Sucesso (`201 Created`):**
  ```json
  {
    "id": "86b95b8f-049c-44df-96c2-5733bcb607dd",
    "restaurantId": "23037aa0-94d2-4a84-ab18-af0251eff7ba",
    "username": "garcom_joao",
    "role": "WAITER",
    "active": true,
    "createdAt": "2026-10-22T19:52:18.492Z",
    "temporaryPassword": "jkhcAyBMnD"
  }
  ```
- **Erros Possíveis:**
  - `400 Bad Request`: Validação de username ou role falhou.
  - `409 Conflict` (`USERNAME_ALREADY_EXISTS`): Nome de usuário já está em uso no sistema.
- **Evidência de Código:** [`RestaurantUsersController.createUser`](../../src/modules/identity-access/presentation/RestaurantUsersController.ts#L52-L73).

---

### 2.2. Listar Membros da Equipe

- **Método / Rota:** `GET /api/v1/restaurant/users`
- **Finalidade:** Lista todos os usuários pertencentes ao restaurante atual.
- **Resposta de Sucesso (`200 OK`):**
  ```json
  [
    {
      "id": "86b95b8f-049c-44df-96c2-5733bcb607dd",
      "restaurantId": "23037aa0-94d2-4a84-ab18-af0251eff7ba",
      "username": "garcom_joao",
      "role": "WAITER",
      "active": true,
      "failedAttempts": 0,
      "isLocked": false,
      "createdAt": "2026-10-22T19:52:18.492Z"
    }
  ]
  ```
- **Evidência de Código:** [`RestaurantUsersController.listUsers`](../../src/modules/identity-access/presentation/RestaurantUsersController.ts#L75-L81).

---

### 2.3. Métricas de Atendimento por Atendente

- **Método / Rota:** `GET /api/v1/restaurant/users/metrics`
- **Finalidade:** Retorna métricas de produtividade e qualidade do atendimento da equipe (por garçom: chamados atendidos e tempos médio, mais rápido e mais lento de resposta).
- **Query Params:**
  - `userId` (opcional, string UUID): Filtra métricas de um atendente específico.
- **Resposta de Sucesso (`200 OK`):**
  ```json
  {
    "restaurantId": "23037aa0-94d2-4a84-ab18-af0251eff7ba",
    "totalCallsAttended": 1,
    "waiters": [
      {
        "userId": "86b95b8f-049c-44df-96c2-5733bcb607dd",
        "username": "garcom_joao",
        "totalCallsAttended": 1,
        "avgResponseTimeSec": 0,
        "fastestResponseSec": 0,
        "slowestResponseSec": 0
      }
    ]
  }
  ```
- **Evidência de Código:** [`RestaurantUsersController.getMetrics`](../../src/modules/identity-access/presentation/RestaurantUsersController.ts#L83-L96).

---

### 2.4. Detalhes de um Membro da Equipe

- **Método / Rota:** `GET /api/v1/restaurant/users/:id`
- **Parâmetros de Rota:** `id` (UUID do usuário).
- **Resposta de Sucesso (`200 OK`):** Retorna o objeto do usuário.
- **Erros Possíveis:** `404 Not Found` (`USER_NOT_FOUND`).
- **Evidência de Código:** [`RestaurantUsersController.getUser`](../../src/modules/identity-access/presentation/RestaurantUsersController.ts#L98-L115).

---

### 2.5. Ativar / Desativar Membro da Equipe

- **Método / Rota:** `PATCH /api/v1/restaurant/users/:id/status`
- **Finalidade:** Ativa ou suspende o acesso de um usuário. O usuário logado não pode desativar a si mesmo.
- **Parâmetros de Rota:** `id` (UUID do usuário alvo).
- **Corpo da Requisição:**
  ```json
  {
    "active": false
  }
  ```
- **Resposta de Sucesso (`200 OK`):** Objeto do usuário atualizado.
- **Erros Possíveis:**
  - `400 Bad Request` (`CANNOT_DEACTIVATE_SELF`): Tentativa de bloquear o próprio usuário.
  - `404 Not Found` (`USER_NOT_FOUND`).
- **Evidência de Código:** [`RestaurantUsersController.updateStatus`](../../src/modules/identity-access/presentation/RestaurantUsersController.ts#L117-L141).

---

### 2.6. Reset de Senha de Membro da Equipe

- **Método / Rota:** `POST /api/v1/restaurant/users/:id/reset-password`
- **Finalidade:** Gera uma nova senha temporária para o atendente.
- **Resposta de Sucesso (`201 Created`):**
  ```json
  {
    "id": "4a159981-d1c9-4670-8bfa-145617061d47",
    "username": "garcom_joao",
    "temporaryPassword": "NovaSenhaTemporaria#456"
  }
  ```
- **Evidência de Código:** [`RestaurantUsersController.resetPassword`](../../src/modules/identity-access/presentation/RestaurantUsersController.ts#L143-L161).

---

### 2.7. Excluir Membro da Equipe

- **Método / Rota:** `DELETE /api/v1/restaurant/users/:id`
- **Finalidade:** Exclui o atendente. O usuário logado não pode excluir a si mesmo.
- **Resposta de Sucesso (`204 No Content`).**
- **Erros Possíveis:** `400 Bad Request` (`CANNOT_DELETE_SELF`), `404 Not Found`.
- **Evidência de Código:** [`RestaurantUsersController.deleteUser`](../../src/modules/identity-access/presentation/RestaurantUsersController.ts#L163-L184).

---

## 3. Módulo: Administração Geral de Restaurantes (`Tenancy - Admin`)

Controlador: [`AdminRestaurantsController`](../../src/modules/tenancy/presentation/AdminRestaurantsController.ts)  
Perfil exigido: `ADMIN`

### 3.1. Cadastrar Restaurante

- **Método / Rota:** `POST /api/v1/admin/restaurants`
- **Finalidade:** Cria um restaurante e seu usuário `OWNER` inicial com senha temporária.
- **Corpo da Requisição (`application/json`):**
  ```json
  {
    "name": "Churrascaria Boi Bravo",
    "ownerUsername": "boi_bravo_adm"
  }
  ```
- **Resposta de Sucesso (`201 Created`):**
  ```json
  {
    "restaurantId": "23037aa0-94d2-4a84-ab18-af0251eff7ba",
    "ownerUsername": "dono_boibravo",
    "ownerPasswordPlain": "NPcbdT6o"
  }
  ```
- **Evidência de Código:** [`AdminRestaurantsController.create`](../../src/modules/tenancy/presentation/AdminRestaurantsController.ts#L106-L131).

---

### 3.2. Listar Restaurantes

- **Método / Rota:** `GET /api/v1/admin/restaurants`
- **Query Params:**
  - `cursor` (string opcional)
  - `limit` (inteiro opcional, min 1, default 20)
- **Resposta de Sucesso (`200 OK`):**
  ```json
  {
    "data": [
      {
        "id": "3485c0dc-a890-426b-8fb6-86fba9840aa6",
        "name": "Pizzaria Forno a Lenha",
        "ownerUsername": "dono_fornoalenha",
        "createdAt": "2026-10-22T19:52:18.173Z",
        "status": "ACTIVE"
      }
    ],
    "nextCursor": "986912f6-3cc1-40bc-b4c2-60b3a06189d0"
  }
  ```
- **Evidência de Código:** [`AdminRestaurantsController.list`](../../src/modules/tenancy/presentation/AdminRestaurantsController.ts#L133-L144).

---

### 3.3. Excluir Restaurante

- **Método / Rota:** `DELETE /api/v1/admin/restaurants/:id`
- **Finalidade:** Exclusão irreversível com eliminação em cascata de mesas, usuários, chamados e aparências. Exige confirmação digitando o nome exato do restaurante no body.
- **Corpo da Requisição:**
  ```json
  {
    "confirmName": "Churrascaria Boi Bravo"
  }
  ```
- **Resposta de Sucesso (`204 No Content`).**
- **Erros Possíveis:** `400 Bad Request` (`CONFIRMATION_NAME_MISMATCH`), `404 Not Found`.
- **Evidência de Código:** [`AdminRestaurantsController.delete`](../../src/modules/tenancy/presentation/AdminRestaurantsController.ts#L146-L167).

---

### 3.4. Suspender e Reativar Restaurante

- **Método / Rota:**
  - `PATCH /api/v1/admin/restaurants/:id/suspend`
  - `PATCH /api/v1/admin/restaurants/:id/reactivate`
- **Resposta de Sucesso (`204 No Content`).**
- **Evidência de Código:** [`AdminRestaurantsController.suspend`](../../src/modules/tenancy/presentation/AdminRestaurantsController.ts#L169-L184), [`AdminRestaurantsController.reactivate`](../../src/modules/tenancy/presentation/AdminRestaurantsController.ts#L186-L201).

---

### 3.5. Resetar Senha do Proprietário (Owner)

- **Método / Rota:** `POST /api/v1/admin/restaurants/:id/reset-owner-password`
- **Resposta de Sucesso (`201 Created`):** `{ "newPasswordPlain": "gnsbqhYF" }`. A senha é exibida uma única vez e nunca é armazenada em texto.
- **Evidência de Código:** [`AdminRestaurantsController.resetPassword`](../../src/modules/tenancy/presentation/AdminRestaurantsController.ts#L203-L221).

---

### 3.6. Impersonar Restaurante

- **Método / Rota:** `POST /api/v1/admin/restaurants/:id/impersonate`
- **Finalidade:** Permite que o administrador geral assuma temporariamente o papel de `OWNER` do restaurante para fins de suporte e configuração.
- **Resposta de Sucesso (`200 OK`):**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "restaurantId": "3485c0dc-a890-426b-8fb6-86fba9840aa6",
    "ownerId": "0e653336-b199-4d68-8b7f-815a2e45f739",
    "ownerUsername": "dono_fornoalenha",
    "impersonatedBy": "de069117-e248-4091-b496-a511abc3cc99"
  }
  ```
  _(O `accessToken` gerado possui `role: OWNER`, `rid: <restaurantId>` e `imp: <adminId>`. Toda operação de escrita realizada com este token será auditada com a ação `IMPERSONATED_ACTION`)._
- **Erros Possíveis:** `400 Bad Request` (`CANNOT_IMPERSONATE_SUSPENDED_RESTAURANT`).
- **Evidência de Código:** [`AdminRestaurantsController.impersonate`](../../src/modules/tenancy/presentation/AdminRestaurantsController.ts#L223-L260).

---

### 3.7. Consulta aos Logs de Auditoria

- **Controlador:** [`AdminAuditController`](../../src/modules/tenancy/presentation/AdminAuditController.ts)
- **Método / Rota:** `GET /api/v1/admin/audit`
- **Perfil exigido:** `ADMIN`.
- **Query Params:** `cursor`, `limit` (default 50), `restaurantId`, `action`, `actorUserId`.
- **Resposta de Sucesso (`200 OK`):**
  ```json
  {
    "items": [
      {
        "id": "4d3a3def-8554-4229-b8d7-717de15becf9",
        "at": "2026-10-22T19:52:18.183Z",
        "action": "CREATE_RESTAURANT",
        "actorUserId": "de069117-e248-4091-b496-a511abc3cc99",
        "restaurantId": "3485c0dc-a890-426b-8fb6-86fba9840aa6",
        "target": "3485c0dc-a890-426b-8fb6-86fba9840aa6",
        "ip": "127.0.0.1",
        "meta": {
          "name": "Pizzaria Forno a Lenha",
          "ownerUsername": "dono_fornoalenha"
        }
      }
    ],
    "nextCursor": "6001aa1d-aec5-4adc-b761-4dc0898e69e1",
    "totalCount": 8
  }
  ```
- **Evidência de Código:** [`AdminAuditController.list`](../../src/modules/tenancy/presentation/AdminAuditController.ts#L26-L40).

---

## 4. Módulo: Configurações e Aparência (`Tenancy - Settings`)

Controlador: [`SettingsController`](../../src/modules/tenancy/presentation/SettingsController.ts)  
Perfis permitidos: `OWNER`, `ADMIN`  
Contexto de Tenant: Obrigatório (`@RequireTenant()`)

### 4.1. Configurações de Atendimento (`Service Settings`)

- **Rotas:**
  - `GET /api/v1/settings/service`
  - `PUT /api/v1/settings/service`
- **Corpo da Requisição (`PUT`):**
  ```json
  {
    "responseGoalSec": 180,
    "alertSec": 180,
    "urgentSec": 300,
    "confirmationWindowSec": 180,
    "timezone": "America/Sao_Paulo",
    "dayCutoffHour": 5,
    "showWaitTimeToCustomer": true
  }
  ```
- **Regras de Negócio e Restrições:**
  - `alertSec` deve ser estritamente menor que `urgentSec`.
  - `dayCutoffHour` define a virada do dia operacional (ex: 5 = 05:00 da manhã).
  - `showWaitTimeToCustomer`: Se `true`, a tela do cliente exibe o tempo decorrido desde a abertura do chamado.
- **Resposta de Sucesso (`200 OK`):** Objeto com as configurações consolidadas.
- **Evidência de Código:** [`SettingsController.getServiceSettings`](../../src/modules/tenancy/presentation/SettingsController.ts#L104-L111), [`SettingsController.updateServiceSettings`](../../src/modules/tenancy/presentation/SettingsController.ts#L113-L144).

---

### 4.2. Aparência Visual e Marca (`Appearance`)

- **Rotas:**
  - `GET /api/v1/settings/appearance`
  - `PUT /api/v1/settings/appearance`
  - `POST /api/v1/settings/appearance/reset`
- **Corpo da Requisição (`PUT`):**
  ```json
  {
    "name": "Bar & Restaurante TapMesa",
    "description": "O melhor chopp e petiscos da cidade",
    "backgroundType": "color",
    "backgroundValue": "#1A1A24",
    "colors": {
      "primary": "#E11D48",
      "background": "#0F172A",
      "surface": "#1E293B",
      "text": "#F8FAFC"
    },
    "texts": {
      "welcomeTitle": "Bem-vindo à nossa mesa!",
      "callWaiterButton": "Chamar Garçom",
      "requestBillButton": "Pedir a Conta"
    },
    "socials": {
      "instagram": "instagram.com/tapmesa",
      "googleReview": "https://g.page/r/tapmesa/review",
      "wifiName": "TapMesa_Clientes",
      "wifiPassword": "tapmesacliente"
    }
  }
  ```
- **Regras do `PUT` (todos os campos são opcionais):**
  - `colors` e `texts` são **mesclados** com os valores atuais. Cores em hexadecimal; textos até 200 caracteres e não vazios.
  - Chaves canônicas de `texts`: `welcomeTitle`, `callWaiterButton`, `requestBillButton`, `notePlaceholder`, `pendingMessage`, `attendedPrompt`, `confirmButton`, `contestButton`, `cancelButton`.
  - `socials` **substitui o objeto inteiro** (chave ausente ou vazia é removida). Links recebem `https://` quando faltar e só aceitam http(s); `wifiName` e `wifiPassword` são texto puro (até 100 caracteres).
- **Resposta de Sucesso (`200 OK`):** a aparência completa (`RestaurantAppearance` em `TYPESCRIPT_CONTRACTS.md`).
- **Evidência de Código:** [`SettingsController.getAppearance`](../../src/modules/tenancy/presentation/SettingsController.ts#L146-L186).

---

### 4.3. Upload de Logo e Imagem de Fundo

- **Rotas:**
  - `POST /api/v1/settings/appearance/logo`
  - `POST /api/v1/settings/appearance/background`
- **Formato:** `multipart/form-data` com campo `file`.
- **Restrições:** máximo de 2 MB por imagem (`400 FILE_TOO_LARGE`; o transporte multipart corta em 10 MB). Tipos aceitos: JPEG, PNG e WebP, validados pelos magic bytes do arquivo. **SVG não é aceito** (`400 INVALID_IMAGE_FORMAT`). Sem arquivo: `400 MISSING_FILE`. A imagem é reprocessada (máx. 1024 px) e o arquivo anterior é apagado.
- **Resposta de Sucesso (`200 OK`):** a aparência completa atualizada (mesmo formato de `GET /settings/appearance`). No logo, `logoUrl` aponta para o novo arquivo; no fundo, `backgroundType` passa a `"image"` e `backgroundValue` recebe a URL.
- **URL pública:** com `STORAGE_DRIVER=s3`, `{S3_ENDPOINT}/{S3_BUCKET}/{arquivo}`. Com `STORAGE_DRIVER=local`, `{PUBLIC_APP_URL}/storage/{arquivo}`; nesse modo a API **não** serve `/storage`, então o arquivo só abre se algo (proxy do front ou servidor estático) servir a pasta `storage/` da API nesse caminho.
- **Evidência de Código:** [`SettingsController.uploadLogo`](../../src/modules/tenancy/presentation/SettingsController.ts#L221-L257).

---

### 4.4. Restaurante do Contexto Atual

- **Rotas:**
  - `GET /api/v1/restaurant/current`
  - `GET /api/v1/restaurant/:restaurantId` (o `TenantGuard` responde `403 Forbidden` se o ID não for o do token, exceto para ADMIN)
- **Perfis:** OWNER e WAITER (exige contexto de restaurante).
- **Resposta de Sucesso (`200 OK`):**
  ```json
  {
    "id": "9e942f92-24f9-468a-b326-615ead1eabed",
    "name": "Churrascaria Boi Bravo",
    "status": "ACTIVE",
    "createdAt": "2026-10-22T19:57:44.399Z",
    "impersonatedBy": null
  }
  ```
  _(`impersonatedBy` traz o ID do ADMIN quando o token é de impersonação.)_
- **Evidência de Código:** [`TenantRestaurantController`](../../src/modules/tenancy/presentation/TenantRestaurantController.ts).

### 4.5. Verificação de Contexto Multi-tenant

- **Método / Rota:** `POST /api/v1/restaurant/context-check`
- **Finalidade:** Diagnóstico: devolve o contexto que o back resolveu a partir do token (útil para validar impersonação).
- **Resposta de Sucesso (`200 OK`):**
  ```json
  {
    "tenantId": "9e942f92-24f9-468a-b326-615ead1eabed",
    "userId": "b722c1d8-2a63-4dc7-b7e3-e5f330c264ac",
    "role": "OWNER",
    "impersonatedBy": null
  }
  ```
- **Evidência de Código:** [`TenantRestaurantController.contextCheck`](../../src/modules/tenancy/presentation/TenantRestaurantController.ts).

---

## 5. Módulo: Notificações e Alertas (`Notifications`)

Controlador: [`NotificationsController`](../../src/modules/notifications/presentation/NotificationsController.ts)  
Perfis permitidos: `OWNER`, `ADMIN`  
Contexto de Tenant: Obrigatório (`@RequireTenant()`)

### 5.1. Preferências de Notificação

- **Rotas:**
  - `GET /api/v1/restaurant/notifications/settings`
  - `PATCH /api/v1/restaurant/notifications/settings`
  - `PUT /api/v1/restaurant/notifications/settings` (alias para PATCH)
- **Corpo da Requisição (`PATCH`/`PUT`):**
  ```json
  {
    "emailSummaryEnabled": true,
    "summaryEmailRecipient": "proprietario@restaurante.com.br",
    "urgentAlertEnabled": true,
    "urgentAlertRecipient": "gerente@restaurante.com.br",
    "alertCooldownMinutes": 15
  }
  ```
- **Resposta de Sucesso (`200 OK`):** Objeto com as preferências atualizadas.
- **Evidência de Código:** [`NotificationsController.getSettings`](../../src/modules/notifications/presentation/NotificationsController.ts#L48-L62), [`NotificationsController.updateSettings`](../../src/modules/notifications/presentation/NotificationsController.ts#L64-L88).

---

### 5.2. Disparo de Resumo Diário por E-mail

- **Método / Rota:** `POST /api/v1/restaurant/notifications/send-daily-summary`
- **Finalidade:** Disparo manual ou agendado do e-mail com resumo analítico do dia operacional.
- **Corpo da Requisição:**
  ```json
  {
    "operationalDay": "2026-10-20",
    "recipientEmail": "proprietario@restaurante.com.br"
  }
  ```
- **Resposta de Sucesso (`201 Created`):** `{ "sent": true, "recipient": "...", "subject": "[TapMesa] Resumo do Dia — ...", "operationalDay": "2026-10-20" }`
- **Atenção:** o adaptador de e-mail atual é `InMemoryEmailSender`; a resposta indica `sent: true`, mas nenhum e-mail sai do servidor até existir um adaptador SMTP/provedor real.
- **Evidência de Código:** [`NotificationsController.sendDailySummary`](../../src/modules/notifications/presentation/NotificationsController.ts#L99-L162).

---

### 5.3. Disparo de Alerta de Urgência

- **Método / Rota:** `POST /api/v1/restaurant/notifications/send-urgent-alert`
- **Corpo da Requisição:**
  ```json
  {
    "tableNumber": 7,
    "callType": "WAITER",
    "waitDurationSec": 360,
    "urgentThresholdSec": 300,
    "note": "Mesa com crianças solicitando atendimento",
    "force": false
  }
  ```
- **Resposta de Sucesso (`201 Created`):** `{ "sent": true, "recipient": "...", "subject": "...", "tableNumber": 7, "waitDurationSec": 360 }`. Também emite o evento SSE `alert.raised` no painel. Mesma ressalva do item 5.2 sobre o envio real de e-mail.
- **Regras:** Se `force: false` e um alerta recente foi emitido dentro do `alertCooldownMinutes`, a API rejeita com status `409 Conflict` (`ALERT_COOLDOWN_ACTIVE`).
- **Evidência de Código:** [`NotificationsController.sendUrgentAlert`](../../src/modules/notifications/presentation/NotificationsController.ts#L164-L208).

---

## 6. Módulo: Salão e Mesas (`DiningRoom`)

Controlador: [`TablesController`](../../src/modules/dining-room/presentation/TablesController.ts)  
Perfis permitidos: `OWNER`, `ADMIN`  
Contexto de Tenant: Obrigatório (`@RequireTenant()`)

### 6.1. Cadastrar Mesa(s)

- **Método / Rota:** `POST /api/v1/tables`
- **Finalidade:** Cadastra mesas unitárias ou em lote sequencial. Para cada mesa, gera um token público HMAC SHA-256 único e imutável.
- **Corpo da Requisição (`application/json`):**
  ```json
  {
    "startNumber": 1,
    "count": 10
  }
  ```
  _(Também aceita `quantity` como sinônimo de `count`)._
- **Resposta de Sucesso (`201 Created`):**
  ```json
  [
    {
      "id": "cdd268f3-b5b1-47c3-b0bc-35684929e9c4",
      "restaurantId": "23037aa0-94d2-4a84-ab18-af0251eff7ba",
      "number": 1,
      "token": "64WT9Q6BLS",
      "paused": false,
      "url": "https://app.tapmesa.com.br/m/64WT9Q6BLS",
      "createdAt": "2026-10-22T19:52:18.856Z"
    }
  ]
  ```
- **Erros Possíveis:**
  - `409 Conflict` (`DUPLICATE_TABLE_NUMBER`): Mesa(s) já existente(s). O payload de erro retorna a lista `duplicates: [1, 2]`.
- **Evidência de Código:** [`TablesController.createTables`](../../src/modules/dining-room/presentation/TablesController.ts#L69-L81).

---

### 6.2. Listar Mesas

- **Método / Rota:** `GET /api/v1/tables`
- **Resposta de Sucesso (`200 OK`):** Lista todas as mesas cadastradas, ordenadas pelo número.
- **Evidência de Código:** [`TablesController.listTables`](../../src/modules/dining-room/presentation/TablesController.ts#L83-L88).

---

### 6.3. Próximo Número Disponível

- **Método / Rota:** `GET /api/v1/tables/next-number`
- **Resposta de Sucesso (`200 OK`):** `{ "nextNumber": 11 }`.
- **Evidência de Código:** [`TablesController.getNextNumber`](../../src/modules/dining-room/presentation/TablesController.ts#L90-L95).

---

### 6.4. Visualização de Impressão em Lote

- **Método / Rota:** `GET /api/v1/tables/print`
- **Finalidade:** Retorna os dados estruturados de todas as mesas prontos para renderização em folha de impressão / display com QR Code em vetor SVG embutido.
- **Resposta de Sucesso (`200 OK`):**
  ```json
  {
    "restaurant": {
      "name": "Churrascaria Boi Bravo",
      "logoUrl": null
    },
    "tables": [
      {
        "id": "cdd268f3-b5b1-47c3-b0bc-35684929e9c4",
        "number": 1,
        "token": "64WT9Q6BLS",
        "paused": false,
        "url": "https://app.tapmesa.com.br/m/64WT9Q6BLS",
        "qrSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" ...>"
      }
    ]
  }
  ```
- **Evidência de Código:** [`TablesController.getPrintView`](../../src/modules/dining-room/presentation/TablesController.ts#L97-L102).

---

### 6.5. Download do QR Code de uma Mesa

- **Método / Rota:** `GET /api/v1/tables/:id/qr`
- **Query Params:** `format` (`png` padrão, ou `svg`).
- **Resposta de Sucesso (`200 OK`):** Stream binário da imagem com cabeçalho `Content-Disposition: inline; filename="mesa-1-qr.png"`.
- **Cabeçalho `X-Table-Url`:** URL pública canônica embutida no QR (`{PUBLIC_APP_URL}/m/{token}`), exposta via CORS (`Access-Control-Expose-Headers`). É exatamente o mesmo valor do campo `url` retornado em `GET /api/v1/tables`, na criação e na folha de impressão; o botão "Copiar link" do front deve usar esse valor em vez de montar a URL.
- **Evidência de Código:** [`TablesController.getTableQr`](../../src/modules/dining-room/presentation/TablesController.ts#L104-L121).

---

### 6.6. Pausar e Retomar Mesa

- **Rotas:**
  - `PATCH /api/v1/tables/:id/pause`
  - `PATCH /api/v1/tables/:id/resume`
- **Finalidade:** Quando uma mesa está pausada, clientes que lerem seu QR Code receberão a indicação de indisponibilidade e não poderão abrir chamados.
- **Resposta de Sucesso (`200 OK`):** Objeto da mesa com flag `paused: true/false`.
- **Evidência de Código:** [`TablesController.pauseTable`](../../src/modules/dining-room/presentation/TablesController.ts#L123-L141).

---

### 6.7. Excluir Mesa

- **Método / Rota:** `DELETE /api/v1/tables/:id`
- **Finalidade:** Remove a mesa do banco de dados, encerra eventuais conexões SSE abertas para ela e notifica a tela do cliente (`table.removed`).
- **Resposta de Sucesso (`204 No Content`).**
- **Evidência de Código:** [`TablesController.deleteTable`](../../src/modules/dining-room/presentation/TablesController.ts#L143-L174).

---

## 7. Módulo: Chamados - Tela Pública da Mesa (`ServiceCalls - Public`)

Controlador: [`PublicTablesController`](../../src/modules/service-calls/presentation/PublicTablesController.ts)  
Autenticação: Nenhuma / Pública (`@Public()`). Identificação via `:token` na rota.  
Guarda de proteção: `PublicTableRateLimitGuard` contra força bruta de tokens.

### 7.1. Conexão SSE em Tempo Real da Mesa

- **Método / Rota:** `GET /api/v1/public/tables/:token/stream`
- **Finalidade:** Canal unidirecional Server-Sent Events para atualização instantânea da interface do cliente.
- **Controle de Concorrência:** Máximo de 5 conexões simultâneas por IP e 10 conexões por mesa (evita esgotamento de sockets por abuso).
- **Cabeçalhos de Resposta:**
  - `Content-Type: text/event-stream`
  - `Cache-Control: no-cache, no-transform`
  - `Connection: keep-alive`
  - `X-Accel-Buffering: no`
- **Heartbeat:** Linha de comentário `: heartbeat\n\n` enviada a cada 25 segundos para manter a conexão ativa através de NATs, proxies reversos e firewalls.
- **Eventos Notificados** (nome exato do campo `event:` do SSE):
  - `snapshot`: Estado atual da mesa logo após conectar.
  - `call.opened`: Novo chamado aberto nesta mesa.
  - `call.acknowledged`: Garçom assumiu / está a caminho (T26).
  - `call.attended`: Garçom marcou como atendido (abre janela de confirmação).
  - `call.confirmed`: Atendimento confirmado pelo cliente (com `rating` opcional de 1 a 3).
  - `call.reopened`: Cliente contestou o atendimento ("Ainda não"); o chamado volta a `PENDING`.
  - `call.cancelled`: Chamado cancelado pelo cliente.
  - `call.expired`: Chamado expirado por atingir 20 min sem atendimento.
  - `call.closed`: Janela de confirmação encerrou sem resposta (`CLOSED_UNCONFIRMED`).
  - `table.removed`: Mesa removida pelo restaurante; o servidor encerra a conexão em seguida.
- **Observação:** pausar/retomar mesa não emite evento SSE; a mudança aparece na próxima leitura de `GET /public/tables/:token`.
- **Evidência de Código:** [`PublicTablesController.stream`](../../src/modules/service-calls/presentation/PublicTablesController.ts#L106-L197).

---

### 7.2. Obter Estado Inicial da Mesa

- **Método / Rota:** `GET /api/v1/public/tables/:token`
- **Finalidade:** Chamado ao carregar a página pelo QR Code. Retorna o número da mesa, personalização visual (cores, logo, textos), disponibilidade e chamados ativos.
- **Resposta de Sucesso (`200 OK`):**
  ```json
  {
    "tableNumber": 1,
    "appearance": {
      "name": "Churrascaria Boi Bravo",
      "description": null,
      "logoUrl": null,
      "backgroundType": "color",
      "backgroundValue": "#0f172a",
      "colors": {
        "primary": "#f97316",
        "background": "#0f172a",
        "surface": "#1e293b",
        "text": "#f8fafc"
      },
      "texts": {
        "welcomeTitle": "Bem-vindo!",
        "callWaiterButton": "Chamar Garçom",
        "requestBillButton": "Pedir a Conta",
        "notePlaceholder": "Observação opcional (ex.: trazer gelo)",
        "pendingMessage": "Seu chamado foi enviado. Aguarde o atendimento.",
        "attendedPrompt": "Você foi atendido?",
        "confirmButton": "Sim, fui atendido",
        "contestButton": "Ainda não",
        "cancelButton": "Cancelar chamado"
      },
      "socials": {}
    },
    "available": true,
    "unavailableReason": null,
    "message": null,
    "showWaitTimeToCustomer": false,
    "calls": [],
    "serverNow": "2026-10-22T19:52:18.971Z"
  }
  ```
- **Erros Possíveis:** `404 Not Found` (`TABLE_NOT_FOUND`).
- **Evidência de Código:** [`PublicTablesController.getTable`](../../src/modules/service-calls/presentation/PublicTablesController.ts#L199-L226).

---

### 7.3. Abrir Chamado (Chamar Garçom / Pedir Conta)

- **Método / Rota:** `POST /api/v1/public/tables/:token/calls`
- **Finalidade:** Solicita atendimento ou fechamento de conta.
- **Corpo da Requisição (`application/json`):**
  ```json
  {
    "type": "WAITER",
    "note": "Trazer o cardápio de sobremesas"
  }
  ```
  _(Campo `type` aceita `"WAITER"` ou `"BILL"`. Campo `note` é opcional, máximo de 150 caracteres após sanitização; acima disso retorna `400 INVALID_CALL_NOTE`)._
- **Comportamento Idempotente:**
  - Se NÃO houver chamado pendente do mesmo tipo nesta mesa: cria o registro no banco, emite evento em tempo real e retorna status `201 Created`.
  - Se JÁ HOUVER chamado pendente do mesmo tipo nesta mesa: não gera duplicata; retorna status `200 OK` com o chamado existente e a flag `"alreadyPending": true`.
- **Resposta de Sucesso:**
  ```json
  {
    "id": "51dde969-9431-472d-a28b-372e802d25b2",
    "type": "WAITER",
    "status": "PENDING",
    "note": "agua",
    "createdAt": "2026-10-22T19:52:18.993Z",
    "attendedAt": null,
    "acknowledgedAt": null,
    "rating": null,
    "confirmationDeadline": null,
    "reopenCount": 0,
    "alreadyPending": false,
    "serverNow": "2026-10-22T19:52:19.027Z"
  }
  ```
- **Erros Possíveis:** `400 Bad Request` (`TABLE_PAUSED`).
- **Evidência de Código:** [`PublicTablesController.openCall`](../../src/modules/service-calls/presentation/PublicTablesController.ts#L257-L290).

---

### 7.4. Cancelar Chamado

- **Método / Rota:** `POST /api/v1/public/tables/:token/calls/:callId/cancel`
- **Finalidade:** Permite ao cliente desistir da chamada enquanto ela estiver com status `PENDING`.
- **Resposta de Sucesso (`200 OK`):** Retorna o chamado com `status: CANCELLED`.
- **Erros Possíveis:** `400 Bad Request` (`INVALID_CALL_TRANSITION` caso já tenha sido atendido).
- **Evidência de Código:** [`PublicTablesController.cancelCall`](../../src/modules/service-calls/presentation/PublicTablesController.ts#L292-L315).

---

### 7.5. Confirmar Atendimento e Avaliação Rápida (T26)

- **Método / Rota:** `POST /api/v1/public/tables/:token/calls/:callId/confirm`
- **Finalidade:** Cliente confirma que o garçom esteve na mesa e finaliza o chamado com `status: CONFIRMED`. Pode opcionalmente submeter uma avaliação rápida de 1 a 3.
- **Corpo da Requisição (Opcional):**
  ```json
  {
    "rating": 3
  }
  ```
  _(Valores válidos para `rating`: `1` = Ruim, `2` = Regular, `3` = Bom. Se enviado qualquer outro valor, a API responde `400 Bad Request` com código `INVALID_RATING`)._
- **Resposta de Sucesso (`200 OK`):** Retorna o chamado atualizado.
- **Evidência de Código:** [`PublicTablesController.confirmCall`](../../src/modules/service-calls/presentation/PublicTablesController.ts#L317-L352).

---

### 7.6. Contestar Atendimento ("Garçom não veio")

- **Método / Rota:** `POST /api/v1/public/tables/:token/calls/:callId/contest`
- **Finalidade:** Cliente informa que o garçom marcou como atendido no painel mas não compareceu à mesa.
- **Regras:**
  - Reverte o status de `ATTENDED` de volta para `PENDING`.
  - Incrementa o contador `reopenCount` (máximo de 2 reaberturas).
  - No painel, o chamado volta a piscar em vermelho com destaque de contestação.
- **Resposta de Sucesso (`200 OK`):** Chamado em `PENDING` com `reopenCount: 1`.
- **Evidência de Código:** [`PublicTablesController.contestCall`](../../src/modules/service-calls/presentation/PublicTablesController.ts#L354-L377).

---

### 7.7. Listar Chamados Ativos da Mesa

- **Método / Rota:** `GET /api/v1/public/tables/:token/calls`
- **Finalidade:** Recarrega os chamados ativos da mesa sem baixar a aparência (ex.: após reconectar o SSE).
- **Autenticação:** Pública (`@Public()`), com o mesmo rate limit das demais rotas públicas.
- **Resposta de Sucesso (`200 OK`):**
  ```json
  [
    {
      "id": "4b7f8d63-f237-4544-a54a-36ba895f7344",
      "type": "WAITER",
      "status": "PENDING",
      "note": "Mais guardanapos, por favor",
      "createdAt": "2026-10-22T19:57:45.390Z",
      "attendedAt": null,
      "confirmationDeadline": null,
      "reopenCount": 0,
      "serverNow": "2026-10-22T19:57:45.453Z"
    }
  ]
  ```
- **Erros Possíveis:** `404 Not Found` (`TABLE_NOT_FOUND`).
- **Evidência de Código:** [`PublicTablesController`](../../src/modules/service-calls/presentation/PublicTablesController.ts).

---

## 8. Módulo: Chamados - Painel da Equipe em Tempo Real (`ServiceCalls - Panel`)

Controlador: [`PanelController`](../../src/modules/service-calls/presentation/PanelController.ts)  
Perfis autorizados: `WAITER`, `OWNER`, `ADMIN`  
Contexto de Tenant: Obrigatório (`@RequireTenant()`)

### 8.1. Gerar Ticket de Conexão SSE

- **Método / Rota:** `POST /api/v1/panel/stream-ticket`
- **Finalidade:** Como a API `EventSource` nativa dos navegadores não permite envio de headers customizados (`Authorization: Bearer ...`), o painel deve solicitar este ticket temporário assinado antes de abrir a conexão SSE.
- **Autenticação:** Obrigatória (`Bearer <accessToken>`).
- **Validade:** 60 segundos, uso estritamente único.
- **Resposta de Sucesso (`200 OK`):**
  ```json
  {
    "ticket": "8575a40b-7fc9-4fa2-b258-20d43a6c98aa",
    "expiresInSec": 60
  }
  ```
- **Evidência de Código:** [`PanelController.createStreamTicket`](../../src/modules/service-calls/presentation/PanelController.ts#L129-L143).

---

### 8.2. Conexão SSE do Painel

- **Método / Rota:** `GET /api/v1/panel/stream?ticket=<ticket>`
- **Finalidade:** Stream contínuo de eventos do salão para o painel de garçons/cozinha.
- **Autenticação:** Pública na rota, validada via query param `ticket`.
- **Snapshot Inicial:** Logo após o aperto de mão, o servidor envia imediatamente o evento `snapshot` contendo o estado completo da operação:
  ```
  event: snapshot
  data: {"activeCalls":[...],"recentCalls":[...],"thresholds":{"alertSec":180,"urgentSec":300},"serverNow":"..."}
  ```
- **Heartbeat:** Linha de comentário `: heartbeat\n\n` a cada 25 segundos.
- **Eventos:** os mesmos `call.*` e `table.removed` do canal da mesa, mais `alert.raised` (alerta de urgência, T25).
- **Evidência de Código:** [`PanelController.stream`](../../src/modules/service-calls/presentation/PanelController.ts#L145-L215).

---

### 8.3. Snapshot do Estado Atual via REST

- **Método / Rota:** `GET /api/v1/panel/state`
- **Finalidade:** Retorna o snapshot atual do painel via HTTP padrão (útil para fallback caso o SSE falhe).
- **Resposta de Sucesso (`200 OK`):** mesmo formato do evento `snapshot` (`PanelStateDto` em `TYPESCRIPT_CONTRACTS.md`): `activeCalls`, `recentCalls`, `thresholds { alertSec, urgentSec }` e `serverNow`.
- **Evidência de Código:** [`PanelController.getState`](../../src/modules/service-calls/presentation/PanelController.ts#L217-L224).

---

### 8.4. Listar Chamados Ativos

- **Método / Rota:** `GET /api/v1/panel/calls`
- **Cabeçalho Adicionado:** `X-Server-Now: 2026-10-20T19:30:00.000Z`.
- **Resposta de Sucesso (`200 OK`):** Lista de chamados com cronômetros calculáveis.
- **Evidência de Código:** [`PanelController.getCalls`](../../src/modules/service-calls/presentation/PanelController.ts#L226-L236).

---

### 8.5. Reconhecer / Assumir Chamado (Acknowledge / Assume)

- **Rotas:**
  - `POST /api/v1/panel/calls/:id/acknowledge`
  - `POST /api/v1/panel/calls/:id/assume` _(Etapa "Assumir" - T26)_
- **Finalidade:** Garçom clica em "Estou a caminho" ou "Assumir mesa". O backend registra o usuário que assumiu (`acknowledgedById`), a estampa de tempo (`acknowledgedAt`) e calcula o tempo de reação (`reactionTimeSec`).
- **Resposta de Sucesso (`200 OK`):**
  ```json
  {
    "id": "51dde969-9431-472d-a28b-372e802d25b2",
    "restaurantId": "23037aa0-94d2-4a84-ab18-af0251eff7ba",
    "tableId": "cdd268f3-b5b1-47c3-b0bc-35684929e9c4",
    "tableNumber": 1,
    "type": "WAITER",
    "status": "PENDING",
    "note": "agua",
    "createdAt": "2026-10-22T19:52:18.993Z",
    "originalCreatedAt": "2026-10-22T19:52:18.993Z",
    "acknowledgedAt": "2026-10-22T19:52:19.264Z",
    "acknowledgedById": "86b95b8f-049c-44df-96c2-5733bcb607dd",
    "reopenCount": 0,
    "reopened": false,
    "contested": false,
    "reactionTimeSec": 0,
    "alreadyAcknowledged": false,
    "serverNow": "2026-10-22T19:52:19.264Z"
  }
  ```
- **Evidência de Código:** [`PanelController.acknowledgeCall`](../../src/modules/service-calls/presentation/PanelController.ts#L238-L256), [`PanelController.assumeCall`](../../src/modules/service-calls/presentation/PanelController.ts#L258-L265).

---

### 8.6. Finalizar Atendimento (Attend)

- **Método / Rota:** `POST /api/v1/panel/calls/:id/attend`
- **Finalidade:** Garçom clica em "Atendido". Muda o status para `ATTENDED`, grava `attendedAt` e `attendedById`, e inicia o cronômetro da janela de confirmação do cliente.
- **Resposta de Sucesso (`200 OK`):**
  ```json
  {
    "id": "51dde969-9431-472d-a28b-372e802d25b2",
    "restaurantId": "23037aa0-94d2-4a84-ab18-af0251eff7ba",
    "tableId": "cdd268f3-b5b1-47c3-b0bc-35684929e9c4",
    "tableNumber": 1,
    "type": "WAITER",
    "status": "ATTENDED",
    "note": "agua",
    "createdAt": "2026-10-22T19:52:18.993Z",
    "originalCreatedAt": "2026-10-22T19:52:18.993Z",
    "acknowledgedAt": "2026-10-22T19:52:19.264Z",
    "acknowledgedById": "86b95b8f-049c-44df-96c2-5733bcb607dd",
    "firstAttendedAt": "2026-10-22T19:52:19.303Z",
    "attendedAt": "2026-10-22T19:52:19.303Z",
    "attendedById": "86b95b8f-049c-44df-96c2-5733bcb607dd",
    "rating": null,
    "reopenCount": 0,
    "reopened": false,
    "contested": false,
    "reactionTimeSec": 0,
    "executionTimeSec": 0,
    "alreadyAttended": false,
    "serverNow": "2026-10-22T19:52:19.303Z"
  }
  ```
- **Evidência de Código:** [`PanelController.attendCall`](../../src/modules/service-calls/presentation/PanelController.ts#L267-L285).

---

### 8.7. Chamados Recentemente Atendidos

- **Método / Rota:** `GET /api/v1/panel/calls/recent?limit=10`
- **Finalidade:** Lista os últimos chamados atendidos para exibição em gaveta de histórico recente do painel.
- **Evidência de Código:** [`PanelController.getRecentCalls`](../../src/modules/service-calls/presentation/PanelController.ts#L287-L302).

---

## 9. Módulo: Resumo do Dia e Métricas (`Analytics`)

Controlador: [`AnalyticsController`](../../src/modules/analytics/presentation/AnalyticsController.ts)  
Perfis permitidos: `OWNER`, `ADMIN`  
Contexto de Tenant: Obrigatório (`@RequireTenant()`)

### 9.1. Resumo Consolidado do Período

- **Método / Rota:** `GET /api/v1/analytics/summary`
- **Query Params:**
  - `from` (string formato `YYYY-MM-DD`, opcional)
  - `to` (string formato `YYYY-MM-DD`, opcional)
- **Resposta de Sucesso (`200 OK`):**
  ```json
  {
    "range": {
      "from": "2026-10-22",
      "to": "2026-10-22",
      "daysCount": 1
    },
    "summary": {
      "overview": {
        "totalCalls": 2,
        "statusCounts": {
          "pending": 0,
          "attended": 0,
          "confirmed": 1,
          "cancelled": 1,
          "expired": 0,
          "closed": 0
        },
        "attendedCount": 1,
        "expiredCount": 0,
        "cancelledCount": 1,
        "reopenedCount": 1,
        "responseTimes": {
          "averageResponseTimeSec": 0,
          "medianResponseTimeSec": 0,
          "p90ResponseTimeSec": 0,
          "maxWaitTimeSec": 0,
          "sampleCount": 1
        },
        "reactionTimes": {
          "averageResponseTimeSec": 0,
          "medianResponseTimeSec": 0,
          "p90ResponseTimeSec": 0,
          "maxWaitTimeSec": 0,
          "sampleCount": 1
        },
        "executionTimes": {
          "averageResponseTimeSec": 0,
          "medianResponseTimeSec": 0,
          "p90ResponseTimeSec": 0,
          "maxWaitTimeSec": 0,
          "sampleCount": 1
        },
        "ratings": {
          "1": 0,
          "2": 0,
          "3": 1,
          "total": 1,
          "average": 3
        },
        "percentageWithinTarget": 100,
        "confirmationRate": 100,
        "waiterCalls": 1,
        "billCalls": 1
      },
      "byType": {
        "waiter": {
          "totalCalls": 1,
          "statusCounts": {
            "pending": 0,
            "attended": 0,
            "confirmed": 1,
            "cancelled": 0,
            "expired": 0,
            "closed": 0
          },
          "attendedCount": 1,
          "expiredCount": 0,
          "cancelledCount": 0,
          "reopenedCount": 1,
          "responseTimes": {
            "averageResponseTimeSec": 0,
            "medianResponseTimeSec": 0,
            "p90ResponseTimeSec": 0,
            "maxWaitTimeSec": 0,
            "sampleCount": 1
          },
          "reactionTimes": {
            "averageResponseTimeSec": 0,
            "medianResponseTimeSec": 0,
            "p90ResponseTimeSec": 0,
            "maxWaitTimeSec": 0,
            "sampleCount": 1
          },
          "executionTimes": {
            "averageResponseTimeSec": 0,
            "medianResponseTimeSec": 0,
            "p90ResponseTimeSec": 0,
            "maxWaitTimeSec": 0,
            "sampleCount": 1
          },
          "ratings": {
            "1": 0,
            "2": 0,
            "3": 1,
            "total": 1,
            "average": 3
          },
          "percentageWithinTarget": 100,
          "confirmationRate": 100
        },
        "bill": {
          "totalCalls": 1,
          "statusCounts": {
            "pending": 0,
            "attended": 0,
            "confirmed": 0,
            "cancelled": 1,
            "expired": 0,
            "closed": 0
          },
          "attendedCount": 0,
          "expiredCount": 0,
          "cancelledCount": 1,
          "reopenedCount": 0,
          "responseTimes": {
            "averageResponseTimeSec": 0,
            "medianResponseTimeSec": 0,
            "p90ResponseTimeSec": 0,
            "maxWaitTimeSec": 0,
            "sampleCount": 0
          },
          "reactionTimes": {
            "averageResponseTimeSec": 0,
            "medianResponseTimeSec": 0,
            "p90ResponseTimeSec": 0,
            "maxWaitTimeSec": 0,
            "sampleCount": 0
          },
          "executionTimes": {
            "averageResponseTimeSec": 0,
            "medianResponseTimeSec": 0,
            "p90ResponseTimeSec": 0,
            "maxWaitTimeSec": 0,
            "sampleCount": 0
          },
          "ratings": {
            "1": 0,
            "2": 0,
            "3": 0,
            "total": 0,
            "average": null
          },
          "percentageWithinTarget": 0,
          "confirmationRate": 0
        }
      },
      "byHour": [
        {
          "hour": 20,
          "totalCalls": 0,
          "waiterCalls": 0,
          "billCalls": 0,
          "attendedCalls": 0,
          "averageResponseTimeSec": 0,
          "averageWaiterResponseTimeSec": 0,
          "averageBillResponseTimeSec": 0
        }
      ],
      "ranking": {
        "all": {
          "byVolume": [
            {
              "tableNumber": 1,
              "totalCalls": 1,
              "attendedCalls": 1,
              "averageResponseTimeSec": 0
            }
          ],
          "byResponseTime": [
            {
              "tableNumber": 1,
              "totalCalls": 1,
              "attendedCalls": 1,
              "averageResponseTimeSec": 0
            }
          ]
        },
        "waiter": {
          "byVolume": [
            {
              "tableNumber": 1,
              "totalCalls": 1,
              "attendedCalls": 1,
              "averageResponseTimeSec": 0
            }
          ],
          "byResponseTime": [
            {
              "tableNumber": 1,
              "totalCalls": 1,
              "attendedCalls": 1,
              "averageResponseTimeSec": 0
            }
          ]
        },
        "bill": {
          "byVolume": [
            {
              "tableNumber": 2,
              "totalCalls": 1,
              "attendedCalls": 0,
              "averageResponseTimeSec": 0
            }
          ],
          "byResponseTime": [
            {
              "tableNumber": 2,
              "totalCalls": 1,
              "attendedCalls": 0,
              "averageResponseTimeSec": 0
            }
          ]
        }
      }
    },
    "serverNow": "2026-10-22T19:52:19.442Z"
  }
  ```
- **Evidência de Código:** [`AnalyticsController.getSummary`](../../src/modules/analytics/presentation/AnalyticsController.ts#L43-L64).

---

### 9.2. Distribuição de Chamados por Hora (Picos)

- **Método / Rota:** `GET /api/v1/analytics/by-hour`
- **Finalidade:** Agrupa chamados nos 24 baldes horários (0h a 23h) para identificação visual de picos de atendimento no salão.
- **Resposta de Sucesso (`200 OK`):**
  ```json
  {
    "range": {
      "from": "2026-10-22",
      "to": "2026-10-22",
      "daysCount": 1
    },
    "byHour": [
      {
        "hour": 20,
        "totalCalls": 0,
        "waiterCalls": 0,
        "billCalls": 0,
        "attendedCalls": 0,
        "averageResponseTimeSec": 0,
        "averageWaiterResponseTimeSec": 0,
        "averageBillResponseTimeSec": 0
      }
    ],
    "serverNow": "2026-10-22T19:52:19.466Z"
  }
  ```
- **Evidência de Código:** [`AnalyticsController.getByHour`](../../src/modules/analytics/presentation/AnalyticsController.ts#L66-L87).

---

### 9.3. Ranking de Mesas

- **Método / Rota:** `GET /api/v1/analytics/tables-ranking`
- **Finalidade:** Retorna as mesas com maior demanda de chamados e as mesas com maior tempo médio de espera.
- **Resposta de Sucesso (`200 OK`):**
  ```json
  {
    "range": {
      "from": "2026-10-22",
      "to": "2026-10-22",
      "daysCount": 1
    },
    "ranking": {
      "all": {
        "byVolume": [
          {
            "tableNumber": 1,
            "totalCalls": 1,
            "attendedCalls": 1,
            "averageResponseTimeSec": 0
          }
        ],
        "byResponseTime": [
          {
            "tableNumber": 1,
            "totalCalls": 1,
            "attendedCalls": 1,
            "averageResponseTimeSec": 0
          }
        ]
      },
      "waiter": {
        "byVolume": [
          {
            "tableNumber": 1,
            "totalCalls": 1,
            "attendedCalls": 1,
            "averageResponseTimeSec": 0
          }
        ],
        "byResponseTime": [
          {
            "tableNumber": 1,
            "totalCalls": 1,
            "attendedCalls": 1,
            "averageResponseTimeSec": 0
          }
        ]
      },
      "bill": {
        "byVolume": [
          {
            "tableNumber": 2,
            "totalCalls": 1,
            "attendedCalls": 0,
            "averageResponseTimeSec": 0
          }
        ],
        "byResponseTime": [
          {
            "tableNumber": 2,
            "totalCalls": 1,
            "attendedCalls": 0,
            "averageResponseTimeSec": 0
          }
        ]
      }
    },
    "serverNow": "2026-10-22T19:52:19.491Z"
  }
  ```
- **Evidência de Código:** [`AnalyticsController.getTablesRanking`](../../src/modules/analytics/presentation/AnalyticsController.ts#L89-L110).

---

### 9.4. Histórico Paginado de Chamados

- **Método / Rota:** `GET /api/v1/analytics/calls`
- **Query Params:** `from`, `to`, `cursor`, `limit` (default 20), `type` (`WAITER`/`BILL`), `status`, `table` (número).
- **Resposta de Sucesso (`200 OK`):**
  ```json
  {
    "items": [
      {
        "id": "57e15f1a-0498-4458-876c-6d606b173e59",
        "tableNumber": 2,
        "type": "BILL",
        "status": "CANCELLED",
        "note": null,
        "createdAt": "2026-10-22T19:52:19.076Z",
        "acknowledgedAt": null,
        "firstAttendedAt": null,
        "attendedAt": null,
        "confirmedAt": null,
        "cancelledAt": "2026-10-22T19:52:19.104Z",
        "expiredAt": null,
        "closedAt": "2026-10-22T19:52:19.104Z",
        "rating": null,
        "reactionTimeSec": null,
        "executionTimeSec": null,
        "responseTimeSec": null,
        "resolutionTimeSec": null,
        "confirmationTimeSec": null,
        "reopenCount": 0,
        "contested": false
      }
    ],
    "nextCursor": "MTc5MjY5ODczOTA3Nnw1N2UxNWYxYS0wNDk4LTQ0NTgtODc2Yy02ZDYwNmIxNzNlNTk=",
    "totalCount": 2,
    "serverNow": "2026-10-22T19:52:19.514Z"
  }
  ```
- **Evidência de Código:** [`AnalyticsController.getCalls`](../../src/modules/analytics/presentation/AnalyticsController.ts#L112-L147).

---

### 9.5. Comparativo Operacional (Hoje vs Dias Anteriores)

- **Método / Rota:** `GET /api/v1/analytics/summary/compare`
- **Finalidade:** Compara automaticamente o dia de hoje com o dia anterior e com o mesmo dia da semana anterior.
- **Evidência de Código:** [`AnalyticsController.getCompare`](../../src/modules/analytics/presentation/AnalyticsController.ts#L149-L165).

---

### 9.6. Exportação CSV do Histórico

- **Método / Rota:** `GET /api/v1/analytics/export.csv`
- **Query Params:** `from`, `to`.
- **Cabeçalhos de Resposta:**
  - `Content-Type: text/csv; charset=utf-8`
  - `Content-Disposition: attachment; filename="historico-chamados-2026-10-20.csv"`
- **Evidência de Código:** [`AnalyticsController.exportCsv`](../../src/modules/analytics/presentation/AnalyticsController.ts#L167-L198).

---

## 10. Módulo: Plataforma e Observabilidade (`Observability`)

### 10.1. Healthchecks

- `GET /api/v1/health/live`: Liveness probe do processo. Retorna `200 OK` `{ "status": "ok" }`.
- `GET /api/v1/health/ready`: Readiness probe. Valida conexão com PostgreSQL e Redis. Se o banco cair, responde `503 Service Unavailable`.
- **Evidência de Código:** [`HealthController`](../../src/platform/health/health.controller.ts).

### 10.2. Métricas Prometheus

- `GET /metrics` e `GET /api/v1/metrics`: Formato texto padrão Prometheus v0.0.4 contendo latências HTTP, taxa de erros, conexões SSE ativas e métricas de negócio.
- **Evidência de Código:** [`MetricsController`](../../src/platform/metrics/presentation/MetricsController.ts).

### 10.3. Documentação OpenAPI

- `GET /api/v1/docs`: Interface visual HTML interativa.
- `GET /api/v1/docs/json` e `GET /openapi.json`: Especificação completa em JSON.
- `GET /api/v1/docs/yaml`: Especificação completa em YAML.
- **Evidência de Código:** [`OpenApiController`](../../src/platform/openapi/presentation/OpenApiController.ts).
