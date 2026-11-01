# 04 — Regras de negócio

Todas as regras combinadas até a 13ª rodada de refinamento (P, N, I, A, F, C, G, H, J) e a pesquisa de fontes (`08-fontes-de-dados.md`). Legenda: **(decidido)** = confirmado pelo usuário;
**(sugestão)** = proposta ainda não confirmada (ver `07-pendencias-e-proximos-passos.md`).
Fórmulas e exemplos numéricos em `05-calculos.md`.

## CONF — Usuário e configurações

- **CONF-01** O cadastro pede **nome**, e-mail e senha (mín. 8 caracteres). *(protótipo; a API hoje não guarda nome)*
- **CONF-02** **Rendas**: cada uma tem descrição, valor, tipo (Salário, Benefício, Renda extra, Outros), frequência
  (Mensal, Quinzenal, Única), dia do recebimento (1–31) e chave **ativa/pausada**. Pausada não entra em cálculo.
  A renda **Única** tem a **data em que caiu na conta** (qualquer mês, passado ou futuro) e conta só nesse mês.
  *(decidido)*
- **CONF-03** Indicadores de renda: renda do mês (ativas; quinzenal conta 2×), próximo recebimento (próxima renda
  recorrente pelo dia), sobra prevista (renda − gastos do mês).
- **CONF-04** **Categorias**: as 6 padrão (Alimentação, Transporte, Moradia, Saúde, Educação, Lazer) valem para todos
  e não podem ser alteradas; o usuário cria as **próprias** com nome, **ícone** e **cor**. Remover uma categoria
  própria não apaga as compras dela.
- **CONF-05** **Formas de pagamento**: as 6 padrão (Dinheiro, Cartão de crédito, Cartão de débito, Pix,
  Transferência bancária, Boleto) + próprias (ex.: Vale-refeição). Remover não apaga compras.
- **CONF-06** **Conta**: editar perfil, trocar senha, tema claro/escuro, **dia de início do mês financeiro**
  (1–28; ex.: começar no dia 5, quando cai o salário), excluir conta (apaga tudo; confirmação).
- **CONF-07** A antiga aba "Orçamento" foi substituída pela tela **Metas e relatórios** (MET).

## LAN — Lançamento de compras

- **LAN-01** Campos: valor (> 0), descrição, data, categoria, tópico (opcional), forma de pagamento, situação
  (Paga, Pendente; Cancelada existe na API).
- **LAN-02** **Pessoal** é o padrão. **Compartilhada** só aparece se a conta tem vínculo com uma casa. *(decidido)*
- **LAN-03** Compra compartilhada aparece para os dois membros; **só quem registrou edita ou apaga**; quem registra é
  quem pagou. *(decidido)*
- **LAN-04** Na visão **pessoal**, a compra conta **100%** para quem pagou, inclusive a compartilhada (visão de
  fluxo de caixa). A parte de cada um aparece na área da casa. *(decidido)*
  Compras compartilhadas **pagas pelo outro não entram** na visão pessoal (ela é o que saiu do seu bolso).
  *(decidido)*
- **LAN-05** "Disponível na conta" = renda do mês − já pago; "sobra prevista" desconta também o que falta pagar.
  No Início, a barra de meta usa a **meta pessoal** de Metas e relatórios. *(decidido)*

### TOP — Tópicos (subcategorias)

- **TOP-01** Cada categoria tem tópicos. Ex.: Alimentação › Mercado, Delivery, Restaurante, Padaria; Transporte ›
  Combustível, Corridas de aplicativo, Transporte público, Estacionamento, Financiamento; Moradia ›
  Aluguel/Condomínio, Contas da casa, Manutenção, Limpeza; Saúde › Farmácia, Consultas, Plano de saúde;
  Educação › Cursos, Livros, Material; Lazer › Passeios, Streaming, Viagens. *(decidido como lista inicial)*
