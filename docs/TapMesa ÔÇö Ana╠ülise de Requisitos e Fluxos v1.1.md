# TapMesa — Análise de Requisitos e Fluxos

_Sistema de chamada de garçom e pedido de conta via QR Code · Documento técnico para validação · Versão 1.1 · 08/10/2026_

## Controle do documento

### Histórico de versões

| Versão | Data       | Descrição                                                                                                                                                                                                        |
| ------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0    | 02/10/2026 | Documento inicial de análise (engenharia reversa do protótipo)                                                                                                                                                   |
| 1.1    | 08/10/2026 | Inclusão do Resumo do Dia para o dono, cronômetro de atendimento com medição de tempos e confirmação do atendimento pelo cliente. Revisão do ciclo de vida do chamado, modelo de dados, regras, riscos e roadmap |

### O que mudou na v1.1

- **Confirmação pelo cliente:** depois que o garçom toca em Atender, o celular do cliente pergunta se ele foi atendido. O chamado passa a ter o ciclo Pendente → Atendido → Confirmado.
- **Cronômetro com medição:** o tempo começa a contar no instante do chamado e é gravado em 3 marcos (chamado, atendimento, confirmação), sempre com a hora do servidor.
- **Nova aba Resumo do Dia (Dono):** indicadores, picos por horário, ranking de mesas, lista com linha do tempo e comparativos.
- **Melhorias além do pedido:** estado Expirado separado de Atendido; reabertura quando o cliente diz que não foi atendido; cancelamento pelo cliente; metas e limiares configuráveis; dia operacional com fuso horário; mediana e P90 além da média; histórico de eventos imutável; alertas e resumo automático ao dono.
- **Mudança em relação ao protótipo:** a expiração de 20 minutos deixa de marcar o chamado como Atendido e passa a marcá-lo como Expirado, para não distorcer as métricas.
- Itens novos ou alterados nesta versão estão marcados com ★.

### Fontes e rastreabilidade

| Tipo             | Fonte                                                | Descrição                                                                                |
| ---------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Fonte principal  | inde22x.html                                         | Protótipo de página única (\~1.400 linhas). Lido integralmente.                          |
| Fonte consultada | tapmesa.com.br/landing                               | Bloqueio de acesso automatizado.                                                         |
| Nova entrada ★   | Solicitação do responsável pelo produto (08/10/2026) | Resumo do dia, timer de atendimento e confirmação pelo cliente. Não existe no protótipo. |

### Limitações da análise

Devido ao bloqueio de acesso à landing page, as informações comerciais (planos, preços, limites de mesas e promessas de venda) não puderam ser extraídas. Todos os requisitos dependentes dessa definição possuem a ressalva \[A VALIDAR\]. Os valores numéricos propostos na v1.1 (meta de atendimento, janela de confirmação, retenção de histórico) são sugestões iniciais e também estão sujeitos a validação.

## 1. Escopo e fontes

### 1.1 Objetivo da análise

Descrever regras, fluxos e especificações do TapMesa a partir do protótipo HTML e das novas necessidades de negócio, formando a base para replicar o serviço em ambiente de produção escalável e seguro.

### 1.2 Escopo

- Perfis e permissões de acesso.
- Fluxos operacionais do cliente e da equipe do restaurante.
- ★ Medição de tempo de atendimento, confirmação pelo cliente e Resumo do Dia.
- Requisitos funcionais e não funcionais.
- Riscos de segurança e arquitetura identificados no código.

### 1.3 Convenções utilizadas

- **\[P\]** Presente no protótipo.
- **\[N\]** Novo / recomendado para a versão final.
- **\[A VALIDAR\]** Definição comercial ou de produto pendente.
- **\[RISCO\]** Vulnerabilidade ou limitação técnica.
- **★** Criado ou alterado na v1.1.

O protótipo não representa um produto pronto para produção. As lacunas de arquitetura e segurança estão na Seção 9.

## 2. Visão geral do produto

### 2.1 Resumo

O TapMesa é um SaaS multi-tenant para o setor de hospitalidade. Cada mesa tem um QR Code único. O cliente escaneia, abre uma interface web (sem login e sem aplicativo) e solicita o garçom ou a conta.

### 2.2 Problema que o produto resolve

Reduz a fricção e a espera no atendimento do salão, eliminando a necessidade de buscar contato visual com a equipe. ★ Para o dono, passa a responder perguntas que hoje ficam no achismo: quanto tempo as mesas esperam, em quais horários o salão aperta, quais mesas demoram mais e se o cliente realmente foi atendido.

### 2.3 Funcionamento em alto nível

1. O cliente faz o chamado e o painel da equipe (TV ou tablet) exibe o card com alerta visual, sonoro, voz e cronômetro.
2. ★ O cronômetro conta desde o instante do chamado até a equipe tocar em Atender. Esse tempo é gravado.
3. ★ O celular do cliente avisa que o chamado foi atendido e pede confirmação (Sim / Ainda não).
4. ★ O dono consulta o Resumo do Dia com tempos médios, picos, ranking de mesas e a qualidade do atendimento.

### 2.4 Perfis de usuário

