# Alinhamento do Front-end com o Back-end — Lista de Mudanças (22/10/2026)

> **Para quem é:** o agente (ou dev) que vai alterar o repositório do front-end `TapMesa` (Next.js).
> **O que é:** cada divergência encontrada entre o front e a API real, com o arquivo a mudar, o que fazer e como confirmar. Foi levantada lendo o código do front e comparando com respostas reais da API em execução.
> **Referência completa da integração:** [`FRONTEND_INTEGRATION.md`](FRONTEND_INTEGRATION.md). **Tipos corretos:** [`TYPESCRIPT_CONTRACTS.md`](TYPESCRIPT_CONTRACTS.md).

Caminhos de arquivo são relativos à raiz do repositório do front. Números de linha são aproximados (versão do commit `7840238`).

## Como aplicar

1. Comece pelo item **F-00** (tipos). Muitos erros de compilação que surgirem depois dele apontam exatamente para o código que os itens seguintes corrigem.
2. Faça os itens **P0** primeiro: cada um quebra uma funcionalidade hoje. Os do fluxo do QR (F-01 a F-03) são os mais urgentes.
3. Não crie fallbacks para nomes antigos (`hasMore ?? ...`, `CALL_CREATED`, `qrCodeSvg || qrSvg`). O back não envia os nomes antigos; use só os nomes atuais.
4. Ao terminar, substitua a pasta `docs/api/` do front pela versão atual do back (F-25) e rode `npm run typecheck`, `npm run lint` e os testes.

---

## A. O que mudou no back-end (contexto)

| Mudança                                                                                                                  | Efeito no front                                                                                       |
| :----------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| QR Code aponta para `{PUBLIC_APP_URL}/m/{token}` (antes `/?m={token}`)                                                   | O front já redireciona `/?m=` → `/m/`. Usar `table.url` para o link (F-02).                           |
| `GET /tables/:id/qr` devolve o cabeçalho `X-Table-Url` (exposto via CORS)                                                | Opcional: ler a URL junto com a imagem.                                                               |
| Limites de requisição corrigidos: antes **todas as rotas** bloqueavam após 5 req/min por IP                              | Os `429` espúrios no painel, no dashboard e na tela da mesa param. O login continua limitado a 5/min. |
| `GET /admin/audit` aceita `limit`, `cursor` e filtros (antes qualquer parâmetro dava `400`)                              | A tela de auditoria passa a funcionar com paginação e filtros (F-14).                                 |
| `socials.wifiName` e `socials.wifiPassword` aceitos como texto (antes todo save com Wi-Fi dava `400`)                    | O formulário de aparência com Wi-Fi passa a salvar sem mudança no front.                              |
| Observação do chamado: limite oficial de **150** caracteres                                                              | F-03.                                                                                                 |
| Resumo diário por e-mail: uma vez por dia, após o fechamento do dia operacional; alerta usa o `urgentSec` do restaurante | Nenhuma mudança no front.                                                                             |
| Documentação da API desativada por padrão em produção (`DOCS_ENABLED`)                                                   | Não dependa de `/api/v1/docs` em produção.                                                            |
| Documentação (`docs/api/*`) reescrita a partir das respostas reais                                                       | Os documentos antigos que o front copiou estão errados (F-25).                                        |

---

## B. Correções no front-end

### F-00 · Substituir os tipos da API — P0

