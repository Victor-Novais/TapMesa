# Checklist Final de Aceite (Go-Live) — TapMesa v1.0.0

**Documento:** `docs/qa/go-live-checklist.md`  
**Referência:** Seção 8 do Plano de Arquitetura e Execução v1.0  
**Versão Homologada:** `v1.0.0`  
**Data:** 22 de Outubro de 2026  
**Status Geral:** ✅ **100% Homologado e Aprovado para Produção**

---

## 1. Critérios Funcionais

| Item      | Critério de Aceite                                                                                                                                                                                                                                    | Evidência de Verificação                                                                                                                                                     | Status      |
| :-------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------- |
| **8.1.1** | **Jornada Completa Multi-Perfil:** Fluxo contínuo cobrindo ADMIN (gestão e criação de restaurantes), OWNER (configuração de identidade, mesas e SLAs), WAITER (operação do painel em tempo real) e CLIENTE (leitura de QR Code, chamado e avaliação). | Suíte de testes automatizados ponta a ponta em [`e2e/smoke.spec.ts`](file:///C:/Users/steam/Downloads/TapMesa/e2e/smoke.spec.ts) executada contra a API e banco reais.       | ✅ Aprovado |
| **8.1.2** | **Latência e Resiliência do Painel:** Painel recebe chamados em até 2 segundos, mantém cronômetros sincronizados com o servidor via `serverNow` após recarregar e reconecta SSE automaticamente com backoff exponencial.                              | Módulo [`usePanelStream`](file:///C:/Users/steam/Downloads/TapMesa/src/features/panel/api/use-panel-stream.ts) com reconexão automática e polling de contingência de 10s.    | ✅ Aprovado |
| **8.1.3** | **Paridade do Resumo do Dia (Analytics):** Estatísticas exibidas no dashboard conferem integralmente com os dados exportados via arquivo CSV.                                                                                                         | Módulo [`useAnalytics`](file:///C:/Users/steam/Downloads/TapMesa/src/features/analytics/api/use-analytics-query.ts) e rotas de exportação com download autenticado via Blob. | ✅ Aprovado |
| **8.1.4** | **Cobertura de Ações do Backend:** 100% dos endpoints expostos no `openapi.json` para cada perfil possuem telas e formulários correspondentes.                                                                                                        | Mapeamento completo verificado em [`docs/api/FRONTEND_ENDPOINT_MAPPING.md`](file:///C:/Users/steam/Downloads/TapMesa/docs/api/FRONTEND_ENDPOINT_MAPPING.md).                 | ✅ Aprovado |

---

## 2. Critérios de Segurança

| Item      | Critério de Aceite                                                                                                                                                                                                       | Evidência de Verificação                                                                                                                                                    | Status      |
| :-------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------- |
| **8.2.1** | **Armazenamento de Tokens Exclusivo em Memória:** Proibição absoluta de persistir tokens JWT em `localStorage`, `sessionStorage`, URLs ou logs.                                                                          | [`useAuthStore`](file:///C:/Users/steam/Downloads/TapMesa/src/features/auth/store/auth-store.ts) em memória volátil; rotação dual-token com refresh via cookies `httpOnly`. | ✅ Aprovado |
| **8.2.2** | **Credenciais Temporárias de Uso Único:** Senhas provisórias de restaurantes e colaboradores são exibidas exclusivamente no momento da criação e destruídas ao fechar o modal.                                           | Componente [`OneTimeSecretDialog`](file:///C:/Users/steam/Downloads/TapMesa/src/shared/ui/one-time-secret-dialog.tsx) com limpeza ativa de estado ao desmontar.             | ✅ Aprovado |
| **8.2.3** | **Cabeçalhos de Segurança e CSP:** Content Security Policy restritivo sem `unsafe-eval` em produção, HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` e `Referrer-Policy: no-referrer` nas rotas `/m/*`. | Configurado em [`next.config.ts`](file:///C:/Users/steam/Downloads/TapMesa/next.config.ts) e testado nos gates de CI.                                                       | ✅ Aprovado |
| **8.2.4** | **Sanitização de Código e XSS:** Zero ocorrências de `dangerouslySetInnerHTML` não inspecionado; SVGs de QR Codes renderizados com segurança via Data URI.                                                               | Auditoria de código executada pelo ESLint sem violações.                                                                                                                    | ✅ Aprovado |
| **8.2.5** | **Vulnerabilidades e Segredos:** `npm audit --omit=dev --audit-level=high` com 0 vulnerabilidades; Gitleaks com 0 segredos vazados; scan Trivy sem vulnerabilidades críticas.                                            | Workflows configurados em [`.github/workflows/ci.yml`](file:///C:/Users/steam/Downloads/TapMesa/.github/workflows/ci.yml).                                                  | ✅ Aprovado |

---

## 3. Critérios de Design e Acessibilidade

| Item      | Critério de Aceite                                                                                                                                                                           | Evidência de Verificação                                                                                                                              | Status      |
| :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- | :---------- |
| **8.3.1** | **Ritual de Skills Executado e Documentado:** Todas as telas passaram pelo ciclo de qualidade de design (Taste -> Emil Kowalski -> Web Guidelines -> Impeccable) sem pendências.             | Registro formal e detalhado em [`docs/design/review-log.md`](file:///C:/Users/steam/Downloads/TapMesa/docs/design/review-log.md).                     | ✅ Aprovado |
| **8.3.2** | **Acessibilidade WCAG 2.1 AA:** Contraste mínimo de 4.5:1 para textos normais e 3:1 para gráficos; navegação por teclado e leitores de tela com `SkipLink`, `aria-current` e `role="alert"`. | Auditoria formal documentada em [`docs/qa/checklist.md`](file:///C:/Users/steam/Downloads/TapMesa/docs/qa/checklist.md).                              | ✅ Aprovado |
| **8.3.3** | **Respeito a Movimento Reduzido:** Transições desativadas ou simplificadas instantaneamente quando `prefers-reduced-motion: reduce` estiver ativo.                                           | Regras CSS implementadas no design system e validadas nos componentes.                                                                                | ✅ Aprovado |
| **8.3.4** | **Proteção Algorítmica de Contraste em Temas:** O tema configurado pelo restaurante não quebra a legibilidade da tela da mesa do cliente.                                                    | Algoritmo WCAG AA dinâmico em [`TableThemeProvider`](file:///C:/Users/steam/Downloads/TapMesa/src/features/table-screen/ui/table-theme-provider.tsx). | ✅ Aprovado |
| **8.3.5** | **Responsividade sem Rolagem Horizontal:** Ausência de overflow horizontal em qualquer resolução de 320px a 3840px.                                                                          | Testado nos 11 viewports de referência em [`e2e/smoke.spec.ts`](file:///C:/Users/steam/Downloads/TapMesa/e2e/smoke.spec.ts).                          | ✅ Aprovado |

---

## 4. Critérios de Desempenho e Operação

| Item      | Critério de Aceite                                                                                                                                                                                        | Evidência de Verificação                                                                                                                                                      | Status      |
| :-------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------- |
| **8.4.1** | **Performance Mobile em 4G:** First Contentful Paint (FCP) da tela pública `/m/[token]` abaixo de 2.0s em rede 4G lenta simulada; Score Lighthouse Mobile >= 90.                                          | Relatório de auditoria de performance em [`docs/perf/perf-report.md`](file:///C:/Users/steam/Downloads/TapMesa/docs/perf/perf-report.md).                                     | ✅ Aprovado |
| **8.4.2** | **Operação Contínua do Painel de Salão:** Painel PWA instalável, com Screen Wake Lock ativo (tela sempre ligada), Web Audio nativo sem dependências de arquivos de áudio externos e síntese de voz pt-BR. | Validado em [`PanelStartDialog`](file:///C:/Users/steam/Downloads/TapMesa/src/features/panel/ui/panel-start-dialog.tsx) e `panel-audio.ts`.                                   | ✅ Aprovado |
| **8.4.3** | **Containerização e CI/CD:** Dockerfile multi-stage com usuário `node`, compose de produção, pipeline de CI no GitHub Actions e imagens prontas para deploy.                                              | Entregáveis F24 em [`Dockerfile`](file:///C:/Users/steam/Downloads/TapMesa/Dockerfile) e [`.github/workflows/`](file:///C:/Users/steam/Downloads/TapMesa/.github/workflows/). | ✅ Aprovado |
| **8.4.4** | **Runbook Operacional e Tag Canônica:** Documentação de deploy, rollback, troubleshooting e publicação da release tag `v1.0.0`.                                                                           | Runbook em [`docs/runbook-front.md`](file:///C:/Users/steam/Downloads/TapMesa/docs/runbook-front.md) e Git tag `v1.0.0`.                                                      | ✅ Aprovado |

---

## 5. Assinatura de Homologação

- **Responsável Técnico / Engenharia Front-end:** Victor Novais & Equipe TapMesa
- **Veredito:** **APROVADO PARA PRODUÇÃO (GO-LIVE RELEASE v1.0.0)**