| Perfil        | Descrição                                                                                                               | Autenticação                     |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Admin         | Proprietário do SaaS (TapMesa).                                                                                         | Login com usuário e senha.       |
| Dono / Equipe | Cliente pagante (restaurante). ★ Em V1, separado em Dono/Gerente (vê resumo e configura) e Garçom (vê apenas o painel). | Login criado pelo Admin.         |
| Cliente final | Comensal na mesa. ★ Também confirma o atendimento no próprio celular.                                                   | Nenhuma (acesso anônimo via QR). |

## 3. Permissões e responsabilidades

### 3.1 Matriz de permissões

| Funcionalidade                                            | Admin         | Dono | Cliente |
| --------------------------------------------------------- | ------------- | ---- | ------- |
| Criar / excluir restaurante e login                       | Sim           | Não  | Não     |
| Entrar no painel de qualquer restaurante                  | Sim           | Não  | Não     |
| Gerenciar mesas e QR Codes (próprio restaurante)          | Sim           | Sim  | Não     |
| Personalizar a página do cliente                          | Sim           | Sim  | Não     |
| Ver e atender chamados no painel                          | Sim           | Sim  | Não     |
| Abrir a página da mesa e fazer chamado                    | Não           | Não  | Sim     |
| ★ Confirmar ou contestar o atendimento                    | Não           | Não  | Sim     |
| ★ Ver Resumo do Dia e relatórios                          | Sim (suporte) | Sim  | Não     |
| ★ Configurar metas de atendimento, fuso e dia operacional | Sim           | Sim  | Não     |

### 3.2 Responsabilidades por perfil

- **Admin:** contas, credenciais e acesso irrestrito para suporte.
- **Dono do restaurante:** mesas, impressão dos QR Codes, personalização, operação do painel e ★ acompanhamento do Resumo do Dia e das metas.
- **Cliente final:** chamar, acompanhar o status, ★ confirmar se foi atendido e acessar links externos.

## 4. Fluxos de funcionamento

### 4.1 Visão geral

**Fase 1 — Configuração:** Admin cria restaurante/login ➔ Dono acessa o painel ➔ cria mesas ➔ sistema gera token e QR ➔ ★ Dono define metas de atendimento, fuso e dia operacional (ou usa os padrões).

**Fase 2 — Operação:** Dono imprime QR ➔ Cliente escaneia ➔ Cliente chama ➔ Painel notifica e o cronômetro inicia ➔ Equipe atende ➔ ★ Cliente confirma no celular.

**Fase 3 — Gestão ★:** Dono consulta o Resumo do Dia ➔ identifica picos, mesas lentas e atrasos ➔ ajusta escala e operação.

### 4.2 Fluxo do cliente ★

| Passo | Ator    | Ação                                                                                                                                                                                      |
| ----- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Cliente | Escaneia o QR Code e abre o link com o token.                                                                                                                                             |
| 2     | Sistema | Valida o token e devolve o número da mesa e a aparência do restaurante.                                                                                                                   |
| 3     | Cliente | Aciona Chamar garçom ou Fechar a conta (observação opcional de até 150 caracteres).                                                                                                       |
| 4     | Sistema | Verifica chamado pendente idêntico. Se existir, bloqueia.                                                                                                                                 |
| 5     | Sistema | ★ Registra o chamado como Pendente, grava a hora do chamado (relógio do servidor) e notifica o painel em tempo real. O cronômetro inicia.                                                 |
| 6     | Cliente | Vê o botão em Pendente com o horário. ★ Pode tocar em Cancelar chamado (engano).                                                                                                          |
| 7     | Sistema | ★ Quando a equipe toca em Atender, grava a hora do atendimento e muda para Atendido. O celular exibe: Atendido às HH:MM. Tudo certo? com os botões **Sim, fui atendido** e **Ainda não**. |
| 8a    | Cliente | ★ Toca em Sim: chamado vira Confirmado e grava a hora da confirmação.                                                                                                                     |
| 8b    | Cliente | ★ Toca em Ainda não: chamado é Reaberto, volta ao painel com destaque e o tempo continua contando desde o chamado original.                                                               |
| 8c    | Sistema | ★ Sem resposta em 3 minutos \[A VALIDAR\]: encerra como Atendido sem confirmação.                                                                                                         |
| 9     | Sistema | ★ O botão da tela do cliente é liberado para novo chamado assim que o chamado vira Atendido. A confirmação nunca bloqueia o cliente.                                                      |

**Observações:** se o cliente já tiver feito novo chamado do mesmo tipo, a contestação Ainda não é descartada (já existe chamado pendente). Cada chamado pode ser reaberto no máximo 2 vezes.

### 4.3 Fluxo da equipe e Painel de Atendimentos ★

1. O operador autentica-se e aciona Iniciar painel (habilita áudio no navegador).
2. O sistema entra em tela cheia e mantém a tela ativa.
3. Ao receber chamado: card ordenado do mais antigo ao mais recente, com animação, som e anúncio por voz (TTS).
4. ★ O cronômetro é calculado a partir da hora do chamado gravada no servidor (continua correto mesmo que a TV recarregue ou durma). Cor: Normal ➔ Alerta (padrão 3 min) ➔ Urgente (padrão 5 min), configuráveis. Chamado de Conta tem destaque.
5. ★ Chamados reabertos aparecem com selo **Reaberto** e prioridade visual.
6. A equipe toca em **Atender**: o card sai da fila e o tempo de resposta é gravado.
7. ★ Uma faixa Atendidos recentes lista os últimos 10 chamados com o status de confirmação (aguardando, confirmado, contestado), para a equipe ver se alguém disse que não foi atendido.

