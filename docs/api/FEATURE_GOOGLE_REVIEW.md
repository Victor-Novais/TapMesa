# Avaliação no Google após o pagamento da conta — Especificação para o Front-end

> **Para quem é:** o agente de IA (ou dev) que vai implementar esta funcionalidade no repositório do front-end `TapMesa` (Next.js).
> **Estado:** back-end pronto e testado (27/10/2026). Front-end **não implementado**.
> **Este documento é autossuficiente:** contém a regra, o contrato exato da API, o estado atual do código do front, as tarefas, as restrições e os critérios de aceite. Leia inteiro antes de alterar código.

Caminhos de arquivo são relativos à raiz do repositório do front. A API usa o prefixo `/api/v1` (já incluído em `NEXT_PUBLIC_API_URL`).

---

## 1. O que a funcionalidade faz

1. O dono do restaurante cadastra, em **Configurações → Aparência**, o link de avaliação do restaurante no Google (ex.: `https://search.google.com/local/writereview?placeid=ChIJIX22n_zVbgcRWvn7GCPGrs4`).
2. O cliente, na tela da mesa (`/m/{token}`), toca em **"Pedir a conta"** (chamado do tipo `BILL`).
3. O garçom ou o dono recebe a conta, cobra e, no painel, toca no botão do card da conta. **Para conta, esse botão significa "pagamento recebido".**
4. A tela do cliente muda em tempo real para um agradecimento com o botão **"Avaliar no Google"**, que abre o link cadastrado.

Para conta, **não existe** a pergunta "Você foi atendido?" nem a opção "Ainda não" (contestação). Para chamar garçom (`WAITER`), nada muda.

---

## 2. Regras de negócio (implementadas no back)

| Regra                           | Detalhe                                                                                                                                                                                                                        |
| :------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Atendido" em conta = pagamento | `POST /panel/calls/:id/attend` num chamado `BILL` leva o chamado direto a `CONFIRMED`, com confirmação feita pela equipe (`confirmationKind = STAFF`).                                                                         |
| Eventos em tempo real           | O canal da mesa recebe `call.attended` e, em seguida, `call.confirmed` (mesmo instante).                                                                                                                                       |
| Sem pergunta ao cliente         | A conta não abre janela de confirmação, não é fechada automaticamente e **não pode ser contestada** (`400 INVALID_CALL_TRANSITION`).                                                                                           |
| Idempotência                    | Tocar de novo no botão de uma conta já paga devolve `200` com `alreadyAttended: true`.                                                                                                                                         |
| Conta paga visível por 15 min   | A conta `CONFIRMED` continua em `calls` de `GET /public/tables/:token`, de `GET /public/tables/:token/calls` e do snapshot SSE por **15 minutos** após o pagamento. O cliente vê o agradecimento mesmo se recarregar a página. |
| Link validado                   | `googleReviewUrl` só aceita endereços do Google ou um Place ID. O back devolve o link normalizado (sempre `https`).                                                                                                            |
| Novo pedido                     | Depois do pagamento, o cliente pode pedir a conta de novo (novo chamado `BILL`).                                                                                                                                               |
| Métricas                        | A taxa de confirmação do Resumo do Dia ignora contas confirmadas pela equipe. Nada a fazer no front.                                                                                                                           |

---

## 3. Contrato da API

### 3.1. Configurar o link — `GET` / `PUT /settings/appearance` (OWNER/ADMIN)

`RestaurantAppearance` ganhou o campo:

```ts
googleReviewUrl: string | null; // null = não configurado
```

`PUT /settings/appearance` aceita, junto com os demais campos (todos opcionais):

```ts
googleReviewUrl?: string | null;
```

| Valor enviado                                                                                                                           | Resultado                                                                                                                                                           |
| :-------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `"https://search.google.com/local/writereview?placeid=ChIJIX22n_zVbgcRWvn7GCPGrs4"`                                                     | salvo como está                                                                                                                                                     |
| `"search.google.com/local/writereview?placeid=ChIJ..."`                                                                                 | salvo com `https://`                                                                                                                                                |
| `"ChIJIX22n_zVbgcRWvn7GCPGrs4"` (só o Place ID)                                                                                         | salvo como `https://search.google.com/local/writereview?placeid=ChIJIX22n_zVbgcRWvn7GCPGrs4`                                                                        |
| `"https://g.page/r/<id>/review"`, `"maps.app.goo.gl/<id>"`, `"https://www.google.com/maps/..."`, `"https://www.google.com.br/maps/..."` | salvo (com `https://`)                                                                                                                                              |
| `""` ou `null`                                                                                                                          | remove o link (`googleReviewUrl: null`)                                                                                                                             |
| campo ausente                                                                                                                           | mantém o valor atual                                                                                                                                                |
| qualquer outro domínio, `javascript:`, texto solto                                                                                      | `400`, `code: "INVALID_APPEARANCE"`, `detail: "O link de avaliação deve ser um endereço do Google (ex.: https://search.google.com/local/writereview?placeid=...)."` |

