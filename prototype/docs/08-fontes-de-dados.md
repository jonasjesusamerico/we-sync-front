# 08 — Fontes de dados externas (pesquisa)

Pesquisa feita em **01/11/2026** para os jobs e cálculos que dependem de dados de fora: CDI, salário mínimo,
Tesouro Direto, cotações de ações/FIIs e proventos. Termos e limites mudam: **reconfirmar antes de implementar**.

## Resumo

| Dado | Fonte recomendada | Oficial | Custo / acesso | Automação | Situação |
|---|---|---|---|---|---|
| CDI diário | Banco Central — SGS série **12** | Sim | Grátis, sem cadastro | Permitida (API pública) | ✅ Verificado |
| Salário mínimo | Banco Central — SGS série **1619** | Sim | Grátis, sem cadastro | Permitida | ✅ Verificado (R$ 1.621,00 em 2026) |
| Tesouro Direto (preço e taxa) | Tesouro Transparente — CSV "Taxas dos Títulos Ofertados pelo Tesouro Direto" | Sim | Grátis, licença ODbL | Permitida (dados abertos, com atribuição) | ✅ Verificado (atualização diária) |
| Cotação de ações e FIIs | **brapi.dev** (plano Free) | Não (não é distribuidor licenciado da B3) | Grátis até 15.000 requisições/mês, com token | Uso comercial permitido segundo o FAQ | ⚠️ Serve para começar; tem limites |
| Cotação — arquivos COTAHIST da B3 | B3 | Sim | — | **Proibida** a coleta automatizada | ❌ Não usar no job |
| Proventos de FIIs | CVM — Informe Mensal de FII (dados abertos) | Sim | Grátis, licença ODbL | Permitida | ⚠️ Só mensal e aproximado: serve como sugestão |
| Proventos de ações | Nenhuma fonte pública gratuita estruturada encontrada | — | brapi só nos planos pagos; Alpha Vantage testada: 0 registros | — | ❌ Continuar manual (INV-05) |
| Cotação reserva | Alpha Vantage (grátis) | Não | 25 consultas/dia | Testada: cobre B3 (ações e FIIs) | ⚠️ Reserva da brapi |

## 1. CDI diário — Banco Central (SGS 12)

- Endpoint: `https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=dd/mm/aaaa&dataFinal=dd/mm/aaaa`
  ou `.../dados/ultimos/{N}?formato=json`.
- Retorno verificado: `[{"data":"27/10/2026","valor":"0.050788"}, …]` — taxa **% ao dia**, um registro por dia útil.
- Uso no job semanal (CDI-01): pedir só o intervalo desde a última data gravada; gravar uma linha por data
  (idempotente). Um autor relata erro HTTP 406 em intervalos muito longos: quebrar em janelas menores.

## 2. Salário mínimo — Banco Central (SGS 1619)

- Endpoint: `https://api.bcb.gov.br/dados/serie/bcdata.sgs.1619/dados/ultimos/1?formato=json`.
- Retorno verificado: `{"data":"01/12/2026","valor":"1621.00"}` — valor mensal.
- Uso: na Configuração geral (ADM-03), botão **"Buscar no Banco Central"** que preenche a vigência como
  **sugestão**; o analista confirma (já no protótipo). Dispensa digitação, mas mantém a decisão humana.

## 3. Tesouro Direto — Tesouro Transparente (dados abertos)

- Conjunto: "Taxas dos Títulos Ofertados pelo Tesouro Direto" (Tesouro Nacional).
- Arquivo: `https://www.tesourotransparente.gov.br/ckan/dataset/df56aa42-484a-4a59-8184-7676580c81e3/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1/download/precotaxatesourodireto.csv`
- CSV com o histórico inteiro (~14 MB), **atualizado todo dia** (última atualização vista: 31/10/2026).
- Colunas (segundo o dicionário do Tesouro): tipo do título, data de vencimento, data-base, taxa de compra e de
  venda (manhã), PU de compra, de venda e base (manhã). PU = preço unitário do título.
- Licença **ODbL**: exige **atribuição** ("Fonte: Tesouro Nacional") onde o dado aparece.
- Uso: job diário baixa o CSV uma vez, pega a **última data-base de cada título** e grava o PU.
  Valor da posição = **quantidade de títulos (fracionada) × PU**. A confirmar qual PU usar (base ou venda/resgate).
