# 05 — Cálculos

Fórmulas usadas no protótipo (implementadas em `assets/app.js` → `houseMonth`, `houseStandard` e em
`metas.html` → `analyzeTopic`, `analyzeScope`). Na API, estas contas devem ficar numa rotina única (D-05).
Dinheiro sempre em **centavos inteiros**; arredondar só no fim.

## 1. Proporção da renda

```
parteA = rendaA / (rendaA + rendaB)        parteB = 1 − parteA
```

Exemplo: Jonas R$ 8.500 (salário 6.500 + vale 800 + freela 1.200), Amanda R$ 5.000 (salário 4.200 + vale 800)
→ Jonas **63%**, Amanda **37%** (0,6296 / 0,3704).

**Sem renda no mês (DIV-05, DIV-06):** quem não tiver renda entra com a **renda mínima da casa** (configurada no
painel da casa; se vazia, o salário mínimo cadastrado pelo dono do sistema).
Ex.: Jonas R$ 8.500 e Amanda sem renda → Amanda = 1 salário mínimo `SM` → parteAmanda = SM / (8.500 + SM).
Se nenhum tiver renda: SM / (SM + SM) = **50% / 50%**.
No protótipo (`casa.html?semrenda=1`, salário mínimo de 2026 = R$ 1.621, SGS 1619): Jonas 8.500 × Amanda 1.621 →
**84% / 16%**.

## 2. Acerto do mês

Totais pagos (só compras compartilhadas **Pagas**): `pagoA`, `pagoB`; `total = pagoA + pagoB`.

```
deveriaA = total × parteA           diferençaA = pagoA − deveriaA
```

### 2a. Modo caixinha (o dinheiro é da casa) — padrão

Quem contribuiu menos que a proporção deposita `d` tal que `pagoA : (pagoB + d) = parteA : parteB`:

```
se pagoA / parteA ≥ pagoB / parteB:   B deposita  d = pagoA × parteB / parteA − pagoB
senão:                                 A deposita  d = pagoB × parteA / parteB − pagoA
```

Exemplo simples: total R$ 3.000; Jonas pagou 2.200, Amanda 800.

| | Deposita | Contribuição final | Proporção |
|---|---|---|---|
| Diferença simples | 310 | 2.200 / 1.110 | 66% / 34% ✗ |
| **Fórmula da casa** | **492** | 2.200 / 1.292 | **63% / 37%** ✓ |

Exemplo do protótipo (outubro): Jonas pagou R$ 2.431,12; Amanda R$ 798,30 → **Amanda deposita R$ 631,77**.

### 2b. Modo transferência

```
B transfere para A:  deveriaB − pagoB      (se negativo, A transfere para B)
```

### 2c. Com resgate da caixinha

O resgate `R` recebido por um membro (titular da caixinha) reduz o "pago" dele e o total:

```
pagoTitular' = pagoTitular − R          total' = total − R
```

Exemplo: resgate de R$ 546,09 recebido por Jonas → pago 1.885,03; total 2.683,33 → **Amanda deposita R$ 310,54**.

### 2d. De quem sai o resgate (RES-03, RES-06)

Três opções sugeridas: caixinha de A, caixinha de B, ou **proporcional** (pela divisão do mês). Cada parte é
**arredondada para cima ao real inteiro**:

```
proporcional:  rA = teto(R × parteA)      rB = teto(R × parteB)      (teto = arredonda para cima ao real)
pagoA' = pagoA − rA      pagoB' = pagoB − rB      total' = total − rA − rB
```

Exemplo do usuário: partes de R$ 458,25 e R$ 123,57 → resgatar **R$ 459** e **R$ 124** (R$ 583 no total; o
arredondamento faz o resgate ficar alguns reais acima do excedente).

Se a parte de um não couber nas caixinhas dele, o restante sai das caixinhas do outro (RES-07).

Exemplo do protótipo (excedente R$ 546,09 → R$ 547): tudo da Reserva da casa (IR ≈ R$ 5,36), tudo da Caixinha da
Amanda (IR ≈ R$ 3,29, **menor custo**, vem marcada) ou proporcional: Jonas R$ 344 + Amanda R$ 203 (IR ≈ R$ 4,59).

> Observação: o resgate **proporcional** tira dos dois na mesma proporção da divisão, então ele **quase não muda o
> depósito do acerto** (R$ 631,77 → R$ 632,42 no exemplo). Já o resgate **de um só** reduz o "pago" daquela pessoa e
> muda o acerto. A escolha entre as opções é, na prática, sobre **IR** e **de qual conta sai o dinheiro**.

## 3. Padrão de gastos da casa

```
≥ 12 meses de histórico:  média dos últimos 12
3 a 11 meses:              média dos últimos 3
< 3 meses:                 meta da casa
excedente = gasto do mês − padrão     (sugere resgate se > 0)
```

