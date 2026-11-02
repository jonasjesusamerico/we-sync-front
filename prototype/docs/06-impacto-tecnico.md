# 06 — Impacto técnico

Comparação entre o que o protótipo mostra e o que existe hoje. Serve de base para os requisitos formais; **não é
um design final** de banco ou API (isso é papel do agente `arquiteto` em `we-sync-requirements`).

## O que a API já tem (`we-sync-api`, 31/10/2026)

| Recurso | Rotas | Observações |
|---|---|---|
| Auth | `POST /api/v1/auth/register`, `login`, `refresh`, `logout` | `users` tem só **e-mail** e senha (sem nome) |
| Compras | `GET/POST /purchases`, `GET/PUT/DELETE /purchases/{id}` | data, descrição, categoria, forma de pagamento, valor (decimal), situação `PENDING/PAID/CANCELED` |
| Categorias | `GET/POST /categories`, `PUT/DELETE /categories/{id}` | 6 globais + do usuário; **sem ícone, cor nem tópicos** |
| Formas de pagamento | `GET/POST /payment-methods`, `PUT/DELETE /payment-methods/{id}` | 6 globais + do usuário |

Regra de segurança atual: **cada usuário só vê os próprios dados** (isolamento por `user_id`).

## O que falta, por assunto

| Assunto | Novo no back-end (ideia) | Regras |
|---|---|---|
| Perfil | `users.name`; preferência **dia de início do mês financeiro**; confirmação de e-mail e recuperação de senha | CONF-01, CONF-06, NOT-03 |
| Administração | `users.is_admin` (flag marcada direto no banco) checada na API; rotas `/admin`; configuração geral (salário mínimo com vigência, cadastros padrão, palavras-chave, parâmetros, validade do convite, taxas da B3, CDI manual); **auditoria** (quem, quando, o quê) | ADM-*, DIV-06 |
| Investimentos | caixinhas pessoais; **ativos** (ação, FII, Tesouro), **posições** (quantidade, preço médio), **operações** (compra/venda, taxas, corretora), **corretoras do usuário** (corretagem fixa/% e **saldo**), **saques**, **proventos**, **cotações diárias**; lançamento mensal do tipo Investimento | INV-*, CASA-07 |
| Catálogo de ativos | tabela de ativos (código, nome, tipo, ativo/pausado, último fechamento, data, fonte, situação) mantida pelo admin; posições referenciam o catálogo; **pedidos de cadastro** (código, quem pediu, situação); job do Tesouro cadastra os títulos sozinho | INV-13..INV-15, ADM-09 |
| Job de cotações | todo dia às 00:00, fechamento de cada ativo ativo **do catálogo** (uma consulta por ativo), idempotente por data (2 instâncias); provedor trocável (brapi no começo), token em variável de ambiente | INV-03, `08` |
| Job do Tesouro | todo dia: baixa o CSV do Tesouro Transparente e grava o PU da última data-base de cada título | INV-07, `08` |
| Dependências externas | Banco Central (CDI, salário mínimo), Tesouro Transparente, brapi; atribuição das fontes ODbL nas telas | `08` |
| Rendas | tabela de rendas **com vigência por mês** (versões: valor, válido a partir de AAAA-MM), tipo, frequência, dia, ativa | CONF-02/03, DIV-01..04 |
| Categorias | ícone e cor nas categorias próprias; **tópicos** (subcategorias) globais e do usuário; `purchases.topic_id` opcional; sugestão por descrição/histórico | CONF-04, TOP-* |
| Repetição | **série** de lançamentos (tipo fixa/parcelada, N, início, valor por parcela ou total) e `purchases.series_id` + posição k/N; editar "só esta / esta e as próximas" | REP-* |
| Casa | casa, membros (máx. 2), **convites** (código, validade 48h, uso único, reenviar invalida o anterior), dia de início do mês, **renda mínima**, arquivamento (valores pausados, caixinhas migram para o pessoal) | CASA-*, DIV-06 |
| Compra compartilhada | `purchases.household_id` (ou flag) — dono continua sendo quem registrou | LAN-02..04 |
| Acerto | acerto por mês (modo, status, valores congelados, travamento/reabertura) | ACE-* |
| Caixinhas | caixinhas (instituição, titular, % CDI) com **dono = casa ou usuário** (migram ao arquivar), **movimentações** (depósito/resgate em partes, provisório/confirmado/desfeito, data), ajustes de saldo | CX-*, RES-*, CASA-07 |
| CDI | tabela CDI diário (data única) + **job semanal** idempotente (2 instâncias: `app1`, `app2`) | CDI-* |
| Metas | metas mensais e por tópico com **escopo** (usuário ou casa) | MET-* |
| Relatórios/padrões | endpoint de relatório por escopo e mês (projeção, tendência, desvio, frequência, ticket) calculado na API | MET-07, PAD-* |
| Tour guiado | estado por usuário, tour, versão e plataforma (visto / não exibir); data de criação da conta para decidir "novidade" × tour completo; conteúdo dos passos fica no front | TOUR-* |
| Sonhos | sonho (nome, valor, mês alvo, casa) ligado a uma caixinha exclusiva; plano e previsão calculados na API | SON-* |
| Encontro do mês | endpoint por casa e mês fechado que monta os 5 passos com a rotina de metas/padrões (nada gravado) | ENC-* |
| Notificações | notificações no site e no app (lida/não lida, **push no Android**), agendadas (confirmação no dia seguinte), destinatários | NOT-*, CX-05 |
| Dependência externa | API do Banco Central (SGS) | CDI-01 |

