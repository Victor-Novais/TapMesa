# ADR 0003: Geração do Service Worker e Isolamento de Cache PWA

## Status

Aprovado

## Data

21/10/2026

## Contexto

O requisito da F11 e a Seção 5.5 do plano de arquitetura determinam que o painel da equipe deve ser instalável como PWA em tablets e televisores.
O `.gitignore` canônico (Seção 5.5) define que `public/sw.js` é um artefato gerado (`# PWA gerado: public/sw.js`).
Além disso, a Regra de Ouro do projeto especifica que o Service Worker **NUNCA** pode cachear respostas da API (`/api/*`) nem as telas públicas das mesas (`/m/*`), sob pena de exibir dados obsoletos ou comprometer a segurança multi-tenant.

## Decisão

1. O código-fonte oficial do Service Worker foi versionado em `src/service-worker/sw.js`.
2. Um script leve nativo (`scripts/build-sw.mjs`) compila/copia o arquivo para `public/sw.js` antes de cada execução de `npm run dev` e `npm run build`.
3. O Service Worker implementa regras estritas de bypass:
   - Requisições com pathname iniciado por `/api/` são ignoradas imediatamente sem cache.
   - Requisições com pathname iniciado por `/m/` são ignoradas sem cache.
   - Requisições com método diferente de `GET` ou com header `Accept: text/event-stream` (SSE) não são interceptadas.
   - Assets estáticos (`/_next/static/*`) utilizam estratégia Cache-First com network fallback.
   - Navegação HTML utiliza Network-First com fallback para a casca do painel (`/panel`) apenas quando o dispositivo estiver comprovadamente offline.

## Consequências

- Total conformidade com o `.gitignore` canônico da Seção 5.5 sem adulterar os arquivos de infraestrutura.
- Zero dependências npm adicionais no runtime (nenhuma dependência fora da Seção 1.3).
- Proteção absoluta contra cache indevido de dados da API e mesas de clientes.