- `googleReviewUrl` é um campo **próprio**, fora de `socials`. Salvar `socials` não altera o link e vice-versa.
- `POST /settings/appearance/reset` apaga o link (volta a `null`).
- A resposta do `PUT` é a aparência completa, com o link já normalizado: atualize o formulário com o valor devolvido.

Exemplo:

```http
PUT /api/v1/settings/appearance
Authorization: Bearer <token do dono>
Content-Type: application/json

{ "googleReviewUrl": "ChIJIX22n_zVbgcRWvn7GCPGrs4" }
```

```json
{
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
    "...": "..."
  },
  "socials": {},
  "googleReviewUrl": "https://search.google.com/local/writereview?placeid=ChIJIX22n_zVbgcRWvn7GCPGrs4"
}
```

### 3.2. Tela do cliente — `GET /public/tables/:token` (pública)

`appearance` traz o link (atenção: o nome do restaurante é `appearance.name`, não `restaurantName`):

```json
{
  "tableNumber": 1,
  "available": true,
  "unavailableReason": null,
  "message": null,
  "showWaitTimeToCustomer": false,
  "serverNow": "2026-10-27T20:15:30.000Z",
  "appearance": {
    "name": "Churrascaria Boi Bravo",
    "description": null,
    "logoUrl": null,
    "backgroundType": "color",
    "backgroundValue": "#0f172a",
    "colors": { "...": "..." },
    "texts": { "...": "..." },
    "socials": {},
    "googleReviewUrl": "https://search.google.com/local/writereview?placeid=ChIJIX22n_zVbgcRWvn7GCPGrs4"
  },
  "calls": [
    {
      "id": "51dde969-9431-472d-a28b-372e802d25b2",
      "type": "BILL",
      "status": "CONFIRMED",
      "note": null,
      "createdAt": "2026-10-27T20:12:01.000Z",
      "attendedAt": "2026-10-27T20:14:40.000Z",
      "acknowledgedAt": null,
      "rating": null,
      "confirmationDeadline": null,
      "reopenCount": 0,
      "serverNow": "2026-10-27T20:15:30.000Z"
    }
  ]
}
```

Uma conta com `type: "BILL"` e `status: "CONFIRMED"` em `calls` **é uma conta paga** (só aparece por 15 min após o pagamento).

`GET /public/tables/:token/calls` e o evento `snapshot` do SSE trazem a mesma lista `calls` (sem `appearance`).

### 3.3. Painel — `POST /panel/calls/:id/attend` (WAITER/OWNER/ADMIN)

Sem corpo. Para conta, a resposta já vem confirmada:

```json
{
  "id": "51dde969-9431-472d-a28b-372e802d25b2",
  "tableNumber": 1,
  "type": "BILL",
  "status": "CONFIRMED",
  "attendedAt": "2026-10-27T20:14:40.000Z",
  "attendedById": "86b95b8f-049c-44df-96c2-5733bcb607dd",
  "alreadyAttended": false,
  "serverNow": "2026-10-27T20:14:40.000Z",
  "...": "demais campos de AttendedCallDto"
}
```

Segundo toque: `200` com `alreadyAttended: true`. Em `GET /panel/calls/recent`, a conta paga aparece com `confirmationStatus: "CONFIRMED"` (nunca `AWAITING_CONFIRMATION`).

### 3.4. Tempo real — canal da mesa (`GET /public/tables/:token/stream`)

Sequência recebida pelo celular quando a equipe confirma o pagamento de uma conta:

```
event: call.attended
data: {"callId":"51dde969-…","tableId":"…","type":"ATTENDED","actorUserId":"…","occurredAt":"2026-10-27T20:14:40.000Z"}

event: call.confirmed
data: {"callId":"51dde969-…","tableId":"…","type":"CONFIRMED","occurredAt":"2026-10-27T20:14:40.000Z"}
```

- O payload **não** traz o tipo do chamado (`type` é o tipo do evento) e `actorUserId` pode faltar. Para saber se é conta, procure o `callId` na lista `calls` que o front já tem (o chamado foi criado com `type: "BILL"`).
- Os dois eventos chegam em sequência imediata. Para conta, trate só o `call.confirmed`.

