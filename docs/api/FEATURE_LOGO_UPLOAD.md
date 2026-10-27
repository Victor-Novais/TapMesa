# Logo e Imagem de Fundo do Restaurante — Especificação para o Front-end

> **Para quem é:** o agente de IA (ou dev) que vai ajustar o repositório do front-end `TapMesa` (Next.js) para enviar e exibir o logo e a imagem de fundo do restaurante.
> **Estado:** back-end corrigido e testado (28/10/2026). O front precisa de ajustes (seção 6).
> **Este documento é autossuficiente:** contém o que estava quebrado, o contrato exato da API, as regras, o estado atual do código do front, as tarefas e os critérios de aceite. Leia inteiro antes de alterar código.

Caminhos de arquivo são relativos à raiz do repositório do front. A API usa o prefixo `/api/v1` (já incluído em `NEXT_PUBLIC_API_URL`).

---

## 1. O que estava quebrado (e já foi corrigido no back)

Sintoma: o upload do PNG respondia `200`, mas o logo não aparecia em lugar nenhum.

| Causa                                                                                                                                                                                                                      | Correção no back                                                                                                                                                                      |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A URL devolvida era `{PUBLIC_APP_URL}/storage/<arquivo>`, ou seja, no **domínio do front**. Nenhum servidor atendia esse caminho (404).                                                                                    | As URLs agora apontam para a **API**: `{PUBLIC_API_URL}/api/v1/files/<uuid>.<ext>`, servidas pela rota `GET /api/v1/files/:key`.                                                      |
| No Render o disco é efêmero: arquivos gravados em disco somem a cada deploy ou hibernação.                                                                                                                                 | Novo armazenamento `database` (padrão em produção): a imagem processada fica numa tabela do Postgres.                                                                                 |
| As respostas da API saíam com `Cross-Origin-Resource-Policy: same-origin`, o que faria o navegador bloquear o `<img>` vindo de outro domínio.                                                                              | A rota de arquivos responde com `Cross-Origin-Resource-Policy: cross-origin`.                                                                                                         |
| Salvar o formulário de aparência com fundo de imagem fazia o back **apagar o arquivo do fundo**: o front reenviava a URL como `backgroundValue`, o back via um valor "novo" e removia o arquivo anterior, que era o mesmo. | O `PUT /settings/appearance` não troca mais a imagem de fundo: com `backgroundType: "image"` ele **ignora** `backgroundValue` e mantém o arquivo atual. A imagem só muda pelo upload. |

Imagens enviadas antes da correção (URLs `/storage/...`) não existem mais: o restaurante precisa reenviar o logo e o fundo uma vez.

---

## 2. Como funciona agora

```
[Front] --multipart (file)--> POST /api/v1/settings/appearance/logo|background
                                   |  valida (JPEG/PNG/WebP, ≤ 2 MB), redimensiona (≤ 1024 px),
                                   |  grava com nome novo <uuid>.<ext> e apaga o arquivo anterior
                                   v
                        resposta 200 = aparência completa com logoUrl / backgroundValue
                                   |
[Navegador] --<img src=logoUrl>--> GET /api/v1/files/<uuid>.<ext>  (pública, cache de 1 ano)
```

- Cada upload gera **um nome de arquivo novo**. Por isso a URL nunca muda de conteúdo: o cache longo é seguro e não há necessidade de "cache busting" (`?v=...`).
- O front **nunca monta** a URL da imagem: ela vem pronta e absoluta nas respostas da API.
- Com `STORAGE_DRIVER=s3` a URL aponta direto para o bucket (outro domínio). O front trata igual: usa a URL como veio.

---

## 3. Contrato da API

### 3.1. Enviar o logo — `POST /settings/appearance/logo` (OWNER/ADMIN)

- `Content-Type: multipart/form-data`, com **um** arquivo no campo `file`.
- Aceita **JPEG, PNG e WebP**, verificados pelo conteúdo (não pela extensão). **SVG é recusado.**
- Até **2 MB** por arquivo. O back reduz para no máximo 1024 px e mantém o formato.
- Resposta `200`: a aparência completa (`RestaurantAppearance`), com o novo `logoUrl`.

```json
{
  "name": "Churrascaria Boi Bravo",
  "description": null,
  "logoUrl": "https://tapmesa-back-end.onrender.com/api/v1/files/c3efb56f-57b2-410b-870b-5af733063b3e.png",
  "backgroundType": "color",
  "backgroundValue": "#0f172a",
  "colors": {
    "primary": "#f97316",
    "background": "#0f172a",
    "surface": "#1e293b",
    "text": "#f8fafc"
  },
  "texts": { "...": "..." },
  "socials": {},
  "googleReviewUrl": null
}
```

### 3.2. Enviar a imagem de fundo — `POST /settings/appearance/background` (OWNER/ADMIN)