- **TOP-02** O tópico é **opcional** e **sugerido pela descrição** (palavras-chave; no app real, também o histórico
  do próprio usuário: mesma descrição → mesmo tópico), para não aumentar o trabalho de preencher. *(decidido)*
- **TOP-03** A sugestão marca categoria + tópico com a etiqueta "sugerido". Se a descrição deixar de combinar, a
  sugestão é retirada; escolha manual sempre vence.
- **TOP-04** O usuário pode criar **tópicos próprios**, como nas categorias próprias. *(decidido)*

### REP — Repetição

- **REP-01** Opções: Não repete (padrão) / **Conta fixa** / **Parcelada**. *(decidido)*
- **REP-02** Conta fixa: repetir por **N meses**; os lançamentos futuros entram como **Pendente**, no mesmo dia (ou
  no último dia do mês, se não existir). *(decidido)*
- **REP-03** Ao **editar** um lançamento de uma série (conta fixa ou parcela), o app pergunta se é para **atualizar
  as próximas também** ("só esta" ou "esta e as próximas"). Ex.: aluguel reajustado em abril → editar abril e
  atualizar as próximas, podendo estender a série (+12 meses). *(decidido)*
- **REP-04** Parcelada: informar **nº de parcelas ou a última parcela** — um calcula o outro (ex.: financiamento
  do carro). Cada lançamento mostra "parcela k/N". *(decidido)*
- **REP-06** Parcelada tem **duas formas de informar o valor**: **valor da parcela** (total = parcela × N) ou
  **valor total** (dividido pelas N parcelas; os centavos que sobram vão para a **última** parcela). *(decidido)*
- **REP-05** Contas fixas e parcelas entram na projeção pelo valor esperado e ficam fora da detecção de padrão.

## CASA — Vínculo do casal

- **CASA-01** A casa tem **no máximo 2 membros** (casal); cada pessoa participa de no máximo 1 casa. *(decidido)*
- **CASA-02** Entrada por **convite** (link/código), válido só depois que a outra pessoa aceita. **Validade de 48 horas**,
  uso único, com opção de **reenviar** sem recriar a casa. Ao reenviar, **o link anterior deixa de valer** e é
  enviado um novo. *(decidido)*
- **CASA-03** Cada um mantém a própria conta, login e compras pessoais **privadas**; só o que for compartilhado
  aparece para os dois.
- **CASA-04** Ao desfazer o vínculo, a casa fica **arquivada (só leitura)** e as compras continuam com quem
  registrou. Os valores (acertos, divisão) ficam **pausados** e continuam **visíveis** para os dois. *(decidido)*
- **CASA-07** Quando a casa é pausada (arquivada), as **caixinhas migram para o pessoal** de cada titular.
  Caixinha em **conta conjunta** aparece no pessoal **dos dois**, só para leitura, até alguém informar o resgate
  ou a divisão do saldo. As caixinhas pessoais ficam no menu **Investimentos** (INV). *(decidido)*
- **CASA-05** Alertas e avisos da casa vão para **os dois**. *(decidido)*
- **CASA-06** A casa tem o seu **dia de início do mês**, configurado no painel da casa: **dia 1** por padrão, ou o
  dia informado. Vale para divisão, acerto, padrão e metas da casa (o dia pessoal de CONF-06 vale só para o
  pessoal). *(decidido)*

## DIV — Divisão proporcional à renda

- **DIV-01** A proporção usa **todas as rendas ativas** de cada um (salário, vale, freela...). Recorrentes contam
  todo mês (quinzenal 2×); **única conta só no mês em que acontece**. *(decidido)*
- **DIV-02** Rendas **visíveis** para os dois (transparência). *(decidido)*
- **DIV-03** A renda vem do cadastro de Rendas de cada um (não se digita de novo na casa). *(decidido)*
- **DIV-04** **Vigência por mês**: uma alteração vale a partir do mês em que foi feita; se mudar de novo no mesmo
  mês, o novo valor substitui. Ex.: R$ 5.000 em fev/2026 e R$ 7.000 em abr/2026 → fev e mar usam 5.000; abr em
  diante, 7.000. Meses passados não são recalculados. *(decidido)*
