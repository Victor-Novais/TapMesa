# Linha de base do E2E — redesign visual

**Data:** 24/10/2026
**Commit de referência:** `7da96f9` (Fase 0) + `smoke.spec.ts` lendo `E2E_ADMIN_USERNAME`/`E2E_ADMIN_PASSWORD`
**Ambiente:** build de produção (`next build` + `next start`, porta 3001) contra o back-end **local** (`http://localhost:3000/api/v1`).

## Como rodar (protocolo usado em todas as fases)

O back-end aplica limite de taxa em login e em ações do painel. Rodando os três projetos em sequência, o `smoke.spec.ts` esgota o tempo em pontos diferentes a cada execução, o que torna a comparação inútil. Por isso, cada projeto roda isolado, com 90 s de pausa entre eles:

```bash
npm run build && npm run start   # em outro terminal

export E2E_ADMIN_USERNAME=admin E2E_ADMIN_PASSWORD='<senha-de-teste>'
npx playwright test e2e/integration.spec.ts
for p in mobile tablet desktop; do
  sleep 90
  npx playwright test e2e/smoke.spec.ts --project=$p
done
```

## Resultado

| Teste                                                                      | Projeto | Status    | Ponto de parada           | Motivo                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------------- | ------- | --------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `integration.spec.ts` › QR, cliente, painel, resumo, configurações e admin | mobile  | ignorado  | —                         | o próprio teste só roda no desktop                                                                                                                                                                                                           |
| `integration.spec.ts` › idem                                               | tablet  | ignorado  | —                         | idem                                                                                                                                                                                                                                         |
| `integration.spec.ts` › idem                                               | desktop | **falha** | `integration.spec.ts:137` | Espera o cabeçalho `x-table-url` na resposta de `GET /tables/{id}/qr?format=png`, com o mesmo valor do link copiado; o back-end local não envia (`Received: undefined`). Pendência do back-end, registrada em `TABLE_DEFAULT_PALETTE.md` §6. |
| `smoke.spec.ts` › jornada completa                                         | mobile  | **falha** | `smoke.spec.ts:193`       | Procura o link da mesa no formato `/m/{token}` (`span:has-text("/m/")`), mas o back-end devolve `{APP_URL}/?m={token}` — o mesmo formato que o `integration.spec.ts` espera. Expectativa desatualizada no teste.                             |
| `smoke.spec.ts` › jornada completa                                         | tablet  | **falha** | `smoke.spec.ts:193`       | Idem                                                                                                                                                                                                                                         |
| `smoke.spec.ts` › jornada completa                                         | desktop | **falha** | `smoke.spec.ts:193`       | Idem                                                                                                                                                                                                                                         |

**Passam:** nenhum teste chega ao fim hoje.

**O que já é verificado antes dos pontos de parada** (e portanto protege o redesign):

- `smoke.spec.ts` até a linha 193: login do admin, ausência de rolagem horizontal em `/login`, criação de restaurante pelo diálogo, leitura das credenciais temporárias (`p.font-mono`, `span.font-mono.text-lg`), login do dono, criação de mesas em lote, listagem "Mesa 1"/"Mesa 2" — nos 3 viewports.
- `integration.spec.ts` até a linha 137: login do dono, botão "Copiar link da Mesa 1" e conteúdo copiado igual a `table.url`.

## Critério de aceite de cada fase

1. Nenhuma falha nova: os testes ignorados continuam ignorados e nenhum teste passa a falhar.
2. Os testes que já falham param **no mesmo ponto** (`integration.spec.ts:137`, `smoke.spec.ts:193` nos 3 projetos), com o mesmo motivo.
3. Se um teste que passava quebrar, ou um ponto de parada mudar para uma linha anterior, a fase não está pronta.

## Observações

- `integration.spec.ts` ainda tem a senha padrão `Admin@123456` como valor de reserva (linha 18). Não foi alterado nesta etapa.
- Relatórios JSON da execução: `design-lab/e2e/baseline*.json` (não versionados); resumo gerado por `design-lab/e2e/summarize.cjs`.