### 4.4 Estados de um chamado ★

| De       | Para                      | Gatilho                                                   | Marco gravado                             |
| -------- | ------------------------- | --------------------------------------------------------- | ----------------------------------------- |
| (Início) | Pendente                  | Cliente toca no botão de chamado.                         | criadoEm                                  |
| Pendente | Atendido                  | Equipe toca em Atender.                                   | atendidoEm                                |
| Pendente | Cancelado                 | Cliente cancela o chamado.                                | canceladoEm                               |
| Pendente | Expirado                  | Nenhum atendimento em 20 minutos (executado no servidor). | expiradoEm                                |
| Atendido | Confirmado                | Cliente toca em Sim, fui atendido.                        | confirmadoEm                              |
| Atendido | Encerrado sem confirmação | Janela de 3 minutos sem resposta.                         | encerradoEm                               |
| Atendido | Pendente (Reaberto)       | Cliente toca em Ainda não.                                | reabertoEm (criadoEm original preservado) |

Um novo chamado do mesmo tipo, depois de Atendido, cria um registro novo (não reaproveita o anterior).

### 4.5 Roteamento

| URL / Rota                    | Resultado esperado                                       |
| ----------------------------- | -------------------------------------------------------- |
| ?m=TOKEN                      | Página de acesso do cliente final (sem sessão).          |
| (sem token)                   | Redirecionamento para a tela de login.                   |
| ?aba=restaurantes             | Visão Admin: lista e gerenciamento de restaurantes.      |
| ?r=ID&aba=...                 | Visão Admin: acesso de suporte a restaurante específico. |
| ?aba=atendimentos             | Visão Dono: painel operacional.                          |
| ★ ?aba=resumo                 | Visão Dono: Resumo do Dia (dia operacional atual).       |
| ★ ?aba=resumo&data=AAAA-MM-DD | Resumo de um dia específico.                             |
| ★ ?aba=configuracoes          | Metas de atendimento, fuso, dia operacional.             |

### 4.6 Medição dos tempos ★

Linha do tempo de um chamado:

**criadoEm (T0)** ➔ **atendidoEm (T1)** ➔ **confirmadoEm (T2)**

| Indicador             | Definição                                                                             |
| --------------------- | ------------------------------------------------------------------------------------- |
| Tempo de resposta     | T1 − T0 (primeiro atendimento). É o indicador principal de agilidade da equipe.       |
| Tempo de resolução    | Último atendidoEm − T0. Igual ao tempo de resposta quando o chamado não foi reaberto. |
| Tempo até confirmação | T2 − T1. Mostra a reação do cliente, não a qualidade da equipe.                       |
| Tempo de espera atual | Agora − T0 dos chamados ainda pendentes (cronômetro do painel).                       |

**Regras de medição:**

- Todos os instantes usam o relógio do servidor, nunca o do celular ou da TV.
- Média, mediana e P90 consideram apenas chamados Atendidos. Expirados e Cancelados são contados à parte.
- Reabertos preservam o criadoEm original: a insatisfação do cliente aparece nas métricas.
- Garçom e Conta são medidos separadamente (o tempo da conta indica giro de mesa).
- Média sozinha engana (um chamado de 20 min distorce o dia). Por isso o Resumo traz também **mediana** e **P90** (90% dos chamados foram atendidos em até X).

### 4.7 Fluxo do dono: Resumo do Dia ★

1. O Dono abre a aba **Resumo** e vê o dia operacional atual, atualizado em tempo quase real.
2. Consulta os indicadores. Valores fora da meta ficam destacados.
3. Analisa o gráfico por hora para identificar picos e horários com atraso.
4. Consulta o ranking de mesas e a lista de chamados com linha do tempo para investigar casos.
5. Compara com o dia anterior e com o mesmo dia da semana anterior.
6. Exporta (CSV/PDF) ou recebe o resumo por e-mail no fechamento \[V1\].

**Blocos da tela:**

| Bloco                  | Conteúdo                                                                                                                                                                          | Decisão que apoia                                  |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Cabeçalho              | Data operacional, seletor de período (hoje, ontem, 7 dias, 30 dias, personalizado).                                                                                               | Navegar no histórico.                              |
| Indicadores principais | Total de chamados (garçom / conta), atendidos, pendentes agora, tempo médio de resposta, mediana, P90, maior espera, % dentro da meta, taxa de confirmação, reabertos, expirados. | Saber se o dia está bom ou ruim.                   |
| Chamados por hora      | Volume e tempo médio de resposta por hora.                                                                                                                                        | Dimensionar escala e reforço nos picos.            |
| Ranking de mesas       | Mesas com mais chamados e com maior tempo médio.                                                                                                                                  | Achar mesas mal posicionadas ou áreas descobertas. |
| Lista de chamados      | Mesa, tipo, T0, T1, T2, status, observação.                                                                                                                                       | Investigar reclamações.                            |
| Comparativo            | Variação contra ontem e contra o mesmo dia da semana anterior.                                                                                                                    | Medir evolução.                                    |

**Dia operacional:** o dia não termina à meia-noite em restaurante com operação noturna. O dono define o horário de corte (padrão 05:00 \[A VALIDAR\]) e o fuso do estabelecimento. Todos os resumos usam essa janela.

