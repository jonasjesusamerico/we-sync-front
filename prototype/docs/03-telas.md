# 03 — Telas do protótipo

Todas em `we-sync-front/prototype/`. Dados de exemplo em `assets/app.js` (compras de outubro/2026 baseadas nas
categorias, formas de pagamento e situações reais da API). Usuário de exemplo: **Jonas**; parceira: **Amanda**.

| Arquivo | Tela | Acesso |
|---|---|---|
| `index.html` | Índice do protótipo | — |
| `login.html` | Entrar | — |
| `cadastro.html` | Criar conta | link no login |
| `dashboard.html` | Início | menu "Início" |
| `compras.html` | Compras | menu "Compras" |
| `nova-compra.html` | Nova compra | botão "Nova compra" / "+" |
| `casa.html` | Nossa casa | menu "Nossa casa" / "Casa" |
| `casa.html?vazio=1` | Criar casa (sem vínculo) | índice |
| `casa.html?semrenda=1` | Casa com a Amanda sem renda no mês (renda mínima) | índice |
| `casa.html?arquivada=1` | Casa arquivada (depois de sair) | índice / "Sair da casa" |
| `casa.html?mes=setembro` | Encontro do mês (mês fechado) | ‹ no seletor de mês da casa |
| `casa.html?tour=sonhos` | Tour da novidade Sonhos do casal | aviso "Novidade" no Início |
| `convite.html` | Aceitar convite | link do convite |
| `metas.html` (`#pessoal`, `#casa`) | Metas e relatórios | menu Planejamento |
| `investimentos.html` | Investimentos | menu Planejamento |
| `admin.html` (`#salario`, `#padroes`, `#parametros`, `#taxas`, `#jobs`, `#historico`) | Configuração geral (admin) | menu Sistema (só admin) |
| `configuracoes.html` (`#rendas`, `#orcamento`, `#categorias`, `#pagamentos`, `#conta`) | Configurações | menu Administração / "Ajustes" |

## Em todas as telas: tour guiado
- Na primeira visita a cada tela abre o **tour** dela: um cartão com "Passo X de N", título, explicação, Voltar,
  Prosseguir/Concluir, Fechar (×) e "Não exibir novamente"; o elemento explicado fica destacado e o resto escurece.
- Botão **?** no topo refaz o tour da tela. `?semtour=1` na URL abre a tela sem o tour.
- Fechar sem marcar "Não exibir novamente": o tour não volta na mesma sessão (nesta aba do navegador).
- O protótipo guarda o estado no navegador; para ver tudo de novo: Configurações → Conta → **Rever os tours**.

## Entrar e Criar conta
- Entrar: painel azul com cartão de exemplo e frase de valor; e-mail, senha com mostrar/ocultar, "Esqueci a
  senha" (futuro), link para cadastro. Erro genérico "E-mail ou senha incorretos".
- Criar conta: **nome**, e-mail, senha com medidor de força (8+ caracteres; mistura maiúsculas, números, símbolos).

## Início (dashboard)
- Saudação, seletor de mês.
- Aviso **"Novidade: Sonhos do casal"** com "Fazer o tour" (abre a casa no tour da novidade) e "Agora não".
- Cartão azul: gasto do mês, comparação com o mês anterior, barra da **meta do mês** (link para Metas).
- Indicadores: já pago, a pagar, nº de compras, média por dia.
- **Disponível na conta**: renda − já pago (pessoal + casa, 100% do que a pessoa pagou); a pagar; sobra prevista.
- **Nossa casa**: barra da divisão (63% / 37%), gastos da casa, sua parte, quanto você pagou, quem deposita quanto.
- Gastos por dia (barras, pico destacado), por categoria (rosca + legenda), últimas compras, formas de pagamento.

## Compras
- Resumo (quantidade e total sem canceladas), seletor de mês.
- Editar um lançamento de série (fixa/parcela) pergunta **"Atualizar as próximas também?"** (Esta e as próximas /
  Só esta) e abre a Nova compra em modo edição.
- Filtros: busca por descrição, categoria, situação (Todas/Paga/Pendente/Cancelada).
- Computador: tabela (descrição + categoria + etiquetas "casa"/"fixa"/"parcela k/N", data, pagamento, situação,
  valor, editar/excluir). Celular: lista em cartões. Paginação (8 por página). Estado vazio. Toast após salvar.