Mesmas regras do logo. Resposta `200`: aparência completa com `backgroundType: "image"` e `backgroundValue` = URL absoluta da imagem.

### 3.3. Erros do upload

| Status | `code`                 | Quando                                                 | Mensagem sugerida                   |
| :----- | :--------------------- | :----------------------------------------------------- | :---------------------------------- |
| 400    | `MISSING_FILE`         | Nenhum arquivo no `multipart`                          | "Selecione uma imagem."             |
| 400    | `INVALID_IMAGE_FORMAT` | Não é JPEG/PNG/WebP (inclui SVG e arquivos renomeados) | "Use PNG, JPG ou WebP."             |
| 400    | `FILE_TOO_LARGE`       | Maior que 2 MB                                         | "A imagem deve ter no máximo 2 MB." |
| 413    | `PAYLOAD_TOO_LARGE`    | Corpo maior que 10 MB                                  | "A imagem deve ter no máximo 2 MB." |
| 403    | —                      | Usuário sem perfil OWNER/ADMIN                         | —                                   |

O `detail` da resposta vem em português e pode ser exibido diretamente.

### 3.4. Exibir — `GET /files/:key` (pública)

- Você não chama essa rota diretamente: ela é a URL que vem em `logoUrl` e `backgroundValue`.
- `key` = UUID + extensão (`png`, `jpg` ou `webp`). Qualquer outro formato ou arquivo inexistente: `404`.
- Cabeçalhos: `Content-Type` correto, `Cache-Control: public, max-age=31536000, immutable`, `Cross-Origin-Resource-Policy: cross-origin`.
- Não precisa de token: funciona em `<img>`, em CSS `background-image` e no `next/image`.

### 3.5. Onde as URLs aparecem

| Endpoint                                                                                   | Campos                                                                          |
| :----------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| `GET`/`PUT /settings/appearance`, `POST .../logo`, `POST .../background`, `POST .../reset` | `logoUrl`, `backgroundType`, `backgroundValue`                                  |
| `GET /public/tables/:token` (tela do cliente)                                              | `appearance.logoUrl`, `appearance.backgroundType`, `appearance.backgroundValue` |
| `GET /tables/print` (folha A4)                                                             | `restaurant.logoUrl`                                                            |

`backgroundValue` é uma **cor hexadecimal** quando `backgroundType === "color"` e uma **URL absoluta** quando `backgroundType === "image"`.

### 3.6. Regras do `PUT /settings/appearance` para o fundo

| Payload                                                          | Resultado                                                                                                       |
| :--------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| Sem `backgroundType` e sem `backgroundValue`                     | Fundo não muda.                                                                                                 |
| `{ "backgroundType": "image" }` (com ou sem `backgroundValue`)   | **Mantém a imagem atual.** `backgroundValue` enviado é ignorado.                                                |
| `{ "backgroundType": "image" }` sem nenhuma imagem enviada antes | `400 INVALID_APPEARANCE`: "Para usar imagem de fundo, envie o arquivo em POST /settings/appearance/background." |
| `{ "backgroundType": "color", "backgroundValue": "#112233" }`    | Passa a cor sólida **e apaga a imagem de fundo anterior**.                                                      |
| `{ "backgroundType": "color", "backgroundValue": null }`         | Cor padrão (`#0f172a`) e apaga a imagem anterior.                                                               |
| Qualquer `data:...;base64,...`                                   | `400 INVALID_APPEARANCE`.                                                                                       |

O logo **não** é alterado pelo `PUT`: só pelo upload (ou removido pelo reset).

### 3.7. Restaurar padrão — `POST /settings/appearance/reset`

Remove logo, imagem de fundo (os arquivos são apagados), cores, textos, links e o link do Google. Resposta: aparência padrão (`logoUrl: null`, `backgroundType: "color"`).

---

## 4. Pré-requisitos do back-end (configuração, não é tarefa do front)

O front só vê as imagens se o back estiver configurado. Se as URLs vierem com `localhost` em produção ou as imagens derem 404, confira:

- Migration `20261028120000_stored_files` aplicada (`npx prisma migrate deploy`).
- `PUBLIC_API_URL` = endereço público da API, sem `/api/v1` (ex.: `https://tapmesa-back-end.onrender.com`). Obrigatório em produção.
- `STORAGE_DRIVER=database` (padrão em produção) ou `s3`. Não use `local` no Render.

---

## 5. Estado atual do código do front (lido em 28/10/2026)