### 3.5. Contestação

`POST /public/tables/:token/calls/:callId/contest` numa conta paga → `400` `INVALID_CALL_TRANSITION`. O front não deve oferecer essa ação para conta.

---

## 4. Estados da conta na tela do cliente

| `billCall.status`      | O que mostrar                                                                                                                                                         |
| :--------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (sem conta em `calls`) | Botão "Pedir a conta" disponível.                                                                                                                                     |
| `PENDING`              | Card de conta pedida, aguardando (comportamento atual).                                                                                                               |
| `ATTENDED`             | **Não mostrar nada novo.** Estado transitório de milissegundos entre `call.attended` e `call.confirmed`; mantenha o card de "aguardando" até chegar `call.confirmed`. |
| `CONFIRMED`            | Card de **pagamento confirmado**: agradecimento e, se `appearance.googleReviewUrl` não for `null`, o botão "Avaliar no Google".                                       |
| `EXPIRED`              | Comportamento atual (aviso de expirado).                                                                                                                              |

---

## 5. Estado atual do código do front (lido em 27/10/2026)

| Arquivo                                                            | Situação                                                                                                                                                                                                                  |
| :----------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/shared/types/api.ts`                                          | `RestaurantAppearance` e `PublicTableDto.appearance` **sem** `googleReviewUrl`.                                                                                                                                           |
| `src/features/settings/ui/appearance-settings-form.tsx`            | Não tem campo para o link. Envia `socials` com `instagram`, `wifiName`, `wifiPassword`.                                                                                                                                   |
| `src/features/panel/ui/panel-call-card.tsx` (~222-234)             | Botão sempre com o texto "Atendido" e `aria-label` "Concluir atendimento da mesa N". Já existe `isBill` (~54) e a variante `success` para conta.                                                                          |
| `src/features/table-screen/api/use-table-stream.ts` (~168-202)     | `call.attended` faz `patchCall(..., { status: "ATTENDED" })` **para qualquer tipo**: para conta, a tela mostraria "Você foi atendido?" até chegar `call.confirmed`. `call.confirmed` faz `status: "CONFIRMED"` (correto). |
| `src/features/table-screen/ui/call-actions.tsx` (~77-80, ~211-230) | Para conta: `isBillAttended` → `AttendedCallCard` (pergunta "Você foi atendido?") e `isBillConfirmed` → `ConfirmedCallCard`. `dismissedConfirmedIds` fica só em memória (`useState`).                                     |
| `src/features/table-screen/ui/confirmed-call-card.tsx` (~20-25)    | **Fecha sozinho após 3,5 s** (`setTimeout(onDismiss, 3500)`). Textos vêm de `UI_MESSAGES.calls.confirmedTitle`/`confirmedSubtitle` ("Atendimento confirmado!").                                                           |
| `src/shared/messages/ui.ts`                                        | Não tem textos de pagamento nem de avaliação no Google.                                                                                                                                                                   |

---

## 6. Tarefas no front

Siga a ordem. Cada tarefa tem o critério de pronto.

### T1. Tipos e API

- `src/shared/types/api.ts`:
  - `RestaurantAppearance`: adicionar `googleReviewUrl: string | null;`
  - `UpdateAppearanceRequest`: adicionar `googleReviewUrl?: string | null;`
  - `PublicTableDto.appearance`: adicionar `googleReviewUrl: string | null;` (e garantir que o nome do restaurante é lido de `name`).
- `src/shared/api/settings.ts`: nada muda (`updateAppearance` já envia o objeto); só o tipo.
- **Pronto quando:** `npm run typecheck` passa.

### T2. Campo nas Configurações → Aparência

- `src/features/settings/ui/appearance-settings-form.tsx`:
  - Novo campo de texto "Link de avaliação no Google" na seção de links/redes sociais, fora do grupo `socials` no estado do formulário (o valor vai em `googleReviewUrl` no topo do payload).
  - Valor inicial: `appearance.googleReviewUrl ?? ""`.
  - No envio: `googleReviewUrl: valor.trim()`. Campo vazio envia `""` (remove o link). Não valide o domínio no front além de um tamanho máximo (500): a validação oficial é do back; em `400 INVALID_APPEARANCE`, mostre o `detail` da resposta junto ao campo.
  - Após salvar, atualize o campo com `response.googleReviewUrl` (o back normaliza, ex.: Place ID vira link completo).
  - Texto de ajuda: "No seu Perfil da Empresa no Google, use 'Pedir avaliações' e cole o link aqui. Também aceita só o Place ID."
  - `live-phone-preview.tsx` (opcional): mostrar o botão "Avaliar no Google" na prévia quando houver link.
- **Pronto quando:** salvar `ChIJIX22n_zVbgcRWvn7GCPGrs4` mostra no campo o link completo; salvar `https://evil.com` mostra a mensagem de erro do back; apagar o campo e salvar remove o link.