Exemplo: histórico mai–set = 2.480, 2.550, 2.600, 2.750, 2.700 (5 meses) → padrão = média de jul–set =
**R$ 2.683,33**; outubro R$ 3.229,42 → excedente **R$ 546,09**.

## 4. Custo estimado de IR no resgate

```
IR ≈ valor resgatado × (rendimento / saldo bruto) × alíquota
```

Alíquota regressiva por tempo de cada depósito: até 180 dias **22,5%**; 181–360 **20%**; 361–720 **17,5%**;
acima de 720 **15%**. IOF regressivo nos primeiros 29 dias (zero a partir do 30º).
A caixinha sugerida é a de **menor alíquota** que tenha saldo suficiente.

Exemplo: Reserva da casa (aplicado 8.000, rendeu 412,35, 20%) → resgate de 546,09 custa ≈ **R$ 5,35**.

## 5. Rendimento da caixinha (CDI)

```
para cada dia útil d:   saldo ← saldo × (1 + CDI_d × %CDI / 100)
rendimento bruto = saldo − aplicado          líquido ≈ aplicado + rendimento × (1 − alíquota)
```

`CDI_d` é a taxa diária (% a.d.) da série 12 do SGS/Banco Central. "Ajustar saldo" mantém o aplicado e recalcula o
rendimento para que o líquido bata com o extrato (se o extrato for menor que o aplicado, o aplicado passa a ser o
valor do extrato).

## 6. Projeção do mês e valor diário

```
projeção = Σ fixas (valor esperado) + Σ variáveis até hoje ÷ diasPassados × diasDoMês
fixasAVencer = Σ max(0, esperado − pago até hoje)
porDia = (meta − gasto até hoje − fixasAVencer) ÷ diasRestantes
```

Exemplo casa (dia 20 de 31): fixas 1.450 + 380 = 1.830; variáveis até hoje 965 → 965 ÷ 20 × 31 = 1.495,75;
projeção **R$ 3.325,75** (+11% da meta de 3.000). Gasto até hoje 2.675, fixas a vencer 120 →
(3.000 − 2.675 − 120) ÷ 11 = **R$ 18,64 por dia**.

## 7. Tendência de crescimento (regressão linear)

Série `y` dos últimos 6 meses (o atual pela projeção), `x = 0..5`:

```
inclinação = Σ (x − x̄)(y − ȳ) / Σ (x − x̄)²
crescimento = inclinação / ȳ
mesesDeAlta = nº de altas seguidas no fim da série
alerta se crescimento ≥ 10% e mesesDeAlta ≥ 3
daqui a 6 meses ≈ intercepto + inclinação × (5 + 6)
```

Exemplo Delivery (casa): 180, 210, 260, 290, 340, 387,50 → inclinação **R$ 41,64/mês**, crescimento **15%/mês**,
5 meses de alta, em 6 meses ≈ **R$ 631,88/mês**. Motivo: pedidos 4 → 8 por mês, ticket R$ 45 → R$ 50.

## 8. Fora do normal (desvio padrão)

```
alerta se projeção > média(histórico) + 1,5 × desvioPadrão(histórico)
```

Exemplo Restaurante: histórico 150, 140, 160, 155, 145 → média 150, desvio 7,07, limite 160,61; projeção
**232,50** → alerta.

## 9. Investimentos

```
taxas da operação = corretagem da corretora + valor × (emolumentos + liquidação da B3)
compra:  preço médio novo = (qtd × preço médio + valor + taxas) ÷ (qtd + quantidade comprada)
venda:   resultado = valor − taxas − quantidade vendida × preço médio      (preço médio não muda)
posição: valor atual = qtd × cotação de fechamento (job das 00:00)    resultado = valor atual − qtd × preço médio
taxas da corretora (cadastradas pelo usuário) = fixa por ordem + valor × % da ordem
venda:   saldo da corretora += valor − taxas
compra paga com o saldo:   saldo da corretora −= valor + taxas      (não mexe no mês)
saque:   saldo da corretora −= saque
provento: saldo da corretora += valor
depósito: saldo da corretora += depósito
lançamento "Investimento" do mês = Σ compras pagas pela conta normal (valor + taxas) + Σ depósitos − Σ saques
```

Exemplo do protótipo: ITSA4, 300 a R$ 9,80; compra de 100 a R$ 10,50 na Corretora A (corretagem 0; B3 0,030% de
exemplo → R$ 0,31) → preço médio **R$ 9,98**. Outubro: MXRF11 R$ 982,29 + ITSA4 R$ 510,05 = **R$ 1.492,34** de
Investimento, descontados do disponível.