- **Arquivo:** `src/shared/types/api.ts`
- **Problema:** as interfaces foram escritas a partir de documentação antiga. Várias têm campos que a API não envia e não têm campos que ela envia. Ex.: `TableDto` sem `url`; `AttendantMetricsResponse.attendants` (real: `waiters`); `AnalyticsByHourResponse.hourly` (real: `byHour`); `PrintViewTable.qrCodeSvg` (real: `qrSvg`); `AnalyticsCallsResponse.hasMore` (não existe); `BackgroundType` com `"preset"` (não existe); `RealtimeEventMap` com eventos `CALL_*`/`TABLE_*` que nunca são enviados.
- **Fazer:** copiar as interfaces de `TYPESCRIPT_CONTRACTS.md` (seções 1 a 11) para este arquivo, mantendo os nomes exportados que o front já usa. Onde o front tem tipos que não estão no contrato, ajustar ao formato real:
  - `ResetTeamUserPasswordResponse` = `{ id: string; username: string; temporaryPassword: string }`
  - `ResetOwnerPasswordResponse` = `{ newPasswordPlain: string }`
  - `CreateRestaurantResponse` = `{ restaurantId: string; ownerUsername: string; ownerPasswordPlain: string }`
  - `ImpersonateResponse` = `{ accessToken: string; restaurantId: string; ownerId: string; ownerUsername: string; impersonatedBy: string }`
  - `AdminRestaurantItem` = `{ id: string; name: string; ownerUsername: string; createdAt: string; status: RestaurantStatus }`
  - `AdminAuditLogItem` = `{ id: string; at: string; action: string; actorUserId: string | null; restaurantId: string | null; target: string | null; ip: string | null; meta: Record<string, unknown> | null }`
  - `AdminAuditResponse` = `{ items: AdminAuditLogItem[]; nextCursor: string | null; totalCount: number }`
  - `CreatePublicCallRequest.note`: comentário "máx. 150".
  - Remover de `RealtimeEventMap` todas as chaves em maiúsculo (`CALL_CREATED`, `CALL_ASSUMED`, `TABLE_PAUSED`, `TABLE_RESUMED`, `TABLE_DELETED`...). Usar `PanelRealtimeEventMap`/`PublicTableRealtimeEventMap` do contrato.
- **Aceite:** `npm run typecheck` passa depois dos itens P0; nenhum campo do arquivo deixa de existir no contrato.

### F-01 · Folha de impressão A4 sem QR Code e sem nome/logo — P0 (fluxo do QR)

- **Arquivos:** `src/features/tables/ui/tables-print-view.tsx` (~151, ~288-294), `src/features/tables/ui/table-print-card.tsx` (~8-25)
- **Problema:** o card lê `table.qrCodeSvg`, mas a API envia `table.qrSvg`, então **o QR não é desenhado**. O nome e o logo vêm de `data.restaurantName`/`data.logoUrl`, mas a API envia `data.restaurant.name`/`data.restaurant.logoUrl` (cai no texto "TapMesa"). `data.primaryColor` não existe.
- **Resposta real de `GET /tables/print`:**
  ```json
  {
    "restaurant": { "name": "Churrascaria Boi Bravo", "logoUrl": null },
    "tables": [
      {
        "id": "…",
        "number": 1,
        "token": "64WT9Q6BLS",
        "paused": false,
        "url": "https://app.tapmesa.com.br/m/64WT9Q6BLS",
        "qrSvg": "<svg …>"
      }
    ]
  }
  ```
- **Fazer:** usar `table.qrSvg`, `data.restaurant.name` e `data.restaurant.logoUrl`. Para a cor, buscar `GET /settings/appearance` (`colors.primary`) ou manter a cor padrão. Exibir `table.url` abaixo do QR, se houver texto de link.
- **Aceite:** a folha mostra o QR de cada mesa, o nome real do restaurante e o logo (quando houver). Ler o QR impresso com o celular abre `{PUBLIC_APP_URL}/m/{token}`.

### F-02 · "Copiar link" e link exibido devem usar `table.url` — P0 (fluxo do QR)

- **Arquivos:** `src/features/tables/ui/tables-table.tsx` (~48-60, ~144), `src/features/tables/ui/table-qr-dialog.tsx` (~60-67)
- **Problema:** o link é montado com `window.location.origin + /m/ + token`. Se o dono acessa o painel por um endereço diferente do `PUBLIC_APP_URL` (ex.: `localhost` enquanto o QR usa o IP da rede ou o domínio), o link copiado é diferente do link impresso no QR.
- **Fazer:** usar `table.url` (vem em `GET /tables`, `POST /tables`, `PATCH .../pause|resume`) para copiar e para exibir. Remover `getTableUrl`/o cálculo com `origin`.
- **Aceite:** o texto copiado é idêntico ao conteúdo decodificado do QR da mesma mesa.

### F-03 · Limite da observação: 150 caracteres — P0

- **Arquivo:** `src/features/table-screen/ui/call-actions.tsx` (~102 `slice(0, 140)`, ~260 `maxLength={140}`)
- **Fazer:** trocar 140 por 150 nos dois lugares (de preferência numa constante `MAX_CALL_NOTE_LENGTH = 150`). Atualizar contadores/textos que mostrem "140".
- **Aceite:** é possível enviar 150 caracteres; o back aceita (`201`).

