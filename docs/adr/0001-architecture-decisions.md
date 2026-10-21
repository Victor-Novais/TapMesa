# ADR 0001: Decisões Fundamentais de Arquitetura do Frontend

- **Status:** Aceito
- **Data:** 21/10/2026
- **Contexto:** Definição da arquitetura, segurança, integração e metodologia de desenvolvimento do TapMesa Frontend (SaaS multi-tenant de chamada de garçom e pedido de conta via QR Code).

## Decisões (D1 a D12)

### D1: Organização por features com camada shared

- **Decisão:** A estrutura de código é dividida por domínios funcionais (`features/auth`, `table-screen`, `panel`, `tables`, `analytics`, `team`, `settings`, `admin`) e uma camada `shared` (`ui`, `lib`, `api`, `types`, `messages`, `config`).
- **Justificativa:** Permite que cada superfície de produto evolua de forma independente. Regras de lint de fronteiras (`eslint-plugin-boundaries`) impedem acoplamentos indevidos.

### D2: Access token somente em memória e refresh por cookie httpOnly

- **Decisão:** O access token JWT é mantido exclusivamente em memória (estado volátil Zustand). O refresh token é gerido e armazenado em cookie `httpOnly`, `SameSite=Strict` emitido pelo back-end.
- **Justificativa:** Elimina vetor de roubo persistente de sessão via XSS através de `localStorage` ou `sessionStorage`.

### D3: Front e API no mesmo site com chamadas diretas

- **Decisão:** Front-end e API operam sob o mesmo site (ex: `app.tapmesa.com.br` e `api.tapmesa.com.br`), enviando credenciais (`withCredentials: true`). Em desenvolvimento, front-end roda na porta 3001 e consome API na porta 3000.
- **Justificativa:** O cookie de refresh é `SameSite=Strict` e tem `Path: /api/v1/auth`. Chamadas diretas evitam proxies desnecessários no servidor Next.js.

### D4: Proteção de rotas no cliente (AuthGate por perfil)

- **Decisão:** O controle de acesso a rotas protegidas é realizado no cliente através de componentes guardiões (`AuthGate`) orientados ao perfil (`ADMIN`, `OWNER`, `WAITER`).
- **Justificativa:** O cookie de refresh pertence ao domínio e path da API e não fica visível durante o SSR/Edge do Next.js sem backend BFF.

### D5: Eventos SSE como gatilho e reconciliação com GET de estado

- **Decisão:** Eventos Server-Sent Events (SSE) disparam patch otimista imediato e acionam GET de reconciliação de estado completo caso os dados recebidos no evento sejam parciais.
- **Justificativa:** Payloads parciais de eventos (como `CALL_CREATED` sem campos secundários) poderiam levar a divergências se não fossem reconciliados.

### D6: Relógio único sincronizado via serverNow

- **Decisão:** Cálculo de offset de tempo centralizado baseado no campo `serverNow` (corpo e header `X-Server-Now`). Um único tick global de 1 segundo alimenta todos os cronômetros ativos.
- **Justificativa:** Garante precisão milimétrica mesmo em dispositivos de clientes com relógio local desregulado e evita sobrecarga de timers individuais por card.

### D7: Componentes da tela da mesa estritamente apresentacionais

- **Decisão:** Os componentes de `/m/[token]` recebem dados e ações via props, desacoplados de chamadas diretas de API.
- **Justificativa:** Permite reutilização direta e fiel na pré-visualização ao vivo do painel de configurações do dono (`/dashboard/settings?tab=appearance`).

### D8: SVG de QR Code renderizado como imagem Data URI

- **Decisão:** Qualquer SVG gerado pelo back-end ou biblioteca é consumido e renderizado estritamente via tag `<img>` com `data:image/svg+xml;utf8,...` ou URL segura, nunca com `dangerouslySetInnerHTML`.
- **Justificativa:** Mitigação total de injeção XSS embutida em vetores SVG.

### D9: Código em inglês e interface em pt-BR centralizada

- **Decisão:** Todo código-fonte (nomes de variáveis, funções, componentes, commits) é escrito em inglês. Todos os textos de interface são mantidos em `src/shared/messages/` em pt-BR.
- **Justificativa:** Padrão limpo internacional de engenharia, com facilidade de internacionalização futura sem busca de strings soltas.

### D10: Responsividade transversal (320px a 3840px)

- **Decisão:** Abordagem estrita mobile-first atendendo do iPhone SE (320px) à TV 4K (3840px), sem rolagem horizontal da página, com adaptação estrutural (lista vira card, abas viram colunas).
- **Justificativa:** Garçom opera em celular/tablet, cliente em celular de qualquer tamanho, painel do salão opera em monitores e Smart TVs, gestor opera em desktop/notebook.

### D11: Tipos tipados a partir dos contratos oficiais

- **Decisão:** Os tipos TypeScript são transcritos de `TYPESCRIPT_CONTRACTS.md` e auditados contra `openapi.json` em `src/shared/types/api.ts`.
- **Justificativa:** Contratos do back-end são a fonte única de verdade; divergências são registradas formalmente em ADRs.

### D12: Download autenticado via requisição com Blob

- **Decisão:** Downloads protegidos (ex: exportação de CSV ou SVG de QR) são executados via `downloadAuthenticated` via `Axios` com token no header `Authorization: Bearer <token>` e convertidos em Blob URL para download temporário.
- **Justificativa:** Os endpoints da API exigem autenticação que não pode ser injetada via simples tag `<a>` sem expor token na URL.