- **DIV-05** Se um dos dois **não tiver renda** no mês, considera-se a **renda mínima da casa** para essa pessoa
  (cada um tem reserva de emergência e sacaria só o necessário). Se nenhum tiver renda, os dois ficam com a renda
  mínima, ou seja, 50/50. O app avisa quando isso acontece. *(decidido)*
- **DIV-06** A **renda mínima** é configurável **por casa** (painel da casa). Se não for informada, vale o **salário
  mínimo** cadastrado pelo **dono do sistema** na configuração do sistema. *(decidido)*

## ACE — Acerto do mês

- **ACE-01** Entram no acerto só compras compartilhadas **Pagas** (pendentes entram quando forem pagas; canceladas
  nunca).
- **ACE-02** Para cada um: parte (%), deveria pagar, pagou, diferença.
- **ACE-03** Modo configurável na casa: **depósito na caixinha** (padrão) ou **transferência direta**.
- **ACE-04** Depósito na caixinha: como o dinheiro **é da casa**, quem contribuiu menos que a sua proporção deposita
  o valor que deixa a contribuição de cada um **exatamente** na proporção da renda (não a diferença simples).
  *(decidido — "considere que esse dinheiro é da casa")*
- **ACE-05** Transferência direta: vale a diferença simples (o dinheiro volta para quem pagou a mais).
- **ACE-06** O depósito é registrado como **provisório** e confirmado depois (ver CX-05). A tela sugere a caixinha
  em nome de quem deposita.
- **ACE-07** Depois de acertado, o mês fica **travado**; editar compra compartilhada dele exige reabrir o acerto.
  *(decidido)*
- **ACE-08** **Qualquer um dos dois** pode reabrir um mês acertado, e o outro recebe aviso. *(decidido)*

## CX — Caixinhas da casa

- **CX-01** A caixinha é **dos dois** (não há saldo por pessoa); é um controle para o acerto ser justo. *(decidido)*
- **CX-02** A casa pode ter **várias caixinhas**: nome, instituição (texto livre), **titular** (um dos dois ou conta
  conjunta) e **% do CDI** (sugestão 100%). Cobre casais com conta conjunta e casais que preferem uma caixinha em
  nome de cada um (IRPF). *(decidido)*
- **CX-03** Depósitos e resgates são **movimentações**, não compras: não entram nos gastos nem nos gráficos.
- **CX-04** Total da caixinha da casa = soma das caixinhas.
- **CX-05** Depósito e resgate entram como **provisórios**; **no dia seguinte** a pessoa recebe um aviso para
  confirmar ("foi depositado/sacado?"). "Sim" confirma; "Não" desfaz o lançamento. *(decidido)*
- **CX-06** O rendimento é **estimado** pelo CDI diário com **IR regressivo** (e IOF nos primeiros 30 dias). Botão
  **"Ajustar saldo"** para igualar ao extrato do banco. *(decidido)*

## RES — Padrão de gastos e resgate

- **RES-01** **Padrão** = média dos gastos da casa nos últimos **12 meses**; com menos de 12, média dos **últimos 3**;
  com menos de 3, usa a **meta da casa** (antigo "teto"), que também gera alertas. *(decidido)*
- **RES-02** Mês acima do **padrão** → **sugestão** de resgate do excedente. **Nunca automático**: às vezes não
  compensa pagar IR/IOF. *(decidido)*
- **RES-03** A sugestão indica **de quem sai** o resgate: da caixinha de um, da do outro, ou **proporcional aos dois**
  (pela divisão do mês), mostrando o IR estimado de cada opção; sugere a de **menor custo de IR**. *(decidido)*
- **RES-06** Valores de resgate sugeridos são **arredondados para cima, ao real inteiro**, em cada parte.
  Ex.: R$ 458,25 e R$ 123,57 → **R$ 459** e **R$ 124**. *(decidido)*
