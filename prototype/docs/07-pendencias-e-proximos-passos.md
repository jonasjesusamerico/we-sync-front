# 07 — Pendências e próximos passos

Para retomar o refinamento. Cada pendência traz uma sugestão para facilitar a decisão.

## Pendências em aberto

Nenhuma pergunta de produto em aberto. O refinamento das ideias está completo o bastante para seguir para os
requisitos formais.

## Respostas da 12ª rodada (01/11/2026)

| # | Decisão | Onde |
|---|---|---|
| G-01 | Playwright só para **validar o que for alterado** no protótipo (sem varredura geral) | — |
| G-02 | Protótipo e docs **commitados** no `we-sync-front` | — |
| G-03 | **Tudo do front antigo é desconsiderado** (features 001–003 no front, DT-004): o front novo sai só do protótipo. O que essas features entregaram na API continua valendo | D-07, `06` |
| G-04 | **Ordem das features** 004–024 montada pelo Claude para não complicar a implementação | `06`, "Ordem das features" |

## Respostas da 11ª rodada

| # | Decisão | Regra |
|---|---|---|
| F-08 | **Alpha Vantage como reserva** da brapi para cotações (até 25 ativos/dia) | INV-03 |
| F-07 | Custódia do Tesouro pesquisada nas regras oficiais: **0,20% a.a.**, diária, descontada na venda/vencimento/juros; **Selic isento até R$ 10 mil**; **Educa+/Renda+** isentos até 4/6 salários mínimos, 0,10% a.a. no excedente | INV-16, `08` 5.1 |

## Respostas da 10ª rodada (todas as sugestões aceitas)

| # | Decisão | Regra |
|---|---|---|
| C-01 | Botão **"Pedir cadastro"**; o analista aprova ou recusa na Configuração geral | INV-14, ADM-09 |
| C-02 | **Títulos do Tesouro cadastrados sozinhos** pelo arquivo oficial; o analista só pausa | ADM-09 |
| C-03 | Ativo pausado/não encontrado: **último preço, com data e aviso** | INV-15 |
| F-05 | Fazer o **teste prático da Alpha Vantage** para proventos | (pendente: chave) |
| F-06 | **Custódia anual do Tesouro** na Configuração geral, cobrada sobre o saldo | INV-16 |
| F-05 | Teste da Alpha Vantage feito (01/11/2026): **cotação da B3 funciona**, **proventos brasileiros não** (0 registros) | `08`, seção 4.3 |

## Respostas da 9ª rodada

| # | Decisão | Regra |
|---|---|---|
| F-01 | **brapi** para cotações (Alpha Vantage só candidata para proventos) | INV-03 |
| — | **Catálogo de ativos** no admin; job atualiza cada ativo uma vez por dia; carteiras leem do catálogo | INV-13, ADM-09 |

## Respostas da 8ª rodada

| # | Decisão | Regra |
|---|---|---|
| F-02 | Tesouro pela **quantidade de títulos** (pode ser fracionada, ex.: 0,1) × **preço do dia** | INV-07 |
| F-03 | FIIs: o informe da CVM **sugere** o provento (usuário confirma) | INV-05 |
| F-04 | Proventos de ações **manuais** até existir uma API | INV-05 |

## Respostas da 7ª rodada (aplicadas em `04-regras-de-negocio.md` e no protótipo)

| # | Decisão | Regra |
|---|---|---|
| I-13 | Proventos **caem no saldo da corretora** | INV-05 |
| I-14 | **Depositar na corretora** sem comprar; entra no lançamento "Investimento" do mês | INV-12 |
| I-15 | **Tesouro Direto** com o mesmo fluxo das ações | INV-07 |

## Respostas da 6ª rodada (aplicadas em `04-regras-de-negocio.md` e no protótipo)

| # | Decisão | Regra |
|---|---|---|
| I-08 | Venda cai num **saldo da corretora** (disponível para investimento); **sacar** leva para a conta normal | INV-10, INV-11 |
| I-09 | Lançamento "Investimento" **não** conta na meta pessoal | INV-09 |
| I-10 | Caixinha de conta conjunta aparece para **os dois** | INV-08 |
| I-11, I-12 | Taxas da B3 no admin; **corretagem (e outras tarifas) cadastrada pelo usuário** em cada corretora | INV-04 |