### F-04 · Chamado contestado não volta para a fila do painel — P0

- **Arquivo:** `src/features/panel/api/use-panel-stream.ts` (`handleReopened`, ~247-266)
- **Problema:** ao atender, o chamado sai de `calls` (fila) e vai para `recent`. Quando o cliente contesta ("Garçom não veio"), chega `call.reopened`, e o código faz `updateCall` em `calls`, onde o chamado não está mais. **O chamado só reaparece no painel após recarregar.** Além disso, `reopenCount: (data.reopenCount ?? 0) + 1` soma 1 a um valor que já chega atualizado.
- **Fazer:** em `call.reopened`, chamar `triggerDebouncedCallsRefresh()` (recarrega `GET /panel/calls`, que já traz o chamado com `reopened: true`) e remover/atualizar o item em `recent` (`confirmationStatus: "CONTESTED"`). Se mantiver a atualização local, usar `reopenCount: data.reopenCount` sem somar.
- **Aceite:** atender um chamado, contestar pela tela da mesa: em até 2 s ele volta para a fila do painel com o selo "Reaberto" e o `reopenCount` correto.

### F-05 · Item de "atendidos recentes" criado pelo SSE com tipo e mesa errados — P0

- **Arquivo:** `src/features/panel/api/use-panel-stream.ts` (`handleAttended`, ~186-209)
- **Problema:** o payload de `call.attended` não traz a mesa nem o tipo do chamado; `data.type` vale `"ATTENDED"` (tipo do evento). O item recente fica com `tableNumber: 0` e `type: "ATTENDED"`.
- **Fazer:** antes de `removeCall(callId)`, ler o chamado da store (`usePanelStore.getState().calls.find(c => c.id === callId)`) e copiar `tableNumber`, `type` e `note`. Se não estiver na store, recarregar `GET /panel/calls/recent`.
- **Aceite:** ao atender, a gaveta mostra a mesa e o ícone (garçom/conta) corretos.

### F-06 · Texto personalizado dos botões não chega ao cliente — P0

- **Arquivos:** `src/features/settings/ui/appearance-settings-form.tsx` (~95-99, ~174-175, ~230-231), `src/features/settings/ui/live-phone-preview.tsx` (~58-72, ~193, ~207), `src/features/table-screen/ui/call-actions.tsx` (~80-86)
- **Problema:** o formulário salva `texts.waiterButton` e `texts.billButton`. A tela do cliente lê primeiro `texts.callWaiterButton`/`texts.requestBillButton`, que o back sempre preenche com o padrão. Resultado: a prévia mostra o texto novo, mas **o cliente sempre vê "Chamar Garçom" / "Pedir a Conta"**.
- **Fazer:** usar as chaves canônicas em todo o front: `callWaiterButton`, `requestBillButton` (e as demais: `welcomeTitle`, `notePlaceholder`, `pendingMessage`, `attendedPrompt`, `confirmButton`, `contestButton`, `cancelButton`). Na tela do cliente, remover o fallback para `waiterButton`/`billButton`. Textos não podem ser enviados vazios (o back recusa): se o campo ficar vazio, não envie a chave.
- **Aceite:** alterar o texto do botão no painel do dono e abrir `/m/{token}`: o botão mostra o texto novo.

### F-07 · Senha nova do dono não aparece após o reset (admin) — P0

- **Arquivo:** `src/features/admin/ui/restaurants-manager.tsx` (~222)
- **Problema:** lê `res.temporaryPassword`; a API devolve `{ newPasswordPlain }`. A senha nova nunca é exibida e não fica salva em lugar nenhum, então o dono fica sem acesso.
- **Fazer:** exibir `res.newPasswordPlain` no diálogo de "senha exibida uma única vez".
- **Aceite:** "Redefinir senha do dono" mostra a senha; login com ela funciona.

### F-08 · Métricas por garçom sempre vazias — P0