- **RES-07** No resgate proporcional, se a parte de um não couber nas caixinhas dele, **completa com a caixinha do
  outro**, e a tela mostra como ficou. *(decidido)*
- **RES-04** O resgate usa o **padrão**, não a meta (uma meta abaixo do gasto real esvaziaria a caixinha).
  *(decidido)*
- **RES-05** O resgate confirmado/provisório **reduz o total do mês a dividir** e o "pago" de quem recebeu o
  dinheiro. No resgate proporcional, cada um tem o "pago" reduzido pela sua parte (isso também resolve a caixinha
  em conta conjunta).

## CDI

- **CDI-01** Um **job semanal** do sistema busca o CDI diário no **Banco Central** (SGS, série 12) e grava **uma
  linha por data** (idempotente: a API roda em 2 instâncias). *(decidido o job; fonte e idempotência sugeridas)*
- **CDI-02** Rendimento calculado dia a dia (dias úteis) sobre o saldo de cada caixinha, pelo % do CDI dela.

## MET — Metas e relatórios (pessoal e casa)

- **MET-01** Metas, relatório e detecção de padrão valem para **pessoal e casa** com a **mesma rotina**, que recebe o
  escopo. *(decidido — "código centralizado")*
- **MET-02** Cada escopo tem uma **meta mensal** (ex.: casa R$ 3.000). *(decidido)*
- **MET-03** **Projeção do mês** = contas fixas pelo valor esperado + gastos variáveis até hoje ÷ dias passados ×
  dias do mês.
- **MET-04** Alertas pela **projeção** (não só pela porcentagem): "no ritmo atual fecha em R$ X (+11% da meta)";
  "meta atingida". Sempre mostrar **"dá para gastar R$ X por dia"**. No máximo **1 alerta por tipo por mês**.
- **MET-05** **Metas por tópico** opcionais (ex.: Delivery até R$ 300), com a mesma projeção. *(decidido: tela
  própria de metas, pessoal e casa)*
- **MET-06** Na visão pessoal entra tudo o que a pessoa pagou (LAN-04).
- **MET-07** **Relatório por tópico**: até hoje, projeção, % da meta, comparação com a média, tendência de 6 meses,
  frequência (nº de compras) e ticket médio.

## PAD — Detecção de padrão de consumo

- **PAD-01** Analisa por **tópico**, só gastos **variáveis**, com **mínimo de 3 meses** de histórico.
- **PAD-02** **Crescimento**: regressão linear dos últimos 6 meses (o mês atual pela projeção). Alerta se crescer
  **≥ 10% ao mês** e houver **≥ 3 meses seguidos de alta**. Mostra o ritmo, a projeção para daqui a 6 meses e o
  motivo (mais pedidos ou ticket maior), quando houver frequência.
- **PAD-03** **Fora do normal**: projeção do mês > **média + 1,5 desvio padrão** do histórico do tópico.
- **PAD-04** As mensagens explicam o cálculo em linguagem simples ("Como identificamos um padrão?").

## NOT — Notificações

- **NOT-01** Notificações no **site** (sino) e no **app** (Android, inclusive push): compra da casa registrada pelo
  outro, mês acima do padrão, metas, confirmações de depósito/resgate. *(decidido)*
- **NOT-03** **E-mail não é canal de notificação**: serve só para **confirmar o e-mail no cadastro** e **recuperar
  a senha**. O convite da casa segue por link (WhatsApp). *(decidido)*
- **NOT-02** Confirmações de movimentação chegam **no dia seguinte** (CX-05).

## INV — Investimentos (menu novo)

- **INV-01** Menu **Investimentos** na área pessoal, onde ficam as **caixinhas pessoais** (criadas com ou sem casa) e
  as caixinhas que migraram de uma casa arquivada (CASA-07). *(decidido)*