- Impacto: o cadastro do Tesouro deixa de ser "valor + Ajustar saldo" e passa a ser **quantidade de títulos
  (fracionada) × PU**, com o "Ajustar saldo" como reserva (decidido em F-02). Ex.: 0,1 título × PU R$ 17.459,03 =
  R$ 1.745,90.
- Taxas: o Tesouro **não tem emolumentos/liquidação** como ações; tem **taxa de custódia anual da B3**. Valores a
  confirmar antes de implementar (pendência F-06).

## 4. Cotação de ações e FIIs

### 4.1 B3 — séries históricas (COTAHIST): não usar

- A B3 publica o histórico de cotações desde 1986 (arquivos ZIP com TXT de layout fixo, com abertura, máxima,
  mínima, média e **fechamento**, sem ajuste por proventos).
- **Mas a página informa que os dados são de uso exclusivamente informativo e que a coleta automatizada é
  expressamente proibida**, comercial ou não. Por isso **não pode alimentar o job das 00:00**.

### 4.2 brapi.dev: recomendada para começar

- API brasileira com cotações da B3. Endpoints atuais: `/api/v2/stocks/quote`, `/api/v2/stocks/historical`,
  `/api/v2/stocks/dividends`; FIIs em `/api/v2/fii/`.
- **Plano Free** (FAQ da brapi): **15.000 requisições/mês**, **1 ativo por requisição**, token obrigatório (só PETR4,
  MGLU3, VALE3 e ITUB4 funcionam sem token), atraso de ~30 min, histórico de 3 meses, **sem dividendos**; endpoints
  dedicados de FII aparecem no plano Pro (a cotação de FII pelo endpoint de ações precisa ser testada).
- Uso comercial permitido, sem SLA; não é distribuidora licenciada da B3.
- Conta para o job: 1 vez por dia, 1 requisição por **ativo distinto** que alguém tem na carteira →
  15.000 ÷ 30 ≈ **500 ativos distintos por dia**. Suficiente no começo; com crescimento, plano pago.
- O atraso de 30 min não importa: o job roda às 00:00 e quer o fechamento.

### 4.3 Alpha Vantage (avaliada a pedido, 01/11/2026)

Confirmado na página oficial:
- Plano grátis: **25 requisições por dia** (a página de suporte diz isso; projetos open source/educacionais
  verificados podem ter ilimitado).
- `TIME_SERIES_DAILY` é grátis só no modo "compact" (últimos 100 pregões).
- Cotação em lote (`REALTIME_BULK_QUOTES`, até 100 ativos por chamada) é **paga** e cobre **ativos dos EUA**.
- A documentação traz exemplos de várias bolsas (Londres, Toronto, Alemanha, Índia, China), mas **nenhum da B3**
  (sufixo `.SAO`); a cobertura brasileira **não está documentada**.
- A **página inicial** fala em "dados de mercado globais" e parcerias com bolsas do mundo todo, mas não cita
  nenhuma bolsa além da NASDAQ (de quem é provedora licenciada nos EUA), não cita Brasil/B3, não fala de dividendos
  e não informa limites — os números concretos estão só na página de suporte e na documentação.
- Existe o endpoint **"Corporate Action – Dividends"**, mas não consegui confirmar se é grátis nem se cobre ações
  brasileiras; nada indica cobertura de FIIs. Um comparativo da brapi diz que muitos ativos brasileiros não são
  encontrados (fonte concorrente, então é tendenciosa).

Comparação para o nosso uso:

| | brapi (Free) | Alpha Vantage (grátis) |
|---|---|---|
| Limite | 15.000/mês (≈ 500 ativos distintos/dia) | **25/dia** (= 25 ativos distintos/dia) |
| Cobertura B3 (ações e FIIs) | Foco no Brasil | Não documentada |
| Proventos | Só nos planos pagos | Endpoint existe; grátis e cobertura BR **não confirmados** |
| Uso comercial | Permitido (FAQ) | Não esclarecido na página de suporte |