- **Arquivos:** `src/features/team/ui/team-manager.tsx` (~293), `src/features/team/ui/attendant-metrics-view.tsx` (tipos de ordenação ~29-34 e colunas)
- **Problema:** usa `metricsData.attendants` (real: `waiters`) e campos inexistentes (`totalAttended`, `averageReactionTimeSec`, `averageExecutionTimeSec`, `averageRating`).
- **Resposta real:** `{ restaurantId, totalCallsAttended, waiters: [{ userId, username, totalCallsAttended, avgResponseTimeSec, fastestResponseSec, slowestResponseSec }] }`
- **Fazer:** passar `metricsData?.waiters ?? []` e trocar as colunas para: atendidos (`totalCallsAttended`), tempo médio (`avgResponseTimeSec`), mais rápido (`fastestResponseSec`), mais lento (`slowestResponseSec`). Remover a coluna de avaliação (a API não fornece por garçom).
- **Aceite:** com um garçom que atendeu chamados, a aba de métricas lista o garçom com números.

### F-09 · KPIs do Resumo do Dia com campos inexistentes — P0

- **Arquivo:** `src/features/analytics/ui/analytics-kpis.tsx` (~36, 67, 87, 134, 145-146, 163-164)
- **Trocar:** `completedCalls` → `attendedCount`; `cancelledCalls` → `cancelledCount`; `expiredCalls` → `expiredCount`; `ratings.totalRated` → `ratings.total`; `responseTimes.p95ResponseTimeSec` → não existe (usar `p90ResponseTimeSec` ou `maxWaitTimeSec`).
- **Disponíveis e ainda não usados:** `confirmationRate`, `reopenedCount`, `statusCounts`, `reactionTimes`/`executionTimes` (tempo até assumir / de assumir até atender), `ratings["1"|"2"|"3"]`.
- **Aceite:** com chamados no dia, nenhum card mostra 0/"—" quando há dados; a taxa de atendimento usa `attendedCount / totalCalls`.

### F-10 · Comparativo com ontem nunca aparece — P0

- **Arquivo:** `src/features/analytics/ui/analytics-kpis.tsx` (~45-56)
- **Problema:** espera `compare.comparison.callsDiffPercent`/`responseTimeDiffPercent`; a API devolve `{ today, yesterday, sameDayLastWeek, serverNow }`, cada um `{ day, metrics }`, e em `yesterday`/`sameDayLastWeek` um `delta` (hoje menos o dia, em valor absoluto).
- **Fazer:** calcular a variação percentual no front, ex.:
  ```ts
  const t = compare.today.metrics.overview,
    y = compare.yesterday.metrics.overview;
  const callsDiffPercent =
    y.totalCalls > 0
      ? ((t.totalCalls - y.totalCalls) / y.totalCalls) * 100
      : null;
  const avgT = t.responseTimes.averageResponseTimeSec,
    avgY = y.responseTimes.averageResponseTimeSec;
  const responseTimeDiffPercent =
    avgY > 0 ? ((avgT - avgY) / avgY) * 100 : null;
  ```
  Esconder o indicador quando o resultado for `null`.
- **Aceite:** com chamados hoje e ontem, os cards mostram a variação.

### F-11 · Gráfico por hora vazio — P0

- **Arquivos:** `src/features/analytics/ui/analytics-view.tsx` (~196), `src/features/analytics/ui/hourly-chart.tsx` (~54, 86, 163)
- **Trocar:** `byHourQuery.data?.hourly` → `byHourQuery.data?.byHour`; `averageWaitSec` → `averageResponseTimeSec`. Campos extras disponíveis: `waiterCalls`, `billCalls`, `attendedCalls`, `averageWaiterResponseTimeSec`, `averageBillResponseTimeSec`.
- **Aceite:** o gráfico mostra barras nas horas com chamados.

### F-12 · Ranking de mesas vazio — P0

- **Arquivo:** `src/features/analytics/ui/tables-ranking.tsx` (~20-40, ~95)
- **Problema:** lê `ranking.byVolume`/`ranking.byWaitTime`; a API envia `ranking.all|waiter|bill`, cada um `{ byVolume, byResponseTime }`, com `averageResponseTimeSec`.
- **Fazer:** usar `rankingData.ranking.all.byVolume` e `rankingData.ranking.all.byResponseTime`; trocar `averageWaitSec` por `averageResponseTimeSec`. Opcional: abas Garçom/Conta com `ranking.waiter`/`ranking.bill`.
- **Aceite:** com chamados no período, as duas listas aparecem.