- **INV-02** Além das caixinhas, o usuário registra investimentos do **mercado brasileiro**: **ações**, **FIIs** e
  **Tesouro Direto**. Filosofia **buy and hold** (posição, preço médio, proventos; nada de day trade). *(decidido)*
- **INV-03** **Cotação**: um **job todo dia às 00:00:00** busca o **preço de fechamento** e grava esse valor como
  cotação. Fonte: **brapi.dev** para ações e FIIs (a B3 proíbe coleta automatizada); Tesouro Transparente para o
  Tesouro. A **Alpha Vantage** (testada: cobre a B3, 25 ativos/dia) pode ser **reserva** para os ativos que falharem
  na brapi (até 25 ativos por dia). *(decidido)*
- **INV-13** **Catálogo de ativos**: os ativos (ações, FIIs, títulos do Tesouro) são **cadastrados na Configuração
  geral** (admin). O job atualiza o preço **de cada ativo do catálogo uma única vez por dia**, e **todas as carteiras
  leem o preço do catálogo** — nunca uma consulta por usuário. O número de consultas diárias = ativos ativos do
  catálogo (≈ 500 no plano grátis da brapi; o Tesouro não consome esse limite). Só ativos do catálogo podem ser
  comprados. *(decidido)*
- **INV-14** **Pedir cadastro**: ao tentar comprar um ativo fora do catálogo, o usuário pode **pedir o cadastro**; o
  pedido vai para a Configuração geral, o analista aprova (o ativo entra no próximo job) ou recusa. *(decidido)*
- **INV-15** **Preço desatualizado**: se um ativo da carteira for pausado no catálogo ou não for encontrado pelo job,
  a carteira mostra o **último preço conhecido, com a data e o aviso** "preço de dd/mm/aaaa". *(decidido)*
- **INV-16** **Taxas do Tesouro**: o Tesouro **não paga** as taxas de negociação da B3 das ações; paga a **custódia da
  B3: 0,20% ao ano**, calculada todo dia desde o D+1 de cada compra e **descontada só na venda antecipada, no
  vencimento ou no pagamento de juros**. **Tesouro Selic isento até R$ 10.000** por usuário (cobra só o excedente).
  **Educa+ / Renda+**: isentos até **4 / 6 salários mínimos** de renda mensal; acima, **0,10% ao ano** sobre o
  excedente. Todos os parâmetros na Configuração geral. A posição mostra o valor líquido estimado (valor −
  custódia provisionada). *(decidido; regras oficiais em `08`, seção 5.1)*
- **INV-04** **Operações**: compra e venda, com **taxas**. As taxas da B3 (emolumentos, liquidação) são iguais para
  todos e ficam na **configuração geral** (admin). A **corretagem** de cada corretora é **cadastrada pelo próprio
  usuário** (fixa por ordem e/ou % da ordem), porque cada corretora cobra de um jeito e muda com o tempo — o sistema
  não mantém um catálogo de corretoras. Preço médio inclui as taxas. *(decidido)*
- **INV-05** **Proventos** (dividendos, JCP, rendimentos de FII): lançados **à mão** na primeira versão e **caem no
  saldo da corretora** (só voltam ao mês por saque). Ações: manuais até existir uma API. FIIs: numa versão seguinte,
  o informe mensal da CVM **sugere** o provento para o usuário confirmar. *(decidido)*
- **INV-06** **Imposto de renda**: a primeira versão mostra só **lucro/prejuízo**; cálculo do IR no backlog.
  *(decidido)*
- **INV-07** **Tesouro Direto**: **mesmo fluxo das ações** — compra pelo saldo da corretora ou pela conta normal,
  resgate cai no saldo da corretora. Cadastro pela **quantidade de títulos, que pode ser fracionada** (ex.: 0,1), e
  valor = quantidade × **preço do dia (PU)** do **Tesouro Transparente**; "Ajustar saldo" fica de reserva.
  *(decidido)*