**Conclusão:** para a **cotação diária**, a Alpha Vantage grátis não comporta o job (25 ativos/dia) e não garante
os ativos da B3; a brapi continua sendo a recomendação. Para **proventos**, a Alpha Vantage merece um **teste
prático** com uma chave grátis (ex.: `WEGE3.SAO` e `MXRF11.SAO` no endpoint de dividendos): se funcionar, um job
**semanal** de proventos caberia no limite (25 ativos/dia × 7 dias = 175 ativos/semana).

#### Teste prático com chave grátis (01/11/2026)

Chave guardada no `.env` da API como `ALPHA_VANTAGE_API_KEY` (o `.env` é ignorado pelo git). 5 chamadas:

| Chamada | Resultado |
|---|---|
| `SYMBOL_SEARCH` "WEGE3" | ✅ Encontra `WEGE3.SAO` (região "Brazil/Sao Paolo", BRL) e também `WEGE3F.SAO` (fracionário) |
| `GLOBAL_QUOTE` `WEGE3.SAO` (ação) | ✅ Fechamento do pregão de 30/10/2026 (R$ 48,36) |
| `GLOBAL_QUOTE` `MXRF11.SAO` (FII) | ✅ Fechamento do pregão de 30/10/2026 (R$ 8,88) |
| `DIVIDENDS` `WEGE3.SAO` | ❌ Responde, mas com **0 registros** |
| `DIVIDENDS` `MXRF11.SAO` | ❌ Responde, mas com **0 registros** |

**Conclusões do teste:**
- **Cotação**: a Alpha Vantage **cobre a B3** (ações e FIIs, sufixo `.SAO`) no plano grátis — só que limitada a 25
  ativos por dia. Serve como **fonte reserva** da brapi (ex.: até 25 ativos que falharem no job do dia).
- **Proventos**: **não traz dividendos de ativos brasileiros** no endpoint `DIVIDENDS`. Não serve para proventos.
  Proventos de ações seguem **manuais**; de FIIs, **sugestão pela CVM** (INV-05).

### 4.4 Outras opções

- Sites de análise (raspagem de páginas): instáveis e normalmente contra os termos de uso; descartado.

## 5. Proventos

- **Ações**: não foi encontrada fonte pública gratuita e estruturada que possa ser automatizada (a da B3 tem a mesma
  proibição de coleta automatizada; na brapi, dividendos só nos planos pagos). Continua **manual** (INV-05).
- **FIIs**: a CVM publica o **Informe Mensal de FII** em dados abertos (`https://dados.cvm.gov.br/dataset/fii-doc-inf_mensal`,
  licença ODbL, atualização semanal, um ZIP por ano). Campos úteis (dicionário baixado e conferido):
  - `Percentual_Dividend_Yield_Mes`, `Rendimentos_Distribuir`, `Valor_Patrimonial_Cotas`
  - `Quantidade_Cotas_Emitidas`, `Codigo_ISIN` (contém a raiz do código: `BRMXRFCTF008` → MXRF), `CNPJ_Fundo_Classe`
  - É **mensal** e não traz data de pagamento nem valor exato por cota: serve para **sugerir** o provento do mês
    para o usuário confirmar (decisão F-03), não para lançar sozinho.

## 5.1 Custódia do Tesouro Direto (regras oficiais, 01/11/2026)

Segundo a página de regras do Tesouro Direto:

- **Taxa da B3: 0,20% ao ano** sobre o valor dos títulos, **provisionada todo dia** a partir da liquidação da compra
  (D+1).
- **Tesouro Selic, IPCA+ e Prefixado**: cobrança proporcional (pro rata) **só** em três momentos — **venda
  antecipada**, **vencimento** e **pagamento de juros** (descontada do valor recebido). Não há mais cobrança
  semestral fixa (mudou no fim de 2024).
- **Tesouro Selic**: **isento até R$ 10.000 por CPF**; acima disso, a taxa incide só sobre o excedente.
- **Tesouro Educa+ e Renda+**: cobrada só em resgate antecipado ou nos recebimentos mensais. **Isento** para renda
  mensal de até **4 salários mínimos (Educa+)** e **6 salários mínimos (Renda+)**; acima, **0,10% ao ano sobre o
  excedente**. As tabelas de venda antecipada desses dois títulos estão em imagens na página e não foram extraídas.

Implicações para o app:
- A posição do Tesouro mostra o valor **líquido estimado** (valor − custódia provisionada) e, na venda, desconta a
  custódia acumulada.
