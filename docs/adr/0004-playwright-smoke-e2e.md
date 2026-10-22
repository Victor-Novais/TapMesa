# ADR 0004: Adoção do Playwright para Testes Smoke E2E e Validação de Responsividade

## Status

Aceito

## Data

21 de Outubro de 2026

## Contexto

A tarefa F23 da arquitetura exige a validação da jornada ponta a ponta do TapMesa contra o back-end real através de um teste narrativo completo (smoke) executado em múltiplos viewports (celular 390×844, tablet 768×1024 e desktop 1440×900) e com checagem automática de ausência de rolagem horizontal (`scrollWidth <= clientWidth`).

A regra 6 do Contrato do Agente estipula que dependências externas adicionadas devem ser justificadas via ADR.

## Decisão

Adotar `@playwright/test` como dependência de desenvolvimento (`devDependencies`) para execução dos testes automatizados de jornada (E2E Smoke) e auditoria programática de responsividade e layout.

A suíte cobre:

1. Criação de restaurante e geração de credenciais via portal administrativo (`ADMIN`).
2. Login do dono (`OWNER`) e criação de mesas em lote.
3. Acesso à mesa via QR Code móvel (`/m/[token]`) e abertura de chamados.
4. Painel operacional em tempo real (`/panel`) recebendo, assumindo e atendendo chamados.
5. Confirmação do cliente com avaliação e contestação em chamado subsequente.
6. Atualização em tempo real das métricas operacionais no Resumo do Dia (`/dashboard/analytics`).
7. Verificação sistemática de ausência de overflow horizontal (`scrollWidth <= clientWidth`) nas rotas principais.

## Consequências

- Os testes rodam contra o front-end e a API real sem necessidade de mocks de dados.
- O artefato gerado é executado no CI e nos gates de qualidade locais.
- A dependência é estritamente de desenvolvimento, sem impacto no bundle de produção.