**Taxa de confirmação e reabertos:** são o sinal de qualidade. Taxa de reabertos alta, ou muitos Atender sem confirmação, pode indicar garçom tocando em Atender só para limpar a tela.

## 5. Modelo de dados

Estrutura hierárquica sugerida ★:

```
Restaurante
├── Usuários (credenciais e perfis)
├── Aparência (configurações visuais)
├── Configurações de atendimento ★ (metas, fuso, dia operacional)
├── Mesas (tokens e numeração)
│   └── Chamados ★ (registro por chamado, nunca sobrescrito)
│       └── Eventos ★ (histórico imutável, append-only)
└── Resumos diários ★ (agregados para o painel de resumo)
```

### 5.1 Entidades principais

| Entidade          | Campos principais                                                                                                                                                                                                                                                               | Observações                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| restaurante       | id, nome, usuario, criadoEm, ★ fuso, ★ diaCorteHora, ★ metaRespostaSeg (180), ★ alertaUrgenteSeg (300), ★ janelaConfirmacaoSeg (180)                                                                                                                                            | Gerenciado pelo Admin. As metas são editáveis pelo Dono.                                                                                                    |
| usuario           | uid, usuario, papel, restauranteId                                                                                                                                                                                                                                              | No Auth, o usuário é abstraído para usuario@dominio.                                                                                                        |
| aparencia         | nome, descricao, logo, fundo\_tipo, cores, textos, redes\_sociais                                                                                                                                                                                                               | Objeto público carregado na leitura do QR.                                                                                                                  |
| mesa              | token, numero, restauranteId, criadoEm                                                                                                                                                                                                                                          | Token de 10 caracteres é a chave; numero é visual.                                                                                                          |
| chamado ★         | id (único), restauranteId, mesaId, numeroMesa (cópia na data), tipo, observacao, status, criadoEm, primeiroAtendidoEm, atendidoEm, confirmadoEm, canceladoEm, expiradoEm, confirmacao (cliente / automática), reaberturas, diaOperacional, atendidoPor \[V1\], avaliacao \[V1\] | Substitui a chave chamado\_chave\_token\_tipo, que sobrescrevia o registro e impedia histórico. Os tempos de resposta e resolução são derivados dos marcos. |
| chamado\_evento ★ | id, chamadoId, tipo (criado, atendido, confirmado, reaberto, cancelado, expirado), ts, origem (cliente, equipe, sistema), usuarioId (quando houver)                                                                                                                             | Append-only. Fonte da verdade para auditoria e relatórios.                                                                                                  |
| resumo\_diario ★  | restauranteId, diaOperacional, totais por tipo e status, soma de tempos, P50, P90, contagem por hora, ranking de mesas                                                                                                                                                          | Pré-calculado no servidor para o Resumo carregar rápido. Recalculável a partir dos eventos.                                                                 |

**Mesa excluída:** os chamados antigos permanecem (com numeroMesa guardado) para não apagar o histórico do restaurante. Muda em relação ao protótipo, que removia os chamados pendentes (RF-D05 continua válido para os pendentes).

## 6. Requisitos funcionais

### 6.1 Administração do SaaS (Admin)

| ID     | Requisito                                                                     | Origem        |
| ------ | ----------------------------------------------------------------------------- | ------------- |
| RF-A01 | Login de acesso restrito ao Admin com usuário e senha.                        | \[P\]         |
| RF-A02 | Cadastrar restaurante com nome, usuário e senha válidos.                      | \[P\]         |
| RF-A03 | Geração automática de senha forte (8 caracteres não ambíguos).                | \[P\]         |
| RF-A04 | Exibir dados de acesso uma única vez, com função Copiar.                      | \[P\]         |
| RF-A05 | Listar restaurantes ativos com nome, usuário e data de criação.               | \[P\]         |
| RF-A06 | Acessar painel de qualquer restaurante para suporte (personificação).         | \[P\]         |
| RF-A07 | Excluir restaurante em cascata (login, mesas, chamados) mediante confirmação. | \[P\]         |
| RF-A08 | Impedir usuários duplicados e bloquear o nome reservado admin.                | \[P\]         |
| RF-A09 | Suspender e reativar restaurante sem excluir dados.                           | \[N\]         |
| RF-A10 | Redefinir a senha do dono do restaurante.                                     | \[N\]         |
| RF-A11 | Gestão de plano contratado, vencimento e limite de mesas.                     | \[A VALIDAR\] |
| RF-A12 | Dashboard administrativo (volume de restaurantes e chamados).                 | \[N\]         |

### 6.2 Gestão do Restaurante (Dono / Equipe)