### T3. Botão do painel para conta

- `src/features/panel/ui/panel-call-card.tsx`: quando `isBill`, o texto do botão é **"Pagamento recebido"** e o `aria-label` é "Confirmar pagamento da mesa N". Para `WAITER`, manter "Atendido".
- A chamada continua `onAttend(call.id)` → `POST /panel/calls/:id/attend`.
- `recent-calls-drawer.tsx`: para conta com `confirmationStatus: "CONFIRMED"`, exibir "Pago" em vez de "Confirmado" (opcional, recomendado).
- **Pronto quando:** o card de conta mostra "Pagamento recebido" e, ao tocar, sai da fila e aparece na gaveta como pago.

### T4. Stream da mesa: não mostrar "atendido" para conta

- `src/features/table-screen/api/use-table-stream.ts`, handler de `call.attended`: antes de `patchCall`, ler o chamado atual do cache (`queryClient.getQueryData<PublicTableDto>(queryKey)?.calls.find(c => c.id === data.callId)`). Se `type === "BILL"`, **não fazer nada** (o `call.confirmed` vem logo em seguida e já é tratado).
- `call.confirmed` já faz `patchCall(..., { status: "CONFIRMED" })`: manter.
- **Pronto quando:** ao confirmar o pagamento no painel, o celular vai direto do card "conta pedida" para o card de pagamento confirmado, sem exibir "Você foi atendido?".

### T5. Tela do cliente: card de pagamento confirmado com o botão do Google

- `src/features/table-screen/ui/call-actions.tsx`:
  - Remover a renderização de `AttendedCallCard` para conta (`billCall && isBillAttended`). Enquanto a conta estiver `ATTENDED` (transitório), continuar mostrando o card de pendente.
  - Para `billCall && isBillConfirmed`, renderizar o card de pagamento (abaixo) passando `googleReviewUrl={appearance.googleReviewUrl}`. Se `appearance` não estiver disponível neste componente, receba-o por prop a partir de `table-screen.tsx`/`table-screen-view.tsx`, que já têm o `PublicTableDto`.
  - Persistir `dismissedConfirmedIds` em `sessionStorage` (chave sugerida: `tapmesa:dismissed:${token}`), lendo no estado inicial e gravando ao fechar. Envolva leitura e escrita em `try/catch` (navegação privada pode bloquear). Assim o card não reaparece ao recarregar dentro dos 15 min depois que o cliente fechou.
- `src/features/table-screen/ui/confirmed-call-card.tsx` (ou um novo `paid-bill-card.tsx`, à sua escolha; mantenha o estilo existente):
  - Props novas: `variant: "waiter" | "bill"` e `googleReviewUrl?: string | null`.
  - `variant="bill"`: título "Pagamento confirmado", subtítulo "Obrigado pela visita!".
  - Se `variant="bill"` e houver `googleReviewUrl`:
    - texto curto: "Gostou? Sua avaliação no Google ajuda muito o restaurante.";
    - botão/link **"Avaliar no Google"**: `<a href={googleReviewUrl} target="_blank" rel="noopener noreferrer">`, altura mínima 44 px, cor primária do tema;
    - **não fechar automaticamente** (remover/desativar o `setTimeout` de 3,5 s nesse caso). Manter o botão "X" para fechar.
  - Sem `googleReviewUrl`, ou `variant="waiter"`: comportamento atual (agradece e fecha sozinho em 3,5 s).
- `src/shared/messages/ui.ts`: adicionar os textos acima (ex.: `calls.billPaidTitle`, `calls.billPaidSubtitle`, `calls.googleReviewPrompt`, `calls.googleReviewButton`) em vez de escrever no componente.
- **Pronto quando:** com link configurado, após o pagamento, o celular mostra o card com o botão, que continua visível até o cliente fechar e abre a página de avaliação em nova aba. Recarregar a página dentro de 15 min mostra o card de novo, a não ser que tenha sido fechado.

### T6. Testes

