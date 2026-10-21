# ADR 0002: Divergências de Contrato e Integração com a API do Backend

- **Status:** Aceito
- **Data:** 21/10/2026
- **Contexto:** Análise minuciosa de `endpoint-inventory.json`, `openapi.json` e código-fonte auditado do back-end (`TapMesa-Back-End`) para garantir conformidade estrita e prevenir divergências em tempo de execução no front-end.

## Divergências e Resoluções

### 1. Limite de Caracteres da Observação

- **Documentação / Requisitos:** Requisitos v1.1 citava 150 caracteres; `API_REFERENCE.md` e DTO citavam 140 caracteres.
- **Back-end Real:** O schema de validação em `PublicTablesController.openCall` define estritamente `maxLength: 140`.
- **Decisão no Front-end:** Adotado o limite de **140 caracteres** em todos os inputs, textareas e schemas Zod do front-end.

### 2. Limite de Tamanho de Upload de Imagens (Logo e Fundo)

- **Documentação / Requisitos:** Alguns pontos da documentação citavam 10 MB.
- **Back-end Real:** Em `src/modules/tenancy/application/ports/ImageProcessor.ts`, a constante `MAX_IMAGE_UPLOAD_BYTES` define `2 * 1024 * 1024` (2 MB), rejeitando arquivos maiores com o erro `FILE_TOO_LARGE` ("O arquivo excede o tamanho máximo permitido de 2 MB."). Tipos permitidos: `image/jpeg`, `image/png` e `image/webp`.
- **Decisão no Front-end:** O front-end valida client-side o tamanho máximo de **2 MB** antes do envio e restringe a seleção a `.jpg`, `.jpeg`, `.png` e `.webp`, prevenindo erros 400/413 desnecessários.

### 3. Formato da Resposta de `/analytics/summary/compare`

- **Documentação / Requisitos:** Não documentado em detalhes em `TYPESCRIPT_CONTRACTS.md`.
- **Back-end Real:** `AnalyticsController.getCompare` retorna:
  ```json
  {
    "today": {
      "totalCalls": 0,
      "completedCalls": 0,
      "averageResponseTimeSec": 0
    },
    "previousDay": {
      "totalCalls": 0,
      "completedCalls": 0,
      "averageResponseTimeSec": 0
    },
    "comparison": {
      "callsDiffPercent": 0,
      "responseTimeDiffPercent": 0
    }
  }
  ```
- **Decisão no Front-end:** Tipado formalmente em `src/shared/types/api.ts` como `AnalyticsCompareResponse` e consumido diretamente no `StatCard` e na tela de analytics.

### 4. Rota `/restaurant/current`

- **Documentação / Requisitos:** Citada como pendência de confirmação.
- **Back-end Real:** `GET /api/v1/restaurant/current` existe, está mapeada no inventário (`TenantRestaurantController.getCurrent`) e retorna `RestaurantTenantInfo` com os dados e configurações do tenant autenticado.
- **Decisão no Front-end:** Utilizada como fonte oficial para dados do restaurante no shell e no dashboard.

### 5. Nomenclatura dos Eventos SSE e Emissão de `CALL_REOPENED`

- **Documentação / Requisitos:** `TYPESCRIPT_CONTRACTS.md` listava eventos em formato UPPERCASE (`CALL_CREATED`, `CALL_ATTENDED`, etc.).
- **Back-end Real:** `DomainToRealtimeEventHandler.ts` publica eventos com o nome do domínio: `call.opened`, `call.acknowledged`, `call.attended`, `call.confirmed`, `call.reopened`, `call.cancelled`, `call.expired`, `call.closed`, `table.removed` e `alert.raised`. O evento `call.reopened` é **efetivamente emitido**.
- **Decisão no Front-end:** O cliente SSE (`connectTableStream` e `connectPanelStream`) registra listeners tanto para os nomes pontuados (`call.opened`, `call.attended`, etc.) quanto para os nomes em caixa alta (`CALL_CREATED`, etc.), normalizando internamente para garantir 100% de compatibilidade e resiliência.

### 6. Exposição do Header `X-Server-Now` via CORS

- **Documentação / Requisitos:** A documentação sugeria sincronização via header `X-Server-Now`.
- **Back-end Real:** O middleware de CORS em `src/platform/bootstrap/configure-app.ts` não inclui `exposedHeaders: ['X-Server-Now']`.
- **Decisão no Front-end:** Conforme previsto na Seção 9 do plano, o front-end utiliza primariamente a propriedade `serverNow` (string ISO 8601) presente no corpo JSON de todas as respostas críticas (`PublicTableDto`, `PanelStateDto`, `PanelCallDto`, etc.) para a sincronização do relógio global (`syncClock`).