### F-13 · Paginação e filtro da tabela de chamados — P0

- **Arquivos:** `src/features/analytics/ui/analytics-view.tsx` (~208), `src/features/analytics/ui/calls-table.tsx` (~36, 353-366), `src/shared/api/analytics.ts` (`AnalyticsCallsFilters`)
- **Problema:** usa `hasMore` (não existe), então o botão "próxima página" fica sempre desabilitado. O filtro de mesa se chamaria `tableNumber`, mas o parâmetro da API é `table`.
- **Fazer:** `hasMore = data.nextCursor !== null`; mostrar `totalCount` se útil. Em `AnalyticsCallsFilters`, renomear para `table` (ou mapear `tableNumber` → `table` ao montar `params`).
- **Aceite:** com mais de 20 chamados, a segunda página carrega; o filtro por mesa restringe os resultados.

### F-14 · Auditoria (admin): data, papel e paginação — P0

- **Arquivos:** `src/features/admin/ui/audit-logs-manager.tsx` (~68, 93, 265, 275, 360, 372, 382-386, 438, 467), `src/shared/api/admin.ts` (`listAdminAuditLogs`)
- **Problema:** usa `log.timestamp` (real: `log.at`), `log.actorRole` (não existe) e `data.hasMore` (não existe).
- **Fazer:** data/hora a partir de `at`; remover "Papel" ou trocar por `target`/`ip`; `hasNextPage = data.nextCursor !== null`. O back agora aceita `limit`, `cursor`, `restaurantId`, `action`, `actorUserId` (IDs em UUID; ID inválido dá `400`).
- **Aceite:** a lista mostra data/hora corretas e a navegação entre páginas funciona.

### F-15 · Botão "Testar alerta urgente" sempre falha — P0

- **Arquivos:** `src/shared/api/notifications.ts` (`sendUrgentAlertTest`, `sendDailySummaryTest`), `src/features/settings/ui/notifications-settings-form.tsx` (~187-215)
- **Problema:** `POST /restaurant/notifications/send-urgent-alert` é enviado sem corpo; a API exige `{ tableNumber, callType, waitDurationSec, urgentThresholdSec }` e responde `400`. Os tipos de resposta (`{ success, message }`) também não existem.
- **Fazer:**
  ```ts
  api.post('/restaurant/notifications/send-urgent-alert', {
    tableNumber: 1,
    callType: 'WAITER',
    waitDurationSec: 360,
    urgentThresholdSec: 300,
    force: true,
  });
  ```
  Tipos de resposta: resumo `{ sent: boolean; recipient: string; subject: string; operationalDay: string }`; alerta `{ sent: boolean; recipient: string; subject: string; tableNumber: number; waitDurationSec: number }`. Ambos respondem `201`.
  Ajustar o toast: o back ainda **não envia e-mail de verdade** (adaptador em memória). Use algo como "Teste registrado para {recipient}. O envio real de e-mail ainda não está ativo." em vez de "enviado com sucesso".
- **Aceite:** os dois botões de teste retornam sucesso e o toast não afirma que o e-mail chegou.

### F-16 · Lista de restaurantes (admin): contagens inexistentes — P1

- **Arquivos:** `src/shared/api/admin.ts` (`listAdminRestaurants`), `src/features/admin/ui/restaurants-manager.tsx` (~440-447, ~599)
- **Problema:** a API não envia `tablesCount`/`usersCount` (o front mostra sempre 0). A lista vem em `data` e `nextCursor` **some** na última página (não vem `null`).
- **Fazer:** remover as colunas de mesas/usuários (ou mostrar `ownerUsername` e `createdAt`); `hasMore = Boolean(raw.nextCursor)`. Remover os ramos de compatibilidade com `items`/array puro.
- **Aceite:** a lista não exibe contagens falsas; a paginação para na última página.

### F-17 · Painel: tratar `table.removed` e `alert.raised` — P1