| Arquivo                                                          | Situação                                                                                                                                                                                                                                                                                                                                                                         |
| :--------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/shared/api/settings.ts` (`uploadLogo`, `uploadBackground`)  | Correto: envia `FormData` com o campo `file` e tipa a resposta como `RestaurantAppearance`.                                                                                                                                                                                                                                                                                      |
| `src/features/settings/ui/appearance-settings-form.tsx` (~70-71) | Correto: valida 2 MB e `image/png`, `image/jpeg`, `image/webp`.                                                                                                                                                                                                                                                                                                                  |
| `appearance-settings-form.tsx` (~388-396)                        | Ao escolher o fundo, coloca a URL temporária `blob:` em `backgroundValue` do formulário e, após o upload, troca pela URL do servidor.                                                                                                                                                                                                                                            |
| `appearance-settings-form.tsx` (~427, `onSubmit`)                | Envia `backgroundValue: data.backgroundValue` quando o fundo é imagem (URL absoluta ou `blob:`). Com o back corrigido não quebra mais, mas é enviado à toa.                                                                                                                                                                                                                      |
| `appearance-settings-form.tsx` (~344-361)                        | Prévia local do logo com `URL.createObjectURL`; nunca chama `URL.revokeObjectURL` e a prévia local continua mesmo após o sucesso.                                                                                                                                                                                                                                                |
| `appearance-settings-form.tsx` (~590-596, ~876)                  | `next/image` com `unoptimized`: correto.                                                                                                                                                                                                                                                                                                                                         |
| `src/features/table-screen/ui/table-screen.tsx` (~124-131)       | Logo da tela do cliente com `next/image` **sem `unoptimized`**: passa pelo otimizador do Next. No Next 16 o otimizador recusa imagens de localhost/IP local (`images.dangerouslyAllowLocalIP: false`), então em desenvolvimento o logo não aparece mesmo com a URL certa. Em produção funciona, mas gasta a cota de otimização da Vercel à toa (a imagem já vem redimensionada). |
| `src/features/table-screen/ui/table-theme-provider.tsx` (~85)    | Fundo via `style={{ backgroundImage: \`url(${backgroundValue})\` }}`: correto, mas a URL não é escapada.                                                                                                                                                                                                                                                                         |
| `src/features/tables/ui/table-print-card.tsx` (~45-50)           | `<img src={logoUrl}>`: correto.                                                                                                                                                                                                                                                                                                                                                  |
| `next.config.ts`                                                 | CSP `img-src 'self' data: blob: https: {apiOrigin}` e `images.remotePatterns` com `https://**` e `http://localhost`: corretos para as URLs novas.                                                                                                                                                                                                                                |

---

## 6. Tarefas no front

### T1. Tela do cliente: logo sem o otimizador do Next

- `src/features/table-screen/ui/table-screen.tsx`: adicionar `unoptimized` no `<Image src={logoUrl} ...>` do logo do restaurante.
- Motivo: a imagem já vem redimensionada (≤ 1024 px) e com cache longo; o otimizador só adiciona latência, custo e o bloqueio de localhost no Next 16.
- Mantenha `width`/`height` e o `alt`. Opcional: `onError` que troca para o `BrandLogo` padrão se a imagem falhar.
- **Pronto quando:** em desenvolvimento (API em `http://localhost:3000`), o logo enviado aparece em `/m/{token}`.

### T2. Formulário de aparência: não reenviar a URL do fundo

- `src/features/settings/ui/appearance-settings-form.tsx`, `onSubmit` (~427):
  - `backgroundType === "color"` → enviar `backgroundType: "color"` e `backgroundValue` com a cor hexadecimal (como hoje).
  - `backgroundType === "image"` → enviar só `backgroundType: "image"`, **sem** `backgroundValue`.
- Ao escolher o arquivo de fundo (~388-396): não gravar a URL `blob:` no campo `backgroundValue` do formulário. Use um estado só de prévia (`localBgPreview`, que já existe) e, após o upload, atualize o formulário com os valores da resposta (`backgroundType`, `backgroundValue`).
- Se o upload do fundo falhar, voltar `backgroundType` ao valor anterior (o back não aceita "image" sem arquivo enviado).
- **Pronto quando:** enviar uma imagem de fundo, alterar outro campo (ex.: descrição) e salvar mantém o fundo; a requisição `PUT` não leva `backgroundValue` quando o fundo é imagem.

### T3. Prévias locais: liberar memória e usar a URL do servidor

- Depois do upload com sucesso (logo e fundo): `URL.revokeObjectURL(tempUrl)` e limpar a prévia local (`setLocalLogoPreview(null)` / `setLocalBgPreview(null)`), passando a exibir a URL que veio na resposta (o hook de mutação já grava a resposta no cache de `queryKeys.settings.appearance`).
- Em erro: também revogar a URL temporária.
- **Pronto quando:** após o upload, o `src` da imagem na tela de configurações é a URL `.../api/v1/files/...` (não `blob:`).

### T4. Mensagens de erro do upload

- Mapear `MISSING_FILE`, `INVALID_IMAGE_FORMAT`, `FILE_TOO_LARGE` e o status `413` para as mensagens da tabela 3.3 (em `src/shared/messages/errors.ts`, se é onde ficam as outras), com `detail` como fallback.
- Manter a validação local de tipo e tamanho antes de enviar (já existe).

### T5. Fundo: escapar a URL no CSS

- `src/features/table-screen/ui/table-theme-provider.tsx` (~85): usar `backgroundImage: \`url("${encodeURI(backgroundValue)}")\`` (com aspas), para que caracteres especiais na URL não quebrem a regra CSS.
- **Pronto quando:** o fundo de imagem aparece na tela do cliente.

### T6. Testes

- Componente/unitário:
  - `table-screen`: com `appearance.logoUrl`, renderiza a imagem com essa URL (e `unoptimized`); sem `logoUrl`, renderiza o `BrandLogo`.
  - `appearance-settings-form`: com fundo de imagem, o payload do `PUT` não contém `backgroundValue`; com cor, contém a cor.
- E2E (Playwright, contra o back real):
  1. Dono envia um PNG como logo em Configurações → Aparência; a prévia mostra a imagem e o `src` aponta para `/api/v1/files/`.
  2. Abrir `/m/{token}` da mesa: o logo aparece (a requisição da imagem retorna `200`).
  3. Enviar imagem de fundo, alterar a descrição, salvar e recarregar: o fundo continua aparecendo.
  4. Enviar um SVG ou um arquivo de 3 MB: mensagem de erro, nada muda.
- **Pronto quando:** `npm run typecheck`, `npm run lint` e todos os testes passam.

---

## 7. Restrições (não fazer)

- Não montar a URL da imagem no front (nada de `NEXT_PUBLIC_API_URL + "/files/" + key` nem de `/storage/...`). Use `logoUrl`/`backgroundValue` exatamente como vieram.
- Não enviar imagem em base64 nem URL de imagem pelo `PUT /settings/appearance`. Logo e fundo só mudam pelos endpoints de upload.
- Não adicionar `?v=...`/timestamp na URL para "forçar atualização": cada upload já gera uma URL nova.
- Não converter, recortar ou comprimir no front além da validação de tipo/tamanho: o back já processa.
- Não aceitar SVG no seletor de arquivo.
- Não alterar o back-end. Se algo divergir deste documento, anote no relatório com a rota, a resposta recebida e a esperada.

---

## 8. Verificação manual rápida (com o back rodando)

```bash
API=http://localhost:3000/api/v1
# 1. Enviar o logo (token do dono)
curl -s -X POST $API/settings/appearance/logo -H "Authorization: Bearer $OWNER" \
  -F "file=@logo.png;type=image/png" | jq -r .logoUrl
# -> http://localhost:3000/api/v1/files/<uuid>.png

# 2. A URL devolvida serve a imagem, sem token, liberada para outro domínio
curl -s -o /dev/null -D - "<logoUrl do passo 1>" | grep -iE "^HTTP|content-type|cross-origin-resource-policy|cache-control"
# -> HTTP/1.1 200, image/png, cross-origin, public, max-age=31536000, immutable

# 3. A tela do cliente recebe a mesma URL
curl -s $API/public/tables/$TOKEN | jq -r .appearance.logoUrl
```

---

## 9. Critérios de aceite

1. Enviar PNG, JPG ou WebP de até 2 MB como logo mostra a imagem na prévia das configurações, na tela do cliente (`/m/{token}`) e na folha de impressão.
2. Enviar imagem de fundo mostra o fundo na tela do cliente; salvar outros campos depois disso não remove o fundo.
3. Trocar para cor sólida remove a imagem de fundo; restaurar o padrão remove logo e fundo.
4. SVG, arquivo renomeado e arquivo acima de 2 MB mostram mensagem de erro clara e não alteram nada.
5. Em desenvolvimento (API em localhost) o logo aparece na tela do cliente.
6. Typecheck, lint e testes (unitários e E2E) passando.

---

## 10. Referências no back-end

- Endpoints: `docs/api/API_REFERENCE.md`, seções 4.2 (aparência), 4.3 (upload) e 4.6 (arquivos).
- Contratos: `docs/api/TYPESCRIPT_CONTRACTS.md` (`RestaurantAppearance`, `UpdateAppearanceRequest`, `PublicTableDto`).
- Modelo de dados: `docs/api/DATA_MODEL.md`, seção 3.10 (`stored_files`).
- Operação e variáveis: `docs/RUNBOOK.md`, seção 2.9.
- Código: `src/shared/presentation/FilesController.ts`, `src/shared/infrastructure/DatabaseFileStorage.ts`, `src/modules/tenancy/application/use-cases/UploadAppearanceImageUseCase.ts`, `src/modules/tenancy/domain/Appearance.ts` (`update`).
