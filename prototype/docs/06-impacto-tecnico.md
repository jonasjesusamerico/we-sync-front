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

## Ordem das features (decidida em 01/11/2026)

Cada linha vira **uma feature** em `we-sync-requirements/docs/features/` (numeração a partir de `004`) e passa pelo
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
| 3 | 006 Conta e cadastros | Perfil, trocar senha, tema, **dia de início do mês financeiro** (aplicado em compras e Início), excluir conta; categorias com ícone e cor; formas de pagamento | CONF-04..06 | 005 |
| 4 | 007 Rendas | Rendas com vigência por mês, ativa/pausada, renda única; indicadores (renda do mês, disponível, sobra prevista) no Início | CONF-02, CONF-03, LAN-05 | 006 |
| 5 | 008 Tópicos | Tópicos globais e próprios, `purchases.topic_id`, sugestão pela descrição e pelo histórico | TOP-* | 006 |
| 6 | 009 Repetição | Conta fixa e parcelada (série, k/N, centavos na última, "atualizar as próximas") | REP-* | 005 |
| 7 | 010 Administração | Flag de admin checada na API, menu Sistema, configuração geral (salário mínimo com vigência + "Buscar no Banco Central", cadastros padrão, palavras-chave, parâmetros), histórico de alterações | ADM-01..08 | 008 |
| 8 | 011 Metas e relatórios (pessoal) | Rotina única com escopo (só pessoal agora): meta mensal e por tópico, projeção, alertas, relatório por tópico, detecção de padrão | MET-*, PAD-* | 007, 008, 009, 010 |
| 9 | 012 Notificações | Sino no site, lida/não lida, notificações agendadas; primeiro uso: alertas de metas. Push no Android fica na feature do app | NOT-01, NOT-02 | 011 |
| 10 | 013 E-mail | Confirmar o e-mail no cadastro e recuperar a senha (dependência nova: envio de e-mail) | NOT-03 | 004 |
| 11 | 014 Rotinas agendadas e CDI | Infraestrutura de job idempotente (2 instâncias), job semanal do CDI (Banco Central), situação das rotinas e CDI manual no admin | CDI-01, ADM-06 | 010 |
| 12 | 015 Caixinhas pessoais | Menu Investimentos com as caixinhas pessoais: movimentações provisórias e confirmação no dia seguinte, rendimento estimado (CDI, IR regressivo, IOF), ajustar saldo | INV-01, CX-02..06 (escopo pessoal), CDI-02 | 012, 014 |
| 13 | 016 Nossa casa: vínculo | Criar casa, convite de 48h (reenviar invalida), entrar, rendas visíveis, configurar (dia de início, renda mínima), sair e casa arquivada; **testes de vazamento entre usuários** | CASA-*, DIV-05, DIV-06 | 007, 010, 012 |
| 14 | 017 Compra compartilhada, divisão e acerto | Compra compartilhada (só quem registrou edita), divisão proporcional à renda, acerto do mês por transferência, travar e reabrir | LAN-02..04, DIV-*, ACE-* | 016 |
| 15 | 018 Caixinhas da casa | Caixinhas com dono = casa (reuso da 015), titular e conta conjunta, acerto via caixinha, migração ao arquivar | CX-*, CASA-07, INV-08 (caixinhas) | 015, 017 |
| 16 | 019 Metas e padrão da casa | Mesma rotina da 011 com escopo casa, padrão de 12/3 meses, sugestão de resgate (de quem sai, proporcional, arredondamento, menor IR) | MET-01/02 (casa), RES-* | 011, 018 |
| 17 | 020 Corretoras | Corretoras do usuário com corretagem, saldo, depositar e sacar, lançamento mensal "Investimento" fora da meta | INV-04 (corretagem), INV-09..12 | 015 |
| 18 | 021 Catálogo de ativos e cotações | Catálogo no admin, pedidos de cadastro, job diário de cotações (brapi; Alpha Vantage de reserva), taxas da B3 | INV-03, INV-13..15, ADM-09 | 014, 020 |
| 19 | 022 Ações e FIIs | Compra e venda com taxas, posição, preço médio, lucro/prejuízo, preço desatualizado com aviso | INV-02, INV-04..06 | 021 |
| 20 | 023 Tesouro Direto | Títulos cadastrados sozinhos pelo Tesouro Transparente, job do PU, quantidade fracionada, custódia | INV-07, INV-16 | 021, 022 |
| 21 | 024 Proventos | Proventos manuais caindo no saldo da corretora; depois, sugestão pelo informe da CVM para FIIs | INV-05 | 022 |

Observações:

- **Paralelo possível**: 008 e 009 são independentes entre si; 013 (e-mail) pode entrar em qualquer ponto depois
  da 004.
- **App Android** (`we-sync-app`): cada feature com API nova pode ganhar uma feature do app depois, sem bloquear o
  front. O push (NOT-01) entra junto com a feature do app que consumir a 012.
- **Backlog** (BKL-*) fica fora desta ordem.