## Pontos de atenção

1. **Segurança / isolamento (o mais sensível)**: hoje é "só o dono". Com a casa passa a ser "o dono **ou** um membro
   da casa", **apenas** para dados compartilhados (compras marcadas, rendas para a divisão, caixinhas, acerto).
   Exige especificação cuidadosa e testes de vazamento entre usuários (inclusive após sair da casa).
2. **Centralizar os cálculos na API** (D-05): divisão, acerto, padrão, projeção, tendência. Front web e app Android
   só exibem. Uma rotina única com parâmetro de escopo (usuário/casa).
3. **Dinheiro**: continuar com `decimal` na API e centavos inteiros no front; arredondamento só no resultado.
4. **Datas sem hora** (`AAAA-MM-DD`) e **mês financeiro** com dia de início configurável afetam todos os cálculos
   mensais (ver pendência P-05).
5. **Job em 2 instâncias**: gravação idempotente por data (ou trava no banco) para não duplicar.
6. **Rendimento é estimativa**: IR/IOF variam por banco; por isso o "Ajustar saldo".
7. **Front novo**: Angular + Bootstrap 5.3, componentes standalone, baseado no design system (`02-design-system.md`).
   O front atual na `master` ainda é o antigo (Material); o `docker-compose.yml` da API sobe o serviço `front` a
   partir de `../we-sync-front`, então a troca precisa ser coordenada.

## Quem pode ver e mexer em quê (rascunho)

Rascunho para o arquiteto da feature 017 (Nossa casa) fechar. Cada célula vale para **ver / criar / editar /
apagar**, conferidas **na API** em cada requisição (esconder no front não basta). Testes de vazamento: cada linha ×
cada coluna, com ids antigos e links vencidos.

Quem: **Dono** = quem registrou o dado · **Membro** = o outro da casa ativa · **Ex-membro** = quem estava numa casa
que foi arquivada · **Convidado** = tem um link de convite válido e ainda não aceitou · **Fora** = qualquer outra
conta (inclui link vencido, já usado ou substituído). O **admin** nunca vê dados de usuários (ADM-08).

| Dado | Dono | Membro | Ex-membro (casa arquivada) | Convidado | Fora | Regras |
|---|---|---|---|---|---|---|
| Compra pessoal | tudo | nada | nada | nada | nada | LAN-02 |
| Compra compartilhada | tudo | ver | só as próprias (só leitura); as do outro, não | nada | nada | LAN-03, CASA-04, PRIV-03 |
| Renda | tudo | ver (para a divisão) | só a parte dele em cada mês (percentual e valores congelados); rendas do outro, não | nada | nada | CONF-02, DIV, PRIV-02/03 |
| Casa (nome, dia de início, meta, renda mínima) | — | ver e editar (os dois) | ver | ver nome e quem convidou | nada | CASA-* |
| Convite | — | criar e reenviar | nada | ver o resumo, aceitar, recusar | nada | CASA-02 |
| Acerto do mês | — | ver, registrar, travar, reabrir (os dois) | só o acerto dele (Pausado) | nada | nada | ACE-*, PRIV-03 |
| Caixinha da casa e movimentações | — | ver, depositar, resgatar; ajustar saldo: **titular?** (a decidir no arquiteto) | após arquivar, migra para o titular; conjunta: os dois só leitura | nada | nada | CX-*, CASA-07 |
| Sonho, reserva da casa e suas caixinhas | — | ver, criar, editar, guardar, resgatar (os dois; reserva só em emergência) | segue a caixinha (CASA-07) | nada | nada | SON-08, RSV |
| Metas, padrão e Encontro da casa | — | ver e editar a meta (os dois) | ver | nada | nada | MET, ENC |
| Investimentos pessoais (ações, FIIs, Tesouro, corretoras) | tudo | nada | nada | nada | nada | INV-08 |
| Caixinha da casa em Investimentos | titular (conjunta: os dois) | — | — | nada | nada | INV-08 |
| Notificação | só o destinatário | — | — | — | nada | NOT |

