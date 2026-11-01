# 01 — Visão geral e decisões

Estado em **01/11/2026**. Este documento resume o que foi decidido na conversa de refinamento do novo front-end do
we-sync, por que, e onde cada coisa está.

## Objetivo

Recriar do zero o front-end do we-sync (gestão financeira pessoal) com um visual próprio, **amigável e fluido**,
para **celular e computador**, e evoluir o produto com:

1. **Rendas** (salários, benefícios, freelas) e **configurações** do usuário.
2. **Nossa casa**: um casal compartilha as despesas da casa e divide **proporcionalmente à renda** (quem ganha mais
   paga mais), com **acerto mensal** e **caixinhas** da casa rendendo CDI.
3. **Metas e relatórios**: meta de gasto mensal (pessoal e da casa), alertas pelo ritmo do mês, relatório por
   tópico e detecção automática de padrões de consumo (ex.: delivery sempre crescendo).
4. **Repetição** de lançamentos: contas fixas e compras parceladas.

## Onde está cada coisa

| O quê | Onde |
|---|---|
| Protótipo navegável (HTML + Bootstrap, roda offline) | `we-sync-front/prototype/` — abrir `index.html` |
| Esta documentação | `we-sync-front/prototype/docs/` |
| Front antigo (Material + migração ArchitectUI) | branch **`legacy`** do `we-sync-front` (commit `a10e2de`) |
| API Go atual | `we-sync-api/` (auth, compras, categorias, formas de pagamento) |
| Requisitos formais (próxima etapa) | `we-sync-requirements/docs/features/` (hoje vão até `003-lancamentos`) |

### Como abrir o protótipo

```bash
xdg-open ~/Documentos/github/we-sync-front/prototype/index.html
```

Ou dois cliques em `prototype/index.html`. Para ver como celular no navegador: **F12** e depois **Ctrl+Shift+M**.
Não precisa instalar nada nem subir servidor. Nada é salvo: ao recarregar a página, os dados de exemplo voltam.

## Decisões de processo

| # | Decisão | Motivo |
|---|---|---|
| D-01 | O front atual será **removido 100%** e refeito. O estado anterior foi guardado na branch `legacy` (nada foi apagado). | O usuário não gostava do visual (Material) e queria recomeçar com identidade própria. |
| D-02 | **Desenhar antes de programar**: protótipo clicável em HTML + Bootstrap 5.3, que vira o Angular quase 1:1. | O usuário não tem experiência com front-end; ver as telas funcionando evita retrabalho. |
| D-03 | O protótipo roda **localmente**, sem CDN, fontes externas nem páginas publicadas. | Pedido do usuário: não consumir recursos externos/cotas. |
| D-04 | Stack do front novo: **Angular + Bootstrap 5.3** (sem Material). AdminLTE foi avaliado e descartado em favor de um design system próprio. | Bootstrap é simples; o visual próprio atende "amigável e fluido". |
| D-05 | Regras de negócio e cálculos (divisão, acerto, metas, padrões) devem ficar **centralizados na API**, numa rotina única que recebe o **escopo** (pessoal ou casa). | Pedido do usuário ("código centralizado para evitar problemas"); também serve ao app Android (`we-sync-app`). |
| D-06 | Features grandes passam pelo fluxo formal de requisitos (`we-sync-requirements`) antes de virar código. | Regra do projeto; "Nossa casa" mexe no isolamento de dados entre usuários. |
| D-07 | **Tudo do front antigo é desconsiderado** (features 001–003 no front, débito DT-004). O front novo sai só do protótipo; o que essas features entregaram na API continua valendo. | Pedido do usuário (12ª rodada). |
| D-08 | As features são implementadas **na ordem de `06-impacto-tecnico.md`** (004–024): pequenas, pessoal antes da casa, base antes do que depende dela. | Pedido do usuário: "a ordem mais correta, para não complicar a implementação". |

## Decisões de produto (resumo — detalhes em `04-regras-de-negocio.md`)

- **Visual**: amigável, fluido, azul (inspiração no estilo de apps financeiros como a Conta Azul, sem copiar), tema
  claro e escuro, uso em celular e computador.
- **Casa só para casal** (2 pessoas), por convite; rendas **visíveis** para os dois; a divisão usa **todas** as
  rendas cadastradas, com vigência por mês.
- **Lançamento**: "Pessoal" é o padrão; "Compartilhada" só aparece com vínculo; quem registra é quem pagou e só ele
  edita/apaga.
- **Visão pessoal = fluxo de caixa**: a compra compartilhada conta **100%** para quem pagou; a área da casa mostra a
  parte de cada um.
- **Caixinha é dinheiro da casa** (dos dois). O acerto pede que quem pagou menos **deposite** um valor que deixa a
  contribuição de cada um exatamente na proporção da renda.
- **Resgate da caixinha** só como **sugestão**, quando o mês passa do **padrão** (média real), indicando a caixinha
  de menor custo de IR.
- **Depósitos e resgates são provisórios** até a pessoa confirmar (aviso no dia seguinte).
- **CDI** vem de um job semanal (Banco Central); o app estima o rendimento com IR regressivo e permite ajustar o saldo
  pelo extrato.