- **Arquivo:** `src/features/panel/api/use-panel-stream.ts`
- **Fazer:** `table.removed` (`{ tableId, tableNumber, occurredAt }`): remover da fila os chamados dessa mesa (`PanelCallDto.tableId`). `alert.raised` (`{ tableNumber, callType, waitDurationSec, ... }`): toast/som de urgência. Remover os listeners de nomes em maiúsculo (`CALL_CREATED`, `CALL_ACKNOWLEDGED`, `CALL_ASSUMED`, `CALL_ATTENDED`, `CALL_CONFIRMED`, `CALL_CLOSED_UNCONFIRMED`, `CALL_REOPENED`, `CALL_CANCELLED`, `CALL_EXPIRED`).
- **Aceite:** excluir uma mesa com chamado pendente remove o card do painel sem recarregar.

### F-18 · Tela da mesa: eventos inexistentes e excesso de GET — P1 (fluxo do QR)

- **Arquivo:** `src/features/table-screen/api/use-table-stream.ts`
- **Problema:**
  1. Escuta `TABLE_PAUSED`, `TABLE_RESUMED`, `TABLE_DELETED` e os `CALL_*` em maiúsculo, que nunca chegam.
  2. Cada evento e cada `onopen` chama `invalidateQueries(publicTable)`, ou seja, um novo `GET /public/tables/:token`. Todos os clientes de um restaurante normalmente saem pelo mesmo IP, e o back aceita **60 GETs públicos por minuto por IP somando todas as mesas** (e 10 POSTs). Num restaurante cheio isso gera `429` para os clientes.
- **Fazer:**
  - Remover os listeners inexistentes. Pausa da mesa: tratar o `400 TABLE_PAUSED` ao chamar (já tratado em `call-actions.tsx`).
  - Atualizar o estado local a partir do evento (já é feito para `call.attended`/`call.confirmed`; fazer também para `call.reopened` → `PENDING`, `call.cancelled`/`call.expired`/`call.closed` → remover da lista).
  - Recarregar só em reconexão (não no primeiro `onopen`) e usar `GET /public/tables/:token/calls` (só chamados) com debounce, em vez de `GET /public/tables/:token`.
  - Enviar `X-Device-Id` (UUID persistido em `localStorage`) nos `POST` públicos.
- **Aceite:** abrir a mesa, chamar, ser atendido e confirmar gera no máximo 2 GETs públicos (carga inicial e, se houver, uma reconexão).

### F-19 · Upload de imagem: limite e formatos — P1

- **Arquivo:** `src/features/settings/ui/appearance-settings-form.tsx` (~256-259, ~301-304, ~597)
- **Problema:** o front valida 10 MB; o back recusa acima de **2 MB** (`400 FILE_TOO_LARGE`).
- **Fazer:** validar 2 MB e atualizar o texto de ajuda ("PNG, JPG ou WebP de até 2 MB"). Manter `accept="image/png,image/jpeg,image/webp"` (SVG é recusado pelo back). Mapear os códigos `FILE_TOO_LARGE`, `INVALID_IMAGE_FORMAT` e `MISSING_FILE` para mensagens.
- **Observação:** com `STORAGE_DRIVER=local` a imagem enviada não é servida (pendência do back, seção C). Não tente contornar no front.
- **Aceite:** arquivo de 3 MB é barrado no front com mensagem clara; 1 MB PNG sobe e a prévia atualiza.

### F-20 · `socials` é substituído inteiro a cada save — P1

- **Arquivo:** `src/features/settings/ui/appearance-settings-form.tsx` (~177-180, ~233-236, ~355)
- **Problema:** o `PUT /settings/appearance` troca o objeto `socials` inteiro. O formulário só conhece `instagram`, `wifiName` e `wifiPassword`; qualquer outro link salvo antes (ex.: `googleReview`, `whatsapp`) é apagado no próximo save.
- **Fazer:** ao salvar, mesclar com `appearance.socials` atual (`{ ...appearance.socials, ...formSocials }`), mandando string vazia só para o que o usuário apagou. Se o requisito RF-D12 (links sociais e Google) for usado, adicionar os campos `googleReview`, `whatsapp`, `website`.
- **Aceite:** salvar o formulário não remove links que não aparecem nele.

### F-21 · Impersonação: nome do restaurante — P2

- **Arquivo:** `src/features/admin/ui/restaurants-manager.tsx` (~140), `src/features/auth/model/auth-store.ts` (~98)
- **Problema:** usa `res.restaurantName`, que não vem na resposta. O cabeçalho já cai em `GET /restaurant/current`, então funciona; mas `targetRestaurantName` fica `undefined`.
- **Fazer:** passar o nome da linha da tabela (`restaurant.name`) que o admin clicou.

