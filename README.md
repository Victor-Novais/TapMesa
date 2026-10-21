# TapMesa — Frontend

SaaS multi-tenant para chamada de garçom e pedido de conta via QR Code em restaurantes.

## 1. Visão Geral
O TapMesa Web atende a quatro perfis de operação em um único produto coeso:
- **Cliente:** Abertura sem login via QR Code na mesa (`/m/[token]`), adaptada para smartphones, com chamada rápida de garçom, pedido de conta, observação e confirmação com avaliação de atendimento.
- **Equipe de Salão (Garçom / Gerência):** Painel operacional em tempo real (`/panel`), pensado para Smart TVs e tablets, com notificações sonoras, síntese de voz e contagem de tempo de espera.
- **Dono do Restaurante:** Dashboard de gestão (`/dashboard`), incluindo Resumo do Dia (Analytics), gestão e impressão de QR Codes de mesas, gestão de equipe e personalização de atendimento e identidade visual.
- **Administrador do SaaS:** Gestão global de restaurantes, suspensão, impersonação e auditoria detalhada (`/admin`).

## 2. Stack Tecnológica
- **Framework:** Next.js (App Router) + TypeScript (modo estrito)
- **Estilização:** Tailwind CSS + Radix UI (Design System customizado)
- **Gerenciamento de Estado de Servidor:** TanStack Query (React Query)
- **Gerenciamento de Estado Local & Tempo Real:** Zustand
- **Comunicação HTTP:** Axios (com interceptor de renovação de token por cookie httpOnly)
- **Formulários & Validação:** React Hook Form + Zod
- **Gráficos:** Recharts
- **Animação & Movimento:** Motion (Framer Motion)
- **Datas:** date-fns + date-fns-tz
- **Ícones:** Lucide React
- **PWA:** Serwist

## 3. Pré-requisitos
- Node.js LTS (v24.x)
- npm 11.x ou superior
- Back-end TapMesa rodando na porta 3000 (`http://localhost:3000`) com CORS liberado para `http://localhost:3001` e `COOKIE_SECURE=false` em ambiente de desenvolvimento local.

## 4. Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3001
PORT=3001
NEXT_TELEMETRY_DISABLED=1
```

## 5. Scripts Principais
- `npm run dev` — Inicia o servidor de desenvolvimento na porta 3001
- `npm run build` — Executa o build de produção (standalone)
- `npm run start` — Inicia o servidor em modo de produção
- `npm run lint` — Executa verificação estática de código com ESLint
- `npm run typecheck` — Validação estrita de tipos com TypeScript (`tsc --noEmit`)
- `npm run check:boundaries` — Validação da arquitetura de camadas e imports
- `npm run verify` — Executa lint, typecheck, boundaries e build (gate de qualidade)

## 6. Documentação
- [Arquitetura e Plano de Execução](docs/TapMesa%20Frontend%20—%20Arquitetura,%20Design%20e%20Plano%20de%20Execução%20v1.0.md)
- [Contratos da API](docs/api/README.md)
- [Registro de Decisões de Arquitetura (ADR)](docs/adr/)
- [Diretrizes de Design](docs/design/DESIGN.md)
- [Log de Revisão de Design](docs/design/review-log.md)
- [Acompanhamento de Tarefas](docs/PROGRESS.md)