| ID     | Requisito                                                                                                                                                | Origem  |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| RF-D01 | Login e logout restritos ao próprio restauranteId.                                                                                                       | \[P\]   |
| RF-D02 | Gerar mesas em lote (1 a 50 por vez), bloqueando duplicados.                                                                                             | \[P\]   |
| RF-D03 | Sugerir automaticamente o próximo número de mesa disponível.                                                                                             | \[P\]   |
| RF-D04 | Gerenciar mesa (visualizar QR, link, copiar, excluir).                                                                                                   | \[P\]   |
| RF-D05 | Excluir mesa (invalida o QR e remove chamados pendentes; ★ chamados concluídos permanecem no histórico).                                                 | \[P\] ★ |
| RF-D06 | Gerar página para impressão de QR Codes (logo, nome, número).                                                                                            | \[P\]   |
| RF-D07 | Personalizar identidade (nome, descrição, upload de logotipo).                                                                                           | \[P\]   |
| RF-D08 | Personalizar fundo da tela (cor sólida ou imagem com película).                                                                                          | \[P\]   |
| RF-D09 | Personalizar cores e mensagens da interface.                                                                                                             | \[P\]   |
| RF-D10 | Prévia (mockup) em tempo real da interface do cliente.                                                                                                   | \[P\]   |
| RF-D11 | Restaurar cores e textos para o padrão.                                                                                                                  | \[P\]   |
| RF-D12 | Parametrizar links externos (sociais e Google) com correção de https://.                                                                                 | \[P\]   |
| RF-D13 | Operar painel de chamados em tempo real (lista, contadores, relógio).                                                                                    | \[P\]   |
| RF-D14 | Alerta sonoro distinto e alerta de voz nativo TTS (pt-BR).                                                                                               | \[P\]   |
| RF-D15 | Exibir cronômetro de espera calculado a partir da hora do chamado gravada no servidor, escalonando o estado visual (alerta e urgente, padrão 3 e 5 min). | \[P\] ★ |
| RF-D16 | Ação Atender: grava atendidoEm, muda o chamado para Atendido e dispara a pergunta de confirmação no celular do cliente.                                  | \[P\] ★ |
| RF-D17 | Expirar chamados não atendidos após 20 minutos, executado no servidor, com status Expirado (não Atendido).                                               | \[P\] ★ |
| RF-D18 | Painel em tela cheia, forçando tela sempre ligada.                                                                                                       | \[P\]   |
| RF-D19 | Histórico analítico (tempo médio, picos, mesas). Absorvido pela seção 6.4.                                                                               | \[N\] ★ |
| RF-D20 | Múltiplos logins por restaurante com controle de perfis (Dono/Gerente e Garçom).                                                                         | \[N\]   |
| RF-D21 | Notificação push para o celular da equipe.                                                                                                               | \[N\]   |
| RF-D22 | Segmentar mesas por setor, com atribuição direcionada a garçons.                                                                                         | \[N\]   |
| RF-D23 | Pausar mesa temporariamente sem excluí-la.                                                                                                               | \[N\]   |
| RF-D24 | Configurar metas: meta de resposta (padrão 3 min), limiar urgente (5 min) e janela de confirmação (3 min).                                               | \[N\] ★ |
| RF-D25 | Configurar fuso horário e hora de corte do dia operacional (padrão 05:00).                                                                               | \[N\] ★ |
| RF-D26 | Exibir selo Reaberto e prioridade visual nos chamados contestados pelo cliente.                                                                          | \[N\] ★ |
| RF-D27 | Faixa Atendidos recentes (últimos 10) com status de confirmação: aguardando, confirmado, contestado.                                                     | \[N\] ★ |
| RF-D28 | Ao recarregar ou religar o painel, restaurar a fila e os cronômetros a partir do servidor, sem perder chamados.                                          | \[N\] ★ |

### 6.3 Interface do Cliente Final

| ID     | Requisito                                                                                                                                | Origem          |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| RF-C01 | Acessar a interface via QR Code (sem login, senha ou app).                                                                               | \[P\]           |
| RF-C02 | Visualizar identidade da marca e indicador de conectividade.                                                                             | \[P\]           |
| RF-C03 | Acionar botões de chamado com estados visuais dinâmicos.                                                                                 | \[P\]           |
| RF-C04 | Incluir observação em texto (até 150 caracteres) no chamado.                                                                             | \[P\]           |
| RF-C05 | Bloquear o envio caso exista chamado pendente idêntico.                                                                                  | \[P\]           |
| RF-C06 | Visualizar confirmação com a hora do pedido.                                                                                             | \[P\]           |
| RF-C07 | Receber atualização em tempo real quando o chamado for atendido; ★ exibir a pergunta de confirmação e liberar o botão para novo chamado. | \[P\] ★         |
| RF-C08 | Feedback háptico (vibração leve) ao confirmar ações.                                                                                     | \[P\]           |
| RF-C09 | Acessar links sociais e de avaliação parametrizados.                                                                                     | \[P\]           |
| RF-C10 | Tratamento amigável de exceções (falha de rede, QR inválido).                                                                            | \[P\]           |
| RF-C11 | Internacionalização (inglês/espanhol).                                                                                                   | \[N\]           |
| RF-C12 | Pesquisa de satisfação (NPS) completa após a baixa do chamado.                                                                           | \[N\]           |
| RF-C13 | Confirmar atendimento com um toque (Sim, fui atendido). Grava confirmadoEm.                                                              | \[N\] ★         |
| RF-C14 | Contestar o atendimento (Ainda não): reabre o chamado, preserva o tempo original, máximo de 2 reaberturas.                               | \[N\] ★         |
| RF-C15 | Encerrar automaticamente como Atendido sem confirmação ao fim da janela (padrão 3 min).                                                  | \[N\] ★         |
| RF-C16 | Cancelar chamado pendente (engano). Não entra nas médias de tempo.                                                                       | \[N\] ★         |
| RF-C17 | Exibir ao cliente o tempo de espera decorrido, configurável pelo Dono (padrão desligado).                                                | \[A VALIDAR\] ★ |
| RF-C18 | Avaliação rápida opcional (3 carinhas) logo após confirmar.                                                                              | \[N\] ★         |