## Nova compra
- Valor grande com máscara; descrição; data (hoje por padrão).
- **Categoria** em blocos com ícone; **Tópico (opcional)** aparece abaixo, **sugerido pela descrição** (ex.: "iFood
  pizza" → Alimentação › Delivery) com a etiqueta "sugerido pela descrição".
- Forma de pagamento (chips), situação (Paga/Pendente).
- **De quem é o gasto?** Pessoal / Compartilhada (só com vínculo), com o texto da divisão do mês.
- **Repetir**: Não repete / Conta fixa (por N meses) / Parcelada (nº de parcelas ↔ última parcela; valor **da
  parcela** ou **o total**, com centavos na última), com resumo.
- **Modo edição** (`?editar=esta` / `?editar=proximas`): título "Editar compra" e qual parte da série muda.
- Resumo lateral ao vivo; validação (valor > 0, descrição, categoria).

## Configurações
- **Rendas**: indicadores (renda do mês, próximo recebimento, sobra prevista); lista com tipo, frequência, dia,
  chave ativa/pausada, editar, remover. Modal: valor, descrição, tipo (Salário, Benefício, Renda extra, Outros),
  frequência (Mensal, Quinzenal, Única), dia (1–31) — na **Única**, a **data em que caiu na conta** —, ativa.
- **Orçamento**: agora só aponta para Metas e relatórios.
- **Categorias**: criar com nome, ícone e cor; lista das próprias ("sua") e das padrão (cadeado, "padrão").
  **Tópicos**: lista por categoria (padrão em texto, próprios como etiquetas removíveis) e criação de tópico próprio.
- **Formas de pagamento**: criar e remover próprias; padrão com cadeado.
- **Conta**: perfil (nome, e-mail), trocar senha, tema (claro/escuro), **dia de início do mês financeiro** (1–28),
  **Rever os tours**, excluir conta (confirmação).

## Nossa casa
- **Divisão do mês**: barra Jonas/Amanda, rendas de cada um (vindas das Configurações), percentuais; aviso quando
  alguém está sem renda e entrou a renda mínima.
- **Acerto do mês**: tabela Quem / Parte / Deveria pagar / Pagou / Diferença; resultado "Amanda deposita R$ 631,77
  na caixinha" com escolha da caixinha (pré-seleciona a da pessoa) e "Registrar depósito"; explicação "Por que não é
  só a diferença simples?"; selo Em aberto / Aguardando confirmação / Acertado. No modo transferência: "Amanda
  transfere R$ X para Jonas".
- **Padrão de gastos**: barras dos meses com linha do padrão; alerta "Outubro passou R$ 546,09 do padrão";
  **sugestão de resgate** com a pergunta **"De onde sai o resgate?"**: tudo de uma caixinha ou **proporcional aos
  dois**, cada opção com o IR estimado; a de **menor custo** vem marcada; valores arredondados para cima ao real.
- **Avisos pendentes** no topo: "O resgate de R$ X foi sacado?" / "Amanda depositou R$ X?" com Sim / Não.
- **Caixinhas**: nome, instituição, titular, % do CDI, aplicado, rendimento, IR estimado, líquido; "Ajustar saldo";
  "Nova caixinha" (nome, instituição, em nome de Jonas/Amanda/Conta conjunta, % CDI).
- **Compras compartilhadas** do mês com "pago por".
- **Sonhos do casal**: cada sonho com valor, mês alvo, caixinha (instituição, titular, % CDI), barra de progresso,
  situação (Adiantado / No ritmo / Atrasado / Concluído), **guardar por mês** com a parte de cada um pela renda e a
  previsão no ritmo atual. "Guardar" (quem e quanto, sugere a parte da pessoa) registra um depósito **provisório**
  com aviso "Jonas guardou R$ X no sonho?". **"Resgatar"** (valor até o saldo, quem recebe, "para quê" opcional)
  também fica provisório. "Novo sonho": nome, valor, mês alvo, caixinha do sonho.
- **Seletor de mês**: outubro é o mês atual do exemplo. Voltar para **setembro** (fechado) abre o **Encontro do
  mês** no lugar da tela: 5 passos (Como foi, O que deu certo, Pontos de atenção, Acerto, Próximo mês), cada um com
  uma pergunta para conversar; Voltar/Prosseguir, atalho pelos passos, "Concluir encontro". **Fechar** mostra o
  resumo do mês fechado (só leitura) com "Ver o encontro do mês". Ir para outubro e voltar abre o encontro de novo.
- **Movimentações das caixinhas** (depósito/resgate, Confirmado/Provisório).
- **Configurar casa** (modal): nome, modo do acerto (caixinha/transferência), **meta mensal da casa**, **dia de
  início do mês**, **renda mínima considerada**, membros, sair da casa (confirmação explicando o que acontece).
- **Casa arquivada** (`?arquivada=1`): aviso "Casa arquivada", tudo só leitura, acerto "Pausado", caixinhas com
  "no pessoal de …".
- **Criar casa** (`?vazio=1`): como funciona, nome, link de convite (**48h**, uso único, com horário de expiração),
  copiar, **reenviar** (gera outro link e invalida o anterior).

## Aceitar convite
- "Jonas convidou você para a casa 'Nossa casa'"; o que fica privado, que as rendas ficam visíveis, caixinhas;
  Aceitar / Recusar; link para criar conta.

## Metas e relatórios
- Chave **Pessoal / Nossa casa** (mesmo motor).
- **Meta do mês**: gasto até hoje / meta, barra com marca da projeção, projeção do mês, contas fixas a vencer,
  "dá para gastar por dia", alerta pelo ritmo; "Alterar meta".
- **Padrões identificados**: crescimento (ex.: Delivery +15%/mês, motivo: mais pedidos) e fora do normal (ex.:
  Restaurante); explicação do método.
- **Relatório por tópico**: até hoje, projeção, % da meta, vs. média, minigráfico de 6 meses; linha expansível com
  os meses, tendência e frequência.
- **Metas por tópico**: barra da projeção contra o limite; criar/remover.

## Investimentos
- Indicadores: patrimônio, aplicado (com taxas), resultado (R$ e %), proventos do ano.
- Distribuição: ações, FIIs, Tesouro Direto, caixinhas.
- **Investido no mês**: operações do mês e o total que vira o lançamento "Investimento".
- **Ações e FIIs**: quantidade, preço médio, cotação (job das 00:00), valor atual, resultado, proventos.
- **Tesouro Direto**: título, taxa, vencimento, aplicado, valor, "Ajustar saldo".
- **Caixinhas**: pessoais e as da casa em que o usuário é titular (etiqueta "da casa").
- **Proventos** (com a corretora onde caíram) e **Corretoras**: corretagem cadastrada pelo usuário (fixa e/ou %),
  **saldo disponível** de cada uma e botões **Depositar** e **Sacar**.
- Preços vêm do **catálogo de ativos** do admin; comprar um código fora do catálogo mostra "Ativo fora do catálogo.
  Peça ao administrador para cadastrar" e o botão **"Pedir cadastro de …"**. Ativo pausado ou não encontrado aparece
  com a etiqueta **"preço de dd/mm/aaaa"** (no exemplo, WEGE3 está pausada). Compra de Tesouro não soma as taxas da B3.
- **Nova operação** (modal): compra/venda, código (sugestões do catálogo), tipo, quantidade, preço, data, corretora, **pagar com saldo da
  corretora ou conta normal** (compra); mostra valor bruto, taxas, total, novo preço médio ou resultado da venda e
  para onde vai o dinheiro; aviso "em breve: importar nota em PDF".
- Distribuição inclui o **saldo nas corretoras**; "Investido no mês" lista compras, vendas e saques.
- **Novo provento** (modal): ativo, tipo (Dividendo, JCP, Rendimento), data, corretora onde caiu, valor.
- No **Início**, "Disponível na conta" desconta o "Investido no mês"; em **Compras**, um cartão mostra o
  lançamento "Investimento de outubro".

## Configuração geral (admin)
- Só aparece no menu (grupo **Sistema**) para contas admin; aviso de que não mostra dados de usuários.
- Abas: **Salário mínimo** (vigências, "Buscar no Banco Central"), **Ativos** (catálogo: cadastrar, pausar, fonte,
  último fechamento, situação, consultas por dia × limite, rodar o job, **pedidos de cadastro**; Tesouro com cadastro
  automático), **Cadastros padrão** (categorias, tópicos, palavras-chave, formas de
  pagamento), **Parâmetros** (detecção de padrão, validade do convite), **Taxas da B3** (e a **custódia anual do Tesouro**), **Rotinas** (CDI, cotações,
  confirmações; CDI manual), **Histórico** de alterações.

## Notificações
- Sino na barra superior com lista (ex.: "Amanda registrou uma compra da casa…", "Os gastos da casa passaram do
  padrão").