## Respostas da 5ª rodada (aplicadas em `04-regras-de-negocio.md` e no protótipo)

| # | Decisão | Regra |
|---|---|---|
| I-01 | Job todo dia às 00:00:00 grava o fechamento como cotação (evita N requisições) | INV-03 |
| I-02 | Compra e venda com taxas; corretagem configurada por corretora; leitura da nota em PDF depois | INV-04, BKL-03 |
| I-03 | Proventos à mão; depois API (preferência pública) | INV-05, BKL-04 |
| I-04 | Só lucro/prejuízo; IR depois | INV-06, BKL-05 |
| I-05 | Tesouro parecido com caixinha; ver API pública | INV-07 |
| I-06 | Só pessoal; casa só caixinhas; caixinhas da casa aparecem também em Investimentos, para o titular | INV-08 |
| I-07 | Compras viram um lançamento mensal "Investimento" que desconta do mês; buy and hold | INV-02, INV-09 |
| A-01 | Conta criada pelo site e marcada como admin por flag no banco | ADM-05 |
| A-02 | Configuração geral inicial aceita; cresce com as funcionalidades | ADM-06 |
| A-03 | Histórico de alterações | ADM-07 |
| A-04 | Admin não vê dados de usuários | ADM-08 |

## Respostas da 4ª rodada

| # | Pergunta | Decisão | Regra |
|---|---|---|---|
| N-06 | Para que serve o e-mail | **Confirmar o e-mail no cadastro** e **recuperar a senha** | NOT-03 |
| N-08 | Caixinha em conta conjunta ao arquivar | Aparece no pessoal **dos dois**, só leitura | CASA-07 |
| N-09 | Onde ficam as caixinhas pessoais | Novo menu **Investimentos**: caixinhas, ações, FIIs, Tesouro Direto | INV-01, INV-02 |
| N-10 | Como o salário mínimo é cadastrado | **Rota de admin** com a configuração geral do sistema, usada pelos analistas de negócio | ADM-01..ADM-04 |

## Respostas da 3ª rodada (aplicadas em `04-regras-de-negocio.md` e no protótipo)

| # | Pergunta | Decisão | Regra |
|---|---|---|---|
| N-01 | Quem mantém o salário mínimo | **Renda mínima configurável por casa**; se não informada, vale o **salário mínimo** cadastrado pelo dono do sistema | DIV-05, DIV-06 |
| N-02 | Centavos na parcelada por total | Vão para a **última** parcela | REP-06 |
| N-03 | Reenviar convite | O link anterior **deixa de valer** e é enviado um novo | CASA-02 |
| N-04 | Caixinhas com a casa pausada | **Migram para o pessoal** de cada titular | CASA-07 |
| N-05 | Quem reabre o acerto | **Qualquer um dos dois**, com aviso ao outro | ACE-08 |
| N-07 | Resgate proporcional sem saldo | **Completa com a caixinha do outro** | RES-07 |

## Respostas da 2ª rodada

| # | Decisão | Regra |
|---|---|---|
| P-01 | Parcelada por **valor da parcela** ou **valor total**; juros pagos no backlog | REP-06, BKL-01 |
| P-02 | Editar série pergunta se **atualiza as próximas** | REP-03 |
| P-03 | Sem renda → renda mínima (salário mínimo) | DIV-05 |
| P-04 | Mês acertado fica travado | ACE-07 |
| P-05 | Dia de início do mês no painel da casa (padrão dia 1) | CASA-06 |
| P-06 | Convite de 48h com reenviar | CASA-02 |
| P-07 | Resgate: de quem sai ou proporcional, arredondado para cima ao real | RES-03, RES-05, RES-06 |
| P-08 | Ao sair, valores pausam e continuam visíveis | CASA-04 |
| P-09 | Notificações no site e no app; e-mail só para confirmações | NOT-01, NOT-03 |
| P-10 | Renda única entra no mês em que caiu na conta | CONF-02 |
| P-11 | Relatórios além do mês ficam para depois | BKL-02 |
| P-12 | Lista de tópicos aprovada; tópicos próprios | TOP-01, TOP-04 |
| P-13 | Compras pagas pelo outro não entram na visão pessoal | LAN-04 |
| P-14 | Início usa a meta pessoal | LAN-05 |