- Os parâmetros (0,20%, R$ 10.000, 4 e 6 salários mínimos, 0,10%) ficam na **Configuração geral** — já no
  protótipo, aba Taxas — porque mudam por decisão do Tesouro/B3. Os limites de Educa+/Renda+ usam o **salário mínimo**
  do próprio cadastro do admin.
- O cálculo exige guardar a **data de cada compra** (a custódia corre desde o D+1 de cada uma).

## 6. Recomendações para a arquitetura

1. Na API, uma **interface de provedor** para cada tipo de dado (cotação, Tesouro, CDI, salário mínimo), para trocar a
   fonte (ex.: brapi Free → plano pago) sem mexer no resto.
2. Jobs **idempotentes por data** (a API roda em 2 instâncias) e pedindo só o que falta.
3. O job de cotação busca só os **ativos distintos** que existem em alguma carteira.
4. Falha de fonte não pode travar o usuário: **último valor conhecido** + aviso, e **valor manual** na Configuração
   geral (aba Rotinas), como já existe para o CDI.
5. **Atribuição** das fontes ODbL (Tesouro Nacional, CVM) nas telas que mostram esses dados.
6. Token da brapi como **segredo de configuração** (variável de ambiente), nunca no código.

## Fontes consultadas

- [B3 — Cotações históricas](https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/historico/mercado-a-vista/cotacoes-historicas/)
- [Banco Central — API SGS série 12 (CDI)](https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/3?formato=json)
- [Banco Central — API SGS série 1619 (salário mínimo)](https://api.bcb.gov.br/dados/serie/bcdata.sgs.1619/dados/ultimos/3?formato=json)
- [TabNews — séries do Banco Central (SGS) e armadilhas](https://www.tabnews.com.br/SidneyBissoli/series-do-banco-central-como-consultar-o-sgs-a-focus-e-a-ptax-sem-cair-nas-armadilhas)
- [Tesouro Transparente — Taxas dos Títulos Ofertados pelo Tesouro Direto](https://www.tesourotransparente.gov.br/ckan/dataset/taxas-dos-titulos-ofertados-pelo-tesouro-direto/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1?inner_span=True)
- [brapi — FAQ](https://brapi.dev/faq) e [brapi — gratuidade da API](https://brapi.dev/faq/api-e-gratis-mesmo)
- [brapi — API do Tesouro Direto](https://brapi.dev/blog/api-tesouro-direto-brasil-como-consultar-2026)
- [CVM — FII: Informe Mensal Estruturado](https://dados.cvm.gov.br/dataset/fii-doc-inf_mensal)
- [rb3 (rOpenSci) — leitura dos dados públicos da B3](https://docs.ropensci.org/rb3/articles/Getting-started.html)
- [Coupler — limites da Alpha Vantage](https://docs.coupler.io/sources/category/finance-and-accounting/alpha-vantage/common-issues)
- [Tesouro Direto — Regras e regulamento (custódia)](https://www.tesourodireto.com.br/conheca/regras.htm)
- [B3 — Política de tarifação do Tesouro Direto (cobrança semestral, 2024)](https://b3.com.br/data/files/CC/A7/6E/11/CC543910B371F339AC094EA8/OC%20014-2024-VPC%20Pol%C3%ADtica%20de%20tarifa%C3%A7%C3%A3o%20do%20Tesouro%20Direto_cobranca_semestral.pdf)
- [B3 Bora Investir — custódia deixa de ser semestral](https://borainvestir.b3.com.br/tipos-de-investimentos/renda-fixa/tesouro-direto/taxa-de-custodia-do-tesouro-direto-deixa-de-ser-cobrada-semestralmente/)
- [Alpha Vantage — página inicial](https://www.alphavantage.co/)
- [Alpha Vantage — suporte (limite grátis)](https://www.alphavantage.co/support/)
- [Alpha Vantage — documentação](https://www.alphavantage.co/documentation/)
- [Coupler — FAQ Alpha Vantage (ações internacionais)](https://docs.coupler.io/sources/category/finance-and-accounting/alpha-vantage/faq)
- [brapi — comparativo brapi × Alpha Vantage (fonte concorrente)](https://brapi.dev/blog/brapi-vs-alpha-vantage-api-comparativo)