### F-22 · `/auth/me` não traz `username` — P2

- **Arquivos:** `src/shared/api/auth.ts` (`getMe`), `src/features/auth/ui/auth-provider.tsx` (~45), `src/features/auth/ui/login-form.tsx` (~99)
- **Problema:** `/auth/me` devolve só `{ sub, role, rid, imp?, iat, exp }`. No login o front preenche `username` com o digitado; ao recarregar a página, `username` some.
- **Fazer:** guardar o username do login em `sessionStorage` e reaproveitar no `auth-provider`, ou não exibir o username. Remover os campos `id`/`restaurantId` "normalizados" se não forem usados (usar `sub`/`rid`).

### F-23 · Erros: códigos e status — P2

- **Arquivos:** `src/shared/messages/errors.ts`, `src/shared/api/problem-details.ts`
- **Fazer:**
  - `ACCOUNT_LOCKED` vem com status **401** (o front já trata pelo `code`; não dependa do status 403).
  - Impersonar restaurante suspenso devolve `403 RESTAURANT_SUSPENDED` (o código `CANNOT_IMPERSONATE_SUSPENDED_RESTAURANT` não existe; pode remover).
  - Erros de validação (`400`, `title: "Validation Error"`) não têm `code`: exiba `detail`.
  - Adicionar mensagens para `INVALID_CALL_NOTE`, `FILE_TOO_LARGE`, `INVALID_IMAGE_FORMAT`, `ALERT_COOLDOWN_ACTIVE`, `DATE_RANGE_EXCEEDS_LIMIT` (lista completa em `FRONTEND_INTEGRATION.md`, seção 3).

### F-24 · Tipos de cor de fundo — P2

- **Arquivo:** `src/shared/types/api.ts`, componentes que tratam `backgroundType`
- **Fazer:** `BackgroundType = "color" | "image"`. Remover qualquer ramo para `"preset"`.

### F-25 · Documentação copiada no front — P2

- **Pasta:** `docs/api/` do front
- **Problema:** é uma cópia antiga dos documentos do back, com contratos e eventos errados (foi a origem de vários itens acima).
- **Fazer:** substituir pela pasta `docs/api/` atual do back-end (incluindo este arquivo e `FRONTEND_INTEGRATION.md`).

---

## C. Pendências do back-end (não contornar no front)

| Pendência                                                                      | Efeito visível no front                                                                |
| :----------------------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| Sem provedor de e-mail (resumo e alertas não saem do servidor)                 | Botões de teste e preferências funcionam, mas nenhum e-mail chega.                     |
| Com `STORAGE_DRIVER=local`, `/storage/...` não é servido                       | Logo e imagem de fundo enviados aparecem quebrados em dev.                             |
| Limites públicos por IP (10 POST/min, 60 GET/min) contam o restaurante inteiro | Em restaurante cheio, clientes podem receber `429`. Reduzir requisições (F-18) mitiga. |
| `/auth/me` sem `username`                                                      | Ver F-22.                                                                              |
| Sem exportação em PDF (RF-R10)                                                 | Só CSV.                                                                                |

---

## D. Verificação final

1. `npm run typecheck`, `npm run lint` e a suíte de testes do front passam.
2. Fluxo do QR, com o back rodando:
   - Dashboard → Mesas: "Copiar link" copia exatamente o conteúdo do QR (F-02).
   - Folha A4 mostra os QR Codes e o nome do restaurante (F-01).
   - Celular lê o QR → `/m/{token}` abre sem login; chamar garçom com observação de 150 caracteres funciona (F-03).
   - Painel recebe o chamado; atender mostra mesa e tipo corretos na gaveta (F-05); contestar no celular devolve o chamado à fila (F-04); confirmar com avaliação fecha.
3. Resumo do Dia com dados: KPIs, comparativo, gráfico por hora, ranking e paginação preenchidos (F-09 a F-13).
4. Equipe → métricas lista os garçons (F-08). Admin → reset de senha do dono mostra a senha (F-07); auditoria pagina (F-14).
5. Configurações → texto do botão alterado aparece na tela do cliente (F-06); salvar com Wi-Fi funciona; testar alerta urgente responde sucesso (F-15).