## O que o protótipo mostra desde a 10ª rodada

- "Pedir cadastro de …" em Investimentos e **Pedidos de cadastro** (aprovar/recusar) em `admin.html#ativos`.
- Etiqueta "preço de dd/mm/aaaa" para ativo pausado (WEGE3 no exemplo).
- Compra de Tesouro sem taxas da B3; campo "Custódia do Tesouro (% ao ano)" na aba Taxas.

## O que o protótipo mostra desde a 9ª rodada

- Aba **Ativos** na Configuração geral (`admin.html#ativos`) e Investimentos lendo o preço do catálogo; compra de
  código fora do catálogo é bloqueada.

## O que o protótipo mostra desde a 8ª rodada

- Tesouro Direto como posição com **quantidade fracionada × PU** (ex.: comprar 0,1 título), no mesmo fluxo de
  operação das ações (tipo "Tesouro Direto" no modal).

## O que o protótipo mostra desde a 7ª rodada

- Provento com a corretora onde caiu (soma no saldo); **Depositar** e **Sacar** em cada corretora.
- Salário mínimo de 2026 (R$ 1.621) e botão "Buscar no Banco Central" na Configuração geral.

## O que o protótipo mostra desde a 6ª rodada

- Saldo de cada corretora, "Pagar com" (saldo ou conta normal), venda caindo no saldo e **Sacar** — `investimentos.html`.
- Corretagem fixa e/ou % cadastrada pelo usuário.

## O que o protótipo mostra desde a 5ª rodada

- **Investimentos** (`investimentos.html`) e **Configuração geral** (`admin.html`, menu "Sistema" só para admin).
- "Investido no mês" no Início e o cartão do lançamento "Investimento" em Compras.

## O que o protótipo mostra desde a 3ª rodada

- Parcelada com "valor da parcela / o total" (centavos na última) — `nova-compra.html`.
- "Atualizar as próximas também?" ao editar fixa/parcela — `compras.html` → `nova-compra.html?editar=…`.
- Casa: dia de início do mês e renda mínima em **Configurar casa**; aviso de renda mínima (`casa.html?semrenda=1`).
- Convite de 48h com horário de expiração e **Reenviar convite** (`casa.html?vazio=1`).
- Resgate: "De onde sai o resgate?" (tudo de uma caixinha ou proporcional), IR de cada opção, menor custo marcado,
  arredondamento para cima.
- Sair da casa com confirmação → casa arquivada só leitura, acerto "Pausado", caixinhas "no pessoal de …"
  (`casa.html?arquivada=1`).
- Renda única com a data em que caiu na conta; tópicos próprios — `configuracoes.html`.

## Próximos passos

1. **Revisar e aprovar o protótipo** como referência visual (ajustes pedidos pelo usuário são validados com o
   Playwright).
2. **Requisitos formais** em `../we-sync-requirements/docs/features/`, uma feature por vez, na ordem de
   `06-impacto-tecnico.md` (começa pela `004 Front novo: base e acesso`), com o fluxo do projeto
   (`requisitos` → `arquiteto` → `sdd-backend` / `sdd-frontend` → `dev-backend` / `dev-frontend`).
3. Ao abrir a 004, registrar em `we-sync-requirements`:
   - que ela **substitui o front** das features 001–003 (os documentos delas ficam como histórico);
   - **DT-004** (login do front antigo) como `Descartado (front antigo substituído)`;
   - que o design system de referência passa a ser `prototype/docs/02-design-system.md` (o `CLAUDE.md` de lá aponta
     para `../we-sync-front/docs/design-system.md`, que é do front antigo).
4. **Front novo** em Angular + Bootstrap na `master` do `we-sync-front` (o antigo está na branch `legacy`),
   coordenando o serviço `front` do `docker-compose.yml` da API.

## Lembretes

- O protótipo e estes docs estão **commitados** na `master` do `we-sync-front` (01/11/2026); o push é feito pelo
  usuário no VS Code.
- A tela de design vazia criada no claude.ai no início foi **apagada** (4ª rodada).