- **INV-08** **Escopo**: ações, FIIs e Tesouro só no **pessoal**; na casa, só caixinhas. As caixinhas da casa
  **também aparecem em Investimentos**, mas **só para o titular** (e na casa); a de **conta conjunta** aparece para
  **os dois**. *(decidido)*
- **INV-09** **Efeito no mês**: o dinheiro que **sai da conta normal** para investimentos (compras pagas pela conta
  normal) menos o que **volta por saque** vira **um lançamento do tipo "Investimento" por mês**. Ele **desconta do
  disponível**, mas **não é gasto** e **não conta na meta pessoal** (nem em padrões ou gráficos de gasto).
  *(decidido)*
- **INV-10** **Saldo na corretora**: cada corretora tem um **saldo disponível para investimento** (a corretora
  costuma ser outra conta). O valor de uma **venda** cai nesse saldo, não na conta normal. Uma compra pode ser paga
  **com o saldo da corretora** (não mexe no mês) ou **pela conta normal** (entra no lançamento do mês). *(decidido)*
- **INV-11** **Saque**: o usuário pode **sacar** o saldo de uma corretora para a conta normal. Só aí o dinheiro volta
  ao mês (abate o lançamento "Investimento"; não é renda e não entra na divisão da casa). *(decidido)*
- **INV-12** **Depositar na corretora**: levar dinheiro da conta normal para o saldo da corretora sem comprar nada;
  entra no lançamento "Investimento" do mês. *(decidido)*

## ADM — Administração do sistema

- **ADM-01** Existe uma **rota de admin**. Contas com papel de administrador veem um menu específico de
  **configuração geral do sistema**; usuários comuns não veem nem acessam. *(decidido)*
- **ADM-02** A tela é usada pelos **analistas de negócio**. *(decidido)*
- **ADM-03** O **salário mínimo** (DIV-06) é cadastrado nessa tela, com vigência. Botão "Buscar no Banco Central"
  (SGS 1619) traz o valor como sugestão para o analista confirmar. *(decidido; o botão é sugestão da pesquisa)*
- **ADM-04** O acesso é verificado **na API** (papel do usuário), não só escondendo o menu no front. *(regra de
  segurança do projeto)*
- **ADM-05** A conta admin é **criada normalmente pelo site** e depois marcada com uma **flag de admin direto no
  banco**. *(decidido)*
- **ADM-06** Configuração geral, primeira versão: salário mínimo (vigências), categorias/formas de pagamento/tópicos
  padrão e palavras-chave da sugestão, parâmetros da detecção de padrão, validade do convite, taxas da B3, situação
  das rotinas (CDI, cotações, confirmações) e CDI manual. Novas opções entram conforme as funcionalidades crescem
  (o Claude sugere ao longo do caminho). *(decidido)*
- **ADM-07** **Histórico de alterações**: toda mudança registra quem, quando e o quê. *(decidido)*
- **ADM-08** O admin **não vê dados dos usuários**; só a configuração geral. *(decidido)*
- **ADM-09** Aba **Ativos**: cadastrar código, nome e tipo; pausar/reativar (ativo pausado sai do job); ver último
  fechamento, data, fonte e situação (Atualizado, Aguardando o job, Não encontrado na fonte, Pausado); contador de
  consultas diárias contra o limite do plano; rodar o job manualmente; **pedidos de cadastro** dos usuários (aprovar /
  recusar). Os **títulos do Tesouro entram sozinhos** pelo arquivo oficial (o analista só pausa). Mudanças vão para o
  histórico. *(decidido)*

## SON — Sonhos do casal

Ideia inspirada em livros de finanças para casais (Gustavo Cerbasi, *Casais inteligentes enriquecem juntos*; John
Gottman): um objetivo em comum dá sentido ao dinheiro guardado da casa. Feature própria, logo depois das caixinhas
da casa (`06`).

- **SON-01** Um **sonho** tem nome, **valor**, **mês alvo** e uma **caixinha só dele** (instituição, titular — um dos
  dois ou conta conjunta — e % do CDI), criada junto com o sonho e **reservada** para essa finalidade. *(decidido)*