Tesouro Direto: valor = quantidade de títulos (fracionada) × PU do dia.
Custódia (Selic, IPCA+, Prefixado): por dia, `base × 0,20% ÷ 365`, onde base = valor do dia (no Selic, só o que passar
de R$ 10.000 somando os títulos Selic do usuário); acumulada desde o D+1 de cada compra e descontada na venda,
no vencimento ou nos juros. Ex.: R$ 20.000 em Tesouro Selic por 1 ano → base R$ 10.000 → ≈ **R$ 20** de custódia.
Educa+ / Renda+: 0,10% ao ano só sobre o que passar de 4 / 6 salários mínimos de renda mensal. Ex.: compra de 0,1 título a PU
R$ 17.459,03 = **R$ 1.745,90**; posição de 0,31 → 0,41 título.

Ciclo testado no protótipo: venda de 100 BBAS3 a R$ 28,00 (taxas R$ 0,84) → saldo da Corretora A
R$ 312,40 + R$ 2.799,16 = R$ 3.111,56 (mês não muda); compra de 200 MXRF11 a R$ 9,70 com o saldo → R$ 1.170,98;
saque de R$ 1.170,98 → lançamento do mês R$ 1.492,34 − R$ 1.170,98 = **R$ 321,36**.

## 10. Repetição

```
Conta fixa:  meses k = 0..N−1 → data = mesmo dia do mês inicial (ou último dia do mês)
Parcelada:   N = (anoÚltima × 12 + mêsÚltima) − (anoInício × 12 + mêsInício) + 1
  por valor da parcela:  total = parcela × N
  por valor total:       parcela = total ÷ N   (centavos que sobram vão para a última parcela)
```

Exemplo: primeira em out/2026, última em dez/2028 → **27 parcelas**.
Por valor total: R$ 1.000,00 em 3× → 333,33 + 333,33 + 333,34.

**Juros (backlog BKL-01):** `juros = parcela × N − valor à vista`. Ex.: 50 × 1.500 − 50.000 = **R$ 25.000**.

## 11. Sonhos do casal (SON-02..SON-04)

```
n      = meses do mês atual até o mês alvo (depósitos no fim de cada mês)
alíquota IR pelo prazo: n ≤ 6 → 22,5% · ≤ 12 → 20% · ≤ 24 → 17,5% · > 24 → 15%
r      = ((1 + CDI_ano)^(1/12) − 1) × %CDI/100 × (1 − alíquota)        taxa mensal líquida estimada
falta  = valor − saldo × (1 + r)^n
guardar por mês = falta × r ÷ ((1 + r)^n − 1)        arredondado para cima, ao real (0 se falta ≤ 0)
parte de cada um = guardar × proporção da renda      cada parte arredondada para cima, ao real
previsão: menor k com  saldo × (1 + r)^k + ritmo × ((1 + r)^k − 1) ÷ r ≥ valor
  ritmo = média do que foi guardado (confirmado) nos últimos 3 meses; sem depósitos, o valor sugerido
situação: k ≤ n − 1 → Adiantado · k = n → No ritmo · k > n → Atrasado · saldo ≥ valor → Concluído
```

Exemplo (protótipo, CDI de exemplo 14,9% ao ano): **Viagem para o Chile**, R$ 12.000 até jul/2027, saldo R$ 3.800,
100% do CDI, mês atual out/2026.

- n = 9 meses → alíquota 20%; CDI mensal = 1,1642% → r = 1,1642% × 0,8 = **0,9313% ao mês**.
- (1 + r)^9 = 1,08701 → o saldo vira R$ 4.130,64; falta R$ 7.869,36.
- Guardar por mês = 7.869,36 × 0,009313 ÷ 0,08701 = R$ 842,30 → **R$ 843**.
- Proporção 63% / 37% (R$ 8.500 / R$ 5.000): Jonas 530,75 → **R$ 531**; Amanda 312,25 → **R$ 313**.
- Ritmo (R$ 900 + R$ 900 + R$ 800 nos últimos 3 meses → média R$ 866,67): chega em **9 meses → jul/2027**, situação **No ritmo**.

**Resgate do sonho no mês (SON-10):** entra no acerto como um resgate da seção 2c (abate do total a dividir e do
"pago" de quem recebeu) e sai do gasto comparado com a meta e o padrão: `gasto do mês = compras − resgates de sonho`.
Exemplo (protótipo, outubro): compras da casa R$ 3.229,42, resgate do sonho de R$ 1.500 para o Jonas → gasto
R$ 1.729,42 (dentro do padrão) e o acerto passa a ser "Jonas deposita R$ 425,99". No exemplo, a viagem não tem
compras lançadas em outubro, por isso o acerto se inverte; numa viagem real, as compras do cartão e o resgate se
compensam.