### 6.4 Resumo do Dia e controle de atendimento ★

| ID     | Requisito                                                                                                                                                                                                 | Origem  |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| RF-R01 | Aba Resumo no menu do Dono, abrindo no dia operacional atual.                                                                                                                                             | \[N\] ★ |
| RF-R02 | Indicadores: total de chamados (garçom/conta), atendidos, pendentes agora, tempo médio de resposta, mediana, P90, maior espera, % dentro da meta, taxa de confirmação, reabertos, expirados e cancelados. | \[N\] ★ |
| RF-R03 | Atualização em tempo quase real (até 30 s) enquanto o dia está aberto.                                                                                                                                    | \[N\] ★ |
| RF-R04 | Seletor de período: hoje, ontem, 7 dias, 30 dias, personalizado.                                                                                                                                          | \[N\] ★ |
| RF-R05 | Gráfico de chamados e tempo médio de resposta por hora (identificação de picos).                                                                                                                          | \[N\] ★ |
| RF-R06 | Ranking de mesas por volume de chamados e por maior tempo médio.                                                                                                                                          | \[N\] ★ |
| RF-R07 | Lista de chamados do período com linha do tempo (criado, atendido, confirmado), status, observação e filtros por tipo, status e mesa.                                                                     | \[N\] ★ |
| RF-R08 | Comparativo com o dia anterior e com o mesmo dia da semana anterior.                                                                                                                                      | \[N\] ★ |
| RF-R09 | Destacar visualmente indicadores fora da meta configurada.                                                                                                                                                | \[N\] ★ |
| RF-R10 | Exportar o período em CSV e PDF.                                                                                                                                                                          | \[N\] ★ |
| RF-R11 | Enviar resumo automático ao dono por e-mail no fechamento do dia operacional.                                                                                                                             | \[N\] ★ |
| RF-R12 | Alertar o dono quando houver chamados acima do limiar urgente ou o tempo médio da última hora superar a meta.                                                                                             | \[N\] ★ |
| RF-R13 | Métricas por garçom (exige RF-D20 e RF-D22).                                                                                                                                                              | \[N\] ★ |
| RF-R14 | Visão separada por tipo: tempo da conta indica giro de mesa.                                                                                                                                              | \[N\] ★ |
| RF-R15 | Acesso restrito a Dono/Gerente do próprio restaurante e ao Admin em modo suporte.                                                                                                                         | \[N\] ★ |
| RF-R16 | Estado vazio claro para dias sem chamados ou sem dados.                                                                                                                                                   | \[N\] ★ |

## 7. Regras de negócio

| ID    | Regra de negócio                                                                                                                                                                          |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RN-01 | Unicidade de fila: só é permitido um chamado Pendente (incluindo reaberto) por mesa e por tipo. ★                                                                                         |
| RN-02 | Independência: chamados de Garçom e Conta podem coexistir pendentes.                                                                                                                      |
| RN-03 | Identidade: o número da mesa é único no restaurante; o token é único globalmente.                                                                                                         |
| RN-04 | Segurança na borda: o QR codifica apenas o token, ocultando IDs do restaurante.                                                                                                           |
| RN-05 | Exclusão: excluir uma mesa invalida seu QR instantaneamente e remove os pendentes; o histórico de chamados concluídos é mantido. ★                                                        |
| RN-06 | Propagação: alterações visuais refletem aos clientes apenas após Salvar.                                                                                                                  |
| RN-07 | Credenciais: a senha de um novo restaurante é exibida uma única vez.                                                                                                                      |
| RN-08 | Isolamento: o Dono acessa apenas dados do seu restauranteId.                                                                                                                              |
| RN-09 | Parâmetros: expiração (20 min) e limite de texto (150 caracteres) são constantes. Alerta, urgente, meta de resposta e janela de confirmação são configuráveis (padrão 3, 5, 3 e 3 min). ★ |
| RN-10 | Relógio único: todos os instantes usam a hora do servidor, nunca a do celular ou da TV. ★                                                                                                 |
| RN-11 | Tempo de resposta = primeiro atendimento menos criação. Reabrir um chamado não zera o tempo. ★                                                                                            |
| RN-12 | Confirmação é opcional e não bloqueante: sua ausência não invalida o atendimento nem altera o tempo de resposta. ★                                                                        |
| RN-13 | Cada chamado pode ser reaberto no máximo 2 vezes. Depois disso, permanece Atendido e fica sinalizado como contestado. ★                                                                   |
| RN-14 | Expirados e Cancelados ficam fora de média, mediana e P90 e são reportados à parte. Expirados entram no denominador de % dentro da meta; Cancelados não. ★                                |
| RN-15 | Dia operacional: o chamado pertence ao dia operacional em que foi criado, conforme fuso e hora de corte do restaurante. ★                                                                 |
| RN-16 | Eventos são imutáveis: correções geram novo evento, nunca edição ou exclusão. ★                                                                                                           |
| RN-17 | Confirmação: qualquer aparelho que abra o token da mesa pode responder enquanto o chamado estiver Atendido. A primeira resposta vale, sujeita a rate limit. ★                             |
| RN-18 | Visibilidade: resumo e relatórios só para Dono/Gerente. Métricas individuais por garçom só se o Dono habilitar. \[A VALIDAR\] ★                                                           |