- Unitários/componentes (padrão do projeto):
  - `confirmed-call-card` (ou `paid-bill-card`): com `variant="bill"` e link, renderiza o botão com `href` correto, `target="_blank"`, `rel="noopener noreferrer"` e **não** chama `onDismiss` sozinho; sem link, chama `onDismiss` após 3,5 s.
  - `use-table-stream`: `call.attended` de um chamado `BILL` não altera o status; de um `WAITER`, altera para `ATTENDED`.
  - `panel-call-card`: conta mostra "Pagamento recebido"; garçom mostra "Atendido".
- E2E (Playwright, contra o back real):
  1. Dono salva o link em Configurações → Aparência.
  2. Cliente abre `/m/{token}` e pede a conta.
  3. Painel: tocar em "Pagamento recebido" no card da mesa.
  4. Cliente: aparece "Pagamento confirmado" e "Avaliar no Google" com o `href` salvo, sem passar por "Você foi atendido?".
  5. Recarregar a página do cliente: o card continua.
- **Pronto quando:** `npm run typecheck`, `npm run lint` e todos os testes passam.

---

## 7. Restrições (não fazer)

- **Não condicionar o botão à avaliação rápida (1 a 3) ou a qualquer sinal de satisfação.** A política do Google proíbe pedir avaliação só a clientes satisfeitos ("review gating"). O botão aparece para todo cliente que pagou, quando o link existe.
- Não guardar o link em `socials` nem montar o link no front a partir do Place ID: use exatamente `appearance.googleReviewUrl`.
- Não chamar `GET /public/tables/:token` a cada evento SSE (os GETs públicos têm limite por IP somado entre todas as mesas do restaurante). Atualize o estado pelo evento.
- Não chamar `POST .../confirm` nem `.../contest` para conta.
- Não abrir o link na mesma aba (o cliente perderia a tela da mesa).
- Não alterar o back-end. Se algo divergir deste documento, anote no relatório com a rota, a resposta recebida e a esperada.

---

## 8. Verificação manual rápida (com o back rodando)

```bash
API=http://localhost:3000/api/v1
# 1. Dono configura o link (use o token do dono)
curl -s -X PUT $API/settings/appearance -H "Authorization: Bearer $OWNER" -H 'Content-Type: application/json' \
  -d '{"googleReviewUrl":"ChIJIX22n_zVbgcRWvn7GCPGrs4"}' | jq .googleReviewUrl
# 2. Cliente pede a conta
CALL=$(curl -s -X POST $API/public/tables/$TOKEN/calls -H 'Content-Type: application/json' -d '{"type":"BILL"}' | jq -r .id)
# 3. Garçom confirma o pagamento
curl -s -X POST $API/panel/calls/$CALL/attend -H "Authorization: Bearer $WAITER" | jq .status   # "CONFIRMED"
# 4. O que a tela do cliente recebe ao (re)carregar
curl -s $API/public/tables/$TOKEN | jq '{link: .appearance.googleReviewUrl, conta: [.calls[] | select(.type=="BILL") | .status]}'
```

---

## 9. Critérios de aceite

1. O dono consegue salvar, ver normalizado e remover o link de avaliação; links de outros domínios mostram o erro do back.
2. No painel, o card de conta mostra "Pagamento recebido"; tocar confirma o pagamento e o card vai para a gaveta como pago.
3. No celular, depois do pagamento, aparece "Pagamento confirmado" e o botão "Avaliar no Google" (quando há link), **sem** a pergunta "Você foi atendido?" em nenhum momento.
4. O botão abre o link cadastrado em nova aba e o card não some sozinho; sem link, o agradecimento fecha sozinho.
5. Recarregar a página do cliente em até 15 min mostra o card de novo (se não foi fechado).
6. Chamar garçom continua com "Você foi atendido?", confirmação, avaliação rápida e contestação como antes.
7. Typecheck, lint e testes (unitários e E2E) passando.

---

## 10. Referências no back-end

- Regra de negócio: `docs/api/BUSINESS_RULES.md`, seção 1.1.
- Contratos: `docs/api/TYPESCRIPT_CONTRACTS.md` (`RestaurantAppearance`, `UpdateAppearanceRequest`, `PublicTableDto`).
- Endpoints: `docs/api/API_REFERENCE.md`, seções 4.2 (aparência) e 8.6 (attend).
- Integração geral: `docs/api/FRONTEND_INTEGRATION.md`, seções 6, 7, 8 e 10.
- Código: `src/modules/service-calls/domain/ServiceCall.ts` (`attend`, `PAID_BILL_VISIBLE_SEC`), `src/modules/tenancy/domain/Appearance.ts` (`normalizeGoogleReviewUrl`).