- **Metas** pessoais e da casa, com alertas pela **projeção** do mês; **tópicos** (subcategorias) sugeridos pela
  descrição; **detecção de padrão** por regressão linear e desvio padrão.
- **Repetição**: conta fixa por N meses e parcelada (nº de parcelas ou última parcela).

## Histórico (31/10 e 01/11/2026)

1. Pedido inicial: trocar o front pelo AdminLTE (dashboard v2). Análise mostrou dados fictícios no template,
   dependências novas e conflito com o ADR-01 do front.
2. O usuário preferiu **Angular + Bootstrap com visual próprio**; decidiu remover o front e prototipar.
3. Protótipo v1: login, cadastro, início (dashboard), compras, nova compra.
4. Configurações (painel do usuário): rendas, orçamento, categorias, formas de pagamento, conta.
5. Ideia "Nossa casa": refinada em três rodadas (vínculo, renda, acerto, caixinhas, CDI, resgate, confirmação).
6. Metas, relatórios, tópicos, detecção de padrão e repetição; a aba "Orçamento" foi para "Metas".
7. A parceira de exemplo passou a se chamar **Amanda**.
8. 2ª rodada: as 14 pendências foram respondidas (salário mínimo para quem está sem renda, convite de 48h,
   resgate proporcional arredondado, casa pausada ao sair, parcelada por parcela ou total, entre outras).
   Surgiram 7 perguntas novas (N-01..N-07).
9. 3ª rodada: renda mínima configurável por casa (padrão: salário mínimo do sistema), centavos na última parcela,
   reenviar convite invalida o anterior, caixinhas migram para o pessoal ao arquivar a casa, qualquer um reabre o
   acerto, resgate proporcional completa com a caixinha do outro. Protótipo atualizado com a 2ª e a 3ª rodadas.
10. 4ª rodada: e-mail só para confirmar cadastro e recuperar senha; caixinha de conta conjunta fica com os dois ao
    arquivar; novo menu **Investimentos** (caixinhas pessoais, ações, FIIs, Tesouro Direto); **rota de admin** para
    analistas de negócio (configuração geral do sistema). A tela de design vazia no claude.ai foi apagada.
11. 5ª rodada: Investimentos buy and hold (cotação por job às 00:00, compra/venda com corretagem por corretora,
    proventos à mão, só lucro/prejuízo, Tesouro como caixinha, lançamento mensal "Investimento"); admin por flag no
    banco, com histórico de alterações e sem acesso a dados de usuários. Protótipo: `investimentos.html`, `admin.html`.
12. 6ª rodada: saldo disponível em cada corretora (vendas caem nele; compra pode usar o saldo), saque para a conta
    normal, lançamento "Investimento" = saiu da conta normal − saques, fora da meta; corretagem cadastrada pelo
    usuário; caixinha de conta conjunta para os dois.
13. 7ª rodada: proventos caem no saldo da corretora, depósito na corretora, Tesouro com o mesmo fluxo das ações.
    Pesquisa de fontes (`08-fontes-de-dados.md`): Banco Central para CDI e salário mínimo, Tesouro Transparente para
    o Tesouro, brapi para cotações (a B3 proíbe coleta automatizada), CVM para sugerir proventos de FII.
14. 8ª rodada: Tesouro por quantidade fracionada × PU do dia; proventos de ações manuais; CVM sugere os de FII.
    Alpha Vantage avaliada: grátis só 25 ativos/dia e B3 sem cobertura documentada — candidata só para proventos,
    após teste prático.
15. 9ª rodada: brapi confirmada para cotações; **catálogo de ativos** na Configuração geral — o job atualiza cada ativo
    uma vez por dia e todas as carteiras leem esse preço (evita consultas repetidas e protege o limite).
16. 10ª rodada: todas as sugestões aceitas — pedido de cadastro de ativo aprovado pelo analista, títulos do Tesouro
    cadastrados sozinhos, preço desatualizado com aviso, custódia anual do Tesouro no admin, teste prático da Alpha
    Vantage para proventos (aguardando a chave).
17. Teste da Alpha Vantage (chave no `.env` da API): cobre cotações da B3 (ações e FIIs), mas **não** traz proventos
    brasileiros. Proposta: usá-la como reserva da brapi para cotações.
18. 11ª rodada: Alpha Vantage aprovada como reserva de cotações; custódia do Tesouro pelas regras oficiais (0,20% a.a.,
    Selic isento até R$ 10 mil, Educa+/Renda+ com isenção por salários mínimos). Sem perguntas de produto em aberto.
19. 12ª rodada: protótipo e docs commitados; front antigo desconsiderado por completo (D-07); ordem das features
    004–024 definida em `06-impacto-tecnico.md` (D-08). Próximo passo: revisão e aprovação do protótipo.

Documentos seguintes:
[02 Design system](02-design-system.md) ·
[03 Telas](03-telas.md) ·
[04 Regras de negócio](04-regras-de-negocio.md) ·
[05 Cálculos](05-calculos.md) ·
[06 Impacto técnico](06-impacto-tecnico.md) ·
[07 Pendências e próximos passos](07-pendencias-e-proximos-passos.md) ·
[08 Fontes de dados](08-fontes-de-dados.md)