## 8. Requisitos não funcionais

| ID     | Categoria           | Requisito                                                                                              | Meta sugerida              |
| ------ | ------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------- |
| RNF-01 | Desempenho          | Latência do chamado até a notificação no painel.                                                       | ≤ 2 s (p95)                |
| RNF-02 | Desempenho          | Carregamento (FCP) da interface em 4G.                                                                 | ≤ 2 s                      |
| RNF-03 | Disponibilidade     | Uptime do back-end.                                                                                    | ≥ 99,5% \[A VALIDAR\]      |
| RNF-04 | Tempo real          | Sincronização bidirecional sem refresh (WebSockets/SSE).                                               | Obrigatório                |
| RNF-05 | Usabilidade         | Mobile-first, alvos de toque ≥ 64 px, tipografia base 16 px.                                           | Obrigatório                |
| RNF-06 | Usabilidade         | Painel responsivo para leitura à distância (TV) com alto contraste.                                    | Obrigatório                |
| RNF-07 | Acessibilidade      | Foco visível, rótulos ARIA, suporte a prefers-reduced-motion.                                          | WCAG 2.1 AA                |
| RNF-08 | Segurança           | Tráfego HTTPS e senhas com hash.                                                                       | Obrigatório                |
| RNF-09 | Segurança           | Autorização multi-tenant rigorosa no servidor.                                                         | Obrigatório                |
| RNF-10 | Segurança           | Rate limit contra spam (inclui chamados e confirmações). ★                                             | Obrigatório                |
| RNF-11 | Segurança           | Sanitização contra XSS em campos de texto livre.                                                       | Obrigatório                |
| RNF-12 | Segurança           | Tokens de mesa com alta entropia (50 bits).                                                            | Mantido                    |
| RNF-13 | Privacidade         | Sem coleta de dados pessoais identificáveis (LGPD). ★ A avaliação rápida e a confirmação são anônimas. | Obrigatório                |
| RNF-14 | Compatibilidade     | Chrome, Safari iOS 15+, Android WebView, TV.                                                           | Obrigatório                |
| RNF-15 | Resiliência         | Indicar offline, tratar perdas de conexão e retry automático.                                          | Obrigatório                |
| RNF-16 | Escalabilidade      | Arquitetura com escalabilidade horizontal.                                                             | Obrigatório                |
| RNF-17 | Manutenção          | Separação de front-end, regras de negócio e repositórios.                                              | Recomendado                |
| RNF-18 | Observabilidade     | Logs centrais, métricas de latência e alertas.                                                         | Recomendado                |
| RNF-19 | Backup              | Rotina de backup isolada e diária.                                                                     | Recomendado                |
| RNF-20 | Impressão           | QR Code com correção de erros nível M e contraste preservado.                                          | Obrigatório                |
| RNF-21 | Precisão de tempo ★ | Marcos de tempo gravados no servidor, com sincronização de relógio (NTP). Erro máximo de 1 s.          | Obrigatório                |
| RNF-22 | Desempenho ★        | Carregamento do Resumo do Dia, usando agregados pré-calculados.                                        | ≤ 2 s (período de 30 dias) |
| RNF-23 | Retenção ★          | Guardar eventos e agregados para comparativos.                                                         | ≥ 13 meses \[A VALIDAR\]   |
| RNF-24 | Consistência ★      | Operações Atender, Confirmar e Reabrir idempotentes: toque duplo ou reenvio não duplica eventos.       | Obrigatório                |

## 9. Lacunas e riscos