- **SON-02** **Guardar por mês**: o valor mensal que, com o rendimento estimado da caixinha (CDI × % do CDI, já
  descontado o IR pelo prazo até o mês alvo), chega ao valor no mês alvo. É dividido entre os dois **pela proporção
  da renda** (DIV) do mês, cada parte **arredondada para cima, ao real**. *(sugestão; fórmula em `05`, seção 11)*
- **SON-03** **Previsão no ritmo atual**: com a média do que foi guardado (confirmado) nos **últimos 3 meses** — ou
  com o valor sugerido, se ainda não houver depósitos —, o mês em que o sonho chega ao valor. *(sugestão)*
- **SON-04** **Situação**: **Adiantado** (chega pelo menos 1 mês antes), **No ritmo** (chega no mês alvo),
  **Atrasado** (depois do mês alvo) e **Concluído** (saldo ≥ valor). *(sugestão)*
- **SON-05** Guardar para um sonho **não é gasto**: não entra na meta, no padrão nem nos gráficos (como o lançamento
  "Investimento", INV-09). *(decidido)*
- **SON-06** Guardar é um **depósito provisório** com quem guardou, confirmado no dia seguinte, como nas caixinhas
  (CX-05). *(sugestão)*
- **SON-07** A caixinha do sonho **não entra no acerto** (não é oferecida para o depósito do acerto) **nem na
  sugestão de resgate** (RES). *(decidido)*
- **SON-08** Os dois membros criam, editam e guardam em qualquer sonho da casa; ao arquivar a casa, a caixinha do
  sonho segue CASA-07 (vai para o pessoal do titular). *(sugestão)*
- **SON-09** **Resgatar do sonho**: valor (até o saldo), **quem recebe** e, opcional, "para quê" (ex.: pagar a fatura
  da viagem). O casal decide como usar o dinheiro — por exemplo, passar tudo no cartão durante a viagem e depois
  resgatar para pagar a fatura, sabendo exatamente quanto a viagem custou. Provisório até a confirmação (CX-05).
  *(decidido)*
- **SON-10** **Efeito do resgate do sonho no mês**: igual ao resgate da caixinha (RES-05) — abate do **total do mês
  a dividir** e do **"pago" de quem recebeu** — e fica **fora da meta e do padrão** (gasto do mês = compras −
  resgates de sonho). Assim as compras pagas com o sonho não contam duas vezes: o sonho já foi enchido pelos dois
  na proporção da renda. *(decidido)*

## ENC — Encontro do mês

Ideia inspirada no "money date" dos livros de finanças para casais: uma conversa mensal curta e combinada.

- **ENC-01** Ao abrir em **Nossa casa** um **mês já fechado** (o mês financeiro da casa terminou, pelo dia de início
  — CASA-06), aparece o **Encontro do mês** no lugar da visão do mês, **mesmo com o acerto pendente** (o passo 4
  leva ao acerto). *(decidido)*
- **ENC-02** **Fechar** mostra a visão normal do mês (só leitura). O encontro **não fica gravado como visto**: ao ir
  para outro mês e voltar, ele aparece de novo, a partir do passo 1. Na visão do mês fechado há o botão **"Ver o
  encontro do mês"**. *(decidido)*
- **ENC-03** Roteiro de **5 passos**, com Voltar, Prosseguir e atalho para qualquer passo: **1. Como foi** (gasto ×
  meta × padrão × mês anterior); **2. O que deu certo** (abaixo da meta, tópicos que caíram, acerto em dia);
  **3. Pontos de atenção** (padrões PAD da casa); **4. Acerto** (divisão, quem pagou, situação do acerto — se
  pendente, leva ao acerto); **5. Próximo mês** (meta da casa e quanto guardar em cada sonho). Cada passo termina
  com uma **pergunta para conversar**. *(sugestão do conteúdo)*
