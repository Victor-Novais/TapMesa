# Regras de Proteção de Branch e Governança CI/CD — TapMesa

Este documento define os padrões canônicos de proteção da branch `main` e a esteira de governança CI/CD para o repositório `tapmesa-web`.

---

## 1. Regras de Proteção da Branch `main`

A branch `main` é considerada sagrada e reflete o código estável pronto para empacotamento e deploy em produção. As seguintes regras do GitHub Branch Protection / Rulesets devem estar ativas:

1. **Bloqueio de Pushes Diretos:**
   - Nenhum desenvolvedor ou administrador pode fazer push direto para `main`.
   - Todas as alterações devem ser introduzidas exclusivamente via Pull Request (PR) originado de branch de feature (`feat/*`) ou correção (`fix/*`, `chore/*`).

2. **Status Checks Obrigatórios (Passagem do CI):**
   - Os seguintes jobs do workflow `.github/workflows/ci.yml` devem passar com status verde (sucesso) antes da habilitação do botão de merge:
     - `Lint, Types, Boundaries & Build` (`verify`)
     - `Secrets Detection (Gitleaks)` (`gitleaks`)
     - `Docker Build & Vulnerability Scan (Trivy)` (`docker`)
   - Configuração: `Require status checks to pass before merging` = **Enabled**; `Require branches to be up to date before merging` = **Enabled**.

3. **Revisão de Código Obrigatória (Code Review):**
   - Mínimo de **1 aprovação** formal de revisor de código (`Required approving reviews: 1`).
   - `Dismiss stale pull request approvals when new commits are pushed` = **Enabled** (novos commits invalidam aprovações anteriores, exigindo nova checagem).

4. **Histórico Linear e Convenção de Commits:**
   - `Require linear history` = **Enabled** (proíbe merge commits desordenados; commits devem ser squash & merge ou rebase).
   - Mensagens de commit validadas rigorosamente pelo `@commitlint/cli` seguindo o padrão Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).

5. **Integridade de Branch:**
   - `Allow force pushes` = **Disabled** (estritamente bloqueado).
   - `Allow deletions` = **Disabled** (deleção acidental da branch principal desativada).

---

## 2. Esteiras Automatizadas do GitHub Actions

| Workflow                                                                     | Gatilho                           | Responsabilidade                                                                                                                                                                                                                                                                                                                                       |
| :--------------------------------------------------------------------------- | :-------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`.github/workflows/ci.yml`](file:///.github/workflows/ci.yml)               | `push` e `pull_request` em `main` | Executa instalação limpa (`npm ci`), lint, typecheck estrito, verificação de limites arquiteturais (`eslint-plugin-boundaries`), build standalone Next.js, auditoria de dependências de produção (`npm audit --omit=dev --audit-level=high`), scan de segredos com `gitleaks` e build da imagem Docker com varredura de vulnerabilidades pelo `Trivy`. |
| [`.github/workflows/e2e-smoke.yml`](file:///.github/workflows/e2e-smoke.yml) | `workflow_dispatch` (manual)      | Sobe a stack completa de microsserviços via Docker Compose e executa a narrativa E2E do Playwright (`smoke.spec.ts`) contra o backend e banco de dados reais.                                                                                                                                                                                          |
| [`.github/workflows/release.yml`](file:///.github/workflows/release.yml)     | Tags semânticas `v*`              | Realiza o build multi-stage otimizado da imagem Docker de produção e efetua o push para o GitHub Container Registry (`ghcr.io`).                                                                                                                                                                                                                       |
| [`.github/dependabot.yml`](file:///.github/dependabot.yml)                   | Semanal (segundas às 03:00)       | Checagem automática e abertura de PRs para atualizações de segurança e versões de pacotes `npm` e `github-actions`.                                                                                                                                                                                                                                    |

---

## 3. Imagem Docker de Produção

A imagem Docker é configurada para máxima conformidade e segurança:

- **Base:** `node:24-alpine` (mínima superfície de ataque).
- **Usuário:** `node` (UID/GID desprivilegiado, proibindo execução como root).
- **Artefato:** Next.js `output: 'standalone'` com apenas o runtime mínimo necessário.
- **Healthcheck:** `wget -qO- http://localhost:3001/ || exit 1` (a cada 15s).
- **Compose de Segurança:** `read_only: true`, `cap_drop: [ALL]`, `security_opt: [no-new-privileges:true]`.