## Ordem das features (decidida em 01/11/2026)

Atualizada em 01/11/2026 (17ª rodada) com Tour guiado, Sonhos, Encontro do mês, Assinaturas, Reserva de emergência, Pague-se primeiro e Número da liberdade. Cada linha vira **uma feature** em `we-sync-requirements/docs/features/` (numeração a partir de `004`) e passa pelo
fluxo completo (`requisitos` → `arquiteto` → `sdd-backend` / `sdd-frontend` → `dev-backend` / `dev-frontend`).
O front antigo (Material, features 001–003) é **desconsiderado**: tudo é refeito com base no protótipo. O que
essas features entregaram **na API** (auth, compras, CORS com `Max-Age`, códigos de erro, serviço `front` no
compose) continua valendo.

Critérios usados para não complicar a implementação:

1. **Uma feature pequena por vez**, cada uma entregando algo usável sozinha.
2. **Base antes do que depende dela**: cadastros (categorias, rendas, tópicos) antes de metas; admin antes do que
   ele configura (salário mínimo, palavras-chave, parâmetros); notificações antes das confirmações e da casa.
3. **Pessoal antes da casa**: cada regra é construída primeiro no escopo pessoal (isolamento simples, "só o
   dono") e depois estendida para a casa, que é a parte mais sensível de segurança (D-05: mesma rotina com escopo).
4. **Infraestrutura de rotinas agendadas uma vez só** (idempotente nas 2 instâncias), estreada pelo job mais
   simples (CDI) e reutilizada por confirmações, cotações e Tesouro.
5. **Dependências externas isoladas** em features próprias (e-mail, Banco Central, brapi/Alpha Vantage, Tesouro
   Transparente, CVM), para que uma falha de fornecedor não trave as outras.

| Ordem | Feature | Conteúdo | Regras | Depende de |
|---|---|---|---|---|
| 1 | 004 Front novo: base e acesso | Projeto Angular + Bootstrap do zero na `master` (sem Material), design system, layout (menu lateral/inferior, tema claro e escuro), login, cadastro **com nome** (`users.name` na API), sessão e renovação de token; troca coordenada do serviço `front` do compose | CONF-01, `02` | — |
| 2 | 005 Compras e Início | Lista do mês com filtros, nova/editar/excluir compra, Início com os totais do mês (sem renda nem meta ainda) | LAN-01, LAN-05 (parte) | 004 |
| 3 | 006 Tour guiado | Motor do tour, estado na conta (por tour, versão e plataforma), botão de ajuda, "Rever os tours", aviso de novidade; tours das telas da 004 e 005. **A partir daqui, toda feature de front traz o tour das suas telas** | TOUR-* | 005 |
| 4 | 007 Conta e cadastros | Perfil, trocar senha, tema, **dia de início do mês financeiro** (aplicado em compras e Início), excluir conta; categorias com ícone e cor; formas de pagamento | CONF-04..06 | 006 |
| 5 | 008 Rendas | Rendas com vigência por mês, ativa/pausada, renda única; indicadores (renda do mês, disponível, sobra prevista) no Início | CONF-02, CONF-03, LAN-05 | 007 |
| 6 | 009 Tópicos | Tópicos globais e próprios, `purchases.topic_id`, sugestão pela descrição e pelo histórico | TOP-* | 007 |
| 7 | 010 Repetição | Conta fixa e parcelada (série, k/N, centavos na última, "atualizar as próximas") | REP-* | 006 |
| 8 | 011 Administração | Flag de admin checada na API, menu Sistema, configuração geral (salário mínimo com vigência + "Buscar no Banco Central", cadastros padrão, palavras-chave, parâmetros, valores externos com fonte e data de verificação), histórico de alterações | ADM-01..08, ADM-10 | 009 |
| 9 | 012 Metas e relatórios (pessoal) | Rotina única com escopo (só pessoal agora): meta mensal e por tópico, projeção, alertas, relatório por tópico, detecção de padrão | MET-*, PAD-* | 008, 009, 010, 011 |
| 10 | 013 Notificações | Sino no site, lida/não lida, notificações agendadas e repetidas (a cada 3 dias até a resposta); primeiro uso: alertas de metas. Push no Android fica na feature do app | NOT-01, NOT-02 | 012 |
| 11 | 014 Assinaturas | Cartão em Metas (pessoal): contas fixas + compras repetidas por 3 meses como sugestão, total por mês e por ano, "Cancelei" | ASS-* | 010, 012 |
| 12 | 015 E-mail | Confirmar o e-mail no cadastro e recuperar a senha (dependência nova: envio de e-mail) | NOT-03 | 004 |
| 13 | 016 Rotinas agendadas e CDI | Infraestrutura de job idempotente (2 instâncias), job semanal do CDI (Banco Central), situação das rotinas e CDI manual no admin | CDI-01, ADM-06 | 011 |
| 14 | 017 Caixinhas pessoais | Menu Investimentos com as caixinhas pessoais: movimentações provisórias, confirmação e **desfazer**, rendimento estimado (CDI, IR regressivo, IOF), ajustar saldo | INV-01, CX-02..07 (escopo pessoal), CDI-02 | 013, 016 |
| 15 | 018 Nossa casa: vínculo | Criar casa, convite de 48h (reenviar invalida), entrar, rendas visíveis, configurar (dia de início, renda mínima), sair e casa arquivada, **exclusão de conta com casa**; **tabela de permissões e testes de vazamento entre usuários** | CASA-*, DIV-05, DIV-06, PRIV-* | 008, 011, 013 |
| 16 | 019 Compra compartilhada, divisão e acerto | Compra compartilhada (só quem registrou edita), divisão proporcional à renda, acerto do mês por transferência, travar e reabrir, **ajuste de mês acertado** | LAN-02..04, DIV-*, ACE-* | 018 |
| 17 | 020 Caixinhas da casa | Caixinhas com dono = casa (reuso da 017), titular e conta conjunta, acerto via caixinha, migração ao arquivar | CX-*, CASA-07, INV-08 (caixinhas) | 017, 019 |
| 18 | 021 Sonhos e reserva de emergência | Sonho com caixinha reservada, guardar por mês pela renda, previsão e situação, guardar e resgatar provisórios; **reserva de emergência** da casa e pessoal | SON-*, RSV-* | 020 |
| 19 | 022 Pague-se primeiro | Aviso no dia em que a renda cai com a parte de cada um da reserva e dos sonhos | PAG-* | 008, 013, 021 |
| 20 | 023 Metas e padrão da casa | Mesma rotina da 012 com escopo casa, padrão de 12/3 meses, sugestão de resgate (de quem sai, proporcional, arredondamento, menor IR) | MET-01/02 (casa), RES-* | 012, 020 |
| 21 | 024 Encontro do mês | Mês fechado abre o encontro (5 passos), resumo do mês fechado, notificação de fechamento | ENC-* | 019, 021, 023 |
| 22 | 025 Corretoras | Corretoras do usuário com corretagem, saldo, depositar e sacar, lançamento mensal "Investimento" fora da meta | INV-04 (corretagem), INV-09..12 | 017 |
| 23 | 026 Catálogo de ativos e cotações | Catálogo no admin, pedidos de cadastro, job diário de cotações (brapi; Alpha Vantage de reserva), taxas da B3 | INV-03, INV-13..15, ADM-09 | 016, 025 |
| 24 | 027 Ações e FIIs | Compra e venda com taxas, posição, preço médio, lucro/prejuízo, preço desatualizado com aviso | INV-02, INV-04..06 | 026 |
| 25 | 028 Tesouro Direto | Títulos cadastrados sozinhos pelo Tesouro Transparente, job do PU, quantidade fracionada, custódia | INV-07, INV-16 | 026, 027 |
| 26 | 029 Proventos | Proventos manuais caindo no saldo da corretora; depois, sugestão pelo informe da CVM para FIIs | INV-05 | 027 |
| 27 | 030 Número da liberdade | Cartão em Investimentos (pessoal): número da liberdade, quanto já foi atingido, quanto os proventos pagam; taxa de retirada na configuração geral | LIB-* | 012, 029 |

Observações:

- **Paralelo possível**: 009 e 010 são independentes entre si; 015 (e-mail) pode entrar em qualquer ponto depois
  da 004.
- **App Android** (`we-sync-app`): cada feature com API nova pode ganhar uma feature do app depois, sem bloquear o
  front. O push (NOT-01) entra junto com a feature do app que consumir a 013.
- **Backlog** (BKL-*) fica fora desta ordem; **Dívidas** (BKL-08) é a próxima candidata.
- **Mudança que quebra contrato** (API, front ou app Android): a mesma feature tem **uma tarefa de adequação para cada
  projeto afetado** (D-10).