- **ENC-04** É **opcional**: não trava o acerto nem nada do mês. *(decidido)* Quando o mês fecha, os dois recebem a
  notificação "Outubro fechou. Que tal o encontro de vocês?". *(sugestão)*
- **ENC-05** O conteúdo é calculado **na API**, pela mesma rotina de metas e padrões (D-05). *(sugestão)*
- **ENC-06** Só na **casa**; um "resumo do mês" pessoal fica para o backlog. *(decidido)*

## TOUR — Tour guiado

- **TOUR-01** Cada tela tem um **tour guiado** que destaca os elementos e explica o uso, com **Voltar**,
  **Prosseguir** (no último passo, **Concluir**), **Fechar** e a caixa **"Não exibir novamente"**. *(decidido)*
- **TOUR-02** **Toda tela ou feature nova traz o seu tour**: faz parte do "pronto" de qualquer feature de front a
  partir da que criar o tour (`06`). *(decidido)*
- **TOUR-03** **Conta nova**: tour de boas-vindas no primeiro acesso ao Início e o tour de cada tela na primeira
  visita. *(decidido)*
- **TOUR-04** **Conta que já existia** quando uma feature sai: aviso **"Novidade"** no Início com "Fazer o tour"
  (só o tour da novidade) e "Agora não". Conta criada depois da feature não vê o aviso: recebe o tour da tela na
  primeira visita. *(decidido)*
- **TOUR-05** **Concluir** ou marcar "Não exibir novamente" → o tour não aparece mais. **Fechar sem marcar** → aparece
  de novo ao visitar a tela **numa próxima sessão**, não na mesma. *(decidido)* Sessão = do login até sair ou fechar
  o navegador/app *(sugestão da definição)*. "Agora não" na novidade conta como não exibir. *(sugestão)*
- **TOUR-06** Botão de **ajuda (?)** no topo refaz o tour da tela atual a qualquer momento; em Configurações → Conta,
  **"Rever os tours"** faz todos aparecerem de novo. *(sugestão)*
- **TOUR-07** O estado (visto / não exibir) fica **na conta**, por tour e **versão**, separado por plataforma (site e
  app Android têm telas diferentes). O **app Android** também tem tour, com as mesmas regras, numa feature do app.
  *(decidido)* Mudança grande numa tela gera **nova versão** do tour, oferecida como novidade. *(sugestão)*
- **TOUR-08** Passo cujo elemento não está na tela (ex.: menu lateral no celular) usa o equivalente (menu inferior)
  ou aparece centralizado; teclado: Esc fecha, setas avançam e voltam. *(sugestão)*

## BKL — Backlog (combinado para depois)

- **BKL-01** **Juros pagos** em financiamentos/parcelados: informando o valor à vista (ex.: carro de R$ 50.000) e as
  parcelas (50 × R$ 1.500 = R$ 75.000), mostrar os juros (R$ 25.000) numa seção própria.
- **BKL-02** **Relatórios além do mês** (trimestre, ano, comparação ano a ano).
- **BKL-03** **Ler a nota de corretagem em PDF** e preencher a operação (valores e taxas) sozinho.
- **BKL-04** **Proventos automáticos** por API pública.
- **BKL-05** **IR de ações e FIIs** (isenção de vendas até R$ 20 mil/mês, alíquotas, DARF).
- **BKL-06** **Resumo do mês pessoal**, no formato do Encontro do mês (ENC-06).
- **BKL-07** **Modo viagem**: uma seção para a viagem em que tudo o que for lançado enquanto ela estiver ativa cai
  nela (custo total, por tópico, por dia), ligada ao sonho que pagou a viagem. Ideia do usuário, para refinar
  depois. O modo viagem **automatiza** o SON-10: as compras da viagem já ficam marcadas como pagas pelo sonho e o
  app sugere resgatar o total delas. O SON-10 continua sendo a base, porque vale também para sonhos que não são
  viagem (ex.: o sofá) e para quem não usar o modo viagem.