| #    | Achado técnico                                        | Impacto                                                          | Recomendação                                                                                                                                |
| ---- | ----------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | localStorage e senha admin fixa no código. \[RISCO\]  | Inviável para produção.                                          | Provedor de autenticação e banco reais.                                                                                                     |
| 2    | Arquivo firestore.rules ausente. \[RISCO\]            | Segurança multi-tenant não garantida.                            | RBAC na camada de banco/API.                                                                                                                |
| 3    | Front-end grava chamados direto no banco. \[RISCO\]   | Suscetível a spam.                                               | Gravar via API com validação.                                                                                                               |
| 4    | Registro de chamado sofre overwrite.                  | Quebra histórico e relatórios (e o Resumo do Dia depende disso). | Registro por chamado + eventos append-only (seção 5).                                                                                       |
| 5    | Expiração de 20 min executada no navegador do painel. | Impacto operacional se a TV desligar.                            | Expiração no servidor (job agendado).                                                                                                       |
| 6    | Exclusão de conta não apaga o Auth em cascata.        | Contas órfãs.                                                    | Tratar exclusão no servidor.                                                                                                                |
| 7    | Imagens em base64 no banco (\~900 KB).                | Performance no cliente.                                          | Storage em nuvem com CDN.                                                                                                                   |
| 8    | Painel vulnerável à suspensão do navegador.           | Perda de chamados.                                               | PWA com WakeLock e push.                                                                                                                    |
| 9    | Monousuário, sem recuperação de senha.                | Atrito de suporte.                                               | Multi-login e recuperação por e-mail.                                                                                                       |
| 10   | Sem gateway de pagamento.                             | Limitação comercial.                                             | Billing de assinatura \[A VALIDAR\].                                                                                                        |
| 11   | Domínio fixo na personalização.                       | Fricção em clientes premium.                                     | Subdomínios (CNAME) \[N\].                                                                                                                  |
| 12 ★ | Atender usado só para limpar a tela, sem ir à mesa.   | Tempo de resposta artificialmente baixo.                         | Confirmação do cliente, taxa de reabertos e de confirmação no resumo; em V1, etapa Assumir com identificação do garçom.                     |
| 13 ★ | Baixa adesão à confirmação.                           | Indicador de qualidade enviesado.                                | Confirmação não bloqueante; tempo de resposta baseado no Atender; botões grandes e texto curto; taxa de confirmação mostrada como contexto. |
| 14 ★ | Confirmações abusivas ou brincadeiras.                | Reaberturas falsas.                                              | Rate limit, só aceitar em chamado Atendido, limite de 2 reaberturas, eventos auditáveis.                                                    |
| 15 ★ | Métricas individuais por garçom.                      | Conflito com a equipe e possíveis implicações trabalhistas.      | Começar com métricas do salão; habilitar visão individual só por decisão do Dono \[A VALIDAR\].                                             |
| 16 ★ | Consultas de resumo lentas com muito volume.          | Painel travado.                                                  | Agregados pré-calculados por dia (resumo\_diario).                                                                                          |
| 17 ★ | Fuso ou hora de corte mal configurados.               | Chamados caem no dia errado.                                     | Padrões sensatos e pré-visualização ao configurar.                                                                                          |

## 10. Arquitetura e roadmap

### 10.1 Opções de arquitetura

- **Opção A (time-to-market):** BaaS com Firebase (Auth, Firestore, Cloud Functions). Segurança via Firestore Rules. ★ Expiração, agregados do resumo e encerramento automático da confirmação rodam em Cloud Functions agendadas.
- **Opção B (controle):** PWA com API dedicada (Node.js/NestJS), PostgreSQL, WebSockets/SSE, Redis e Storage S3. ★ Eventos em tabela append-only, agregados diários por job e visões materializadas para o Resumo.

### 10.2 MVP

**Fundação operacional:** todos os itens \[P\] sobre infraestrutura real, com brechas de segurança fechadas, persistência imutável e storage em CDN. ★ Inclui desde o primeiro dia, porque dados de tempo não podem ser reconstruídos depois: marcos de tempo no servidor, eventos de chamado, estados completos (Pendente, Atendido, Confirmado, Reaberto, Expirado, Cancelado), confirmação pelo cliente, metas configuráveis e Resumo do Dia básico (indicadores, gráfico por hora, lista com linha do tempo).

### 10.3 V1

**Operação e gestão:** múltiplos acessos com perfis, assinaturas, PWA com push e recuperação de senha. ★ Resumo avançado: ranking de mesas, comparativos, exportação CSV/PDF, e-mail de fechamento do dia, alertas ao dono, avaliação rápida (3 carinhas), etapa Assumir e atendidoPor.

### 10.4 V2

**Expansão e integrações:** roteamento por setor/garçom, multilíngue, NPS completo e APIs para PDV/cardápio. ★ Métricas por garçom e previsão de picos por dia da semana.

## 11. Pontos pendentes de validação

- &#91;A VALIDAR\] Matriz de precificação (planos, limites, meios de pagamento).
- &#91;A VALIDAR\] Política de teste grátis (trial).
- &#91;A VALIDAR\] Necessidade de módulo de cardápio digital.
- &#91;A VALIDAR\] Responsabilidade logística de displays e impressão.
- &#91;A VALIDAR\] Regras de white-label (domínios próprios).
- &#91;A VALIDAR\] SLAs de sistema, suporte e retenção de histórico (sugestão: 13 meses).
- &#91;A VALIDAR\] ★ Meta de resposta padrão (3 min), limiar urgente (5 min) e janela de confirmação (3 min).
- &#91;A VALIDAR\] ★ Hora de corte padrão do dia operacional (05:00).
- &#91;A VALIDAR\] ★ O cliente deve ver o cronômetro de espera ou apenas o horário do chamado?
- &#91;A VALIDAR\] ★ Confirmação aceita de qualquer aparelho da mesa (RN-17) ou só do aparelho que chamou?
- &#91;A VALIDAR\] ★ Métricas individuais por garçom: quando e como liberar, e quem pode ver.
- &#91;A VALIDAR\] ★ Resumo deve ser visível para o perfil Garçom ou só para Dono/Gerente?

## 12. Considerações finais

O protótipo valida bem o comportamento e a usabilidade, com barreira zero de adoção para o consumidor. Com a v1.1, o produto deixa de ser apenas um aviso para a equipe e passa a ser uma ferramenta de gestão: o cronômetro mede a agilidade, a confirmação do cliente valida que o atendimento aconteceu e o Resumo do Dia transforma isso em decisão (escala, posicionamento de mesas, picos). Recomenda-se homologar as premissas da Seção 11 e seguir com o MVP, que corrige as vulnerabilidades da Seção 9 e já nasce gravando os marcos de tempo e eventos, pois esses dados não podem ser recuperados retroativamente.
