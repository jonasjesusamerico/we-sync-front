// Texts of the home page (feature 004). No Angular imports: the e2e re-exports this file.
export const TITLE_HOME = 'Início · we-sync';
export const greeting = (name: string): string => `Olá, ${name}`;
export const GREETING_FALLBACK = 'Olá!';
export const HOME_SUBTITLE = 'Veja como está o seu mês.';

// Spending card (feature 005, RF-06, RF-07).
export { LABEL_NEW_PURCHASE } from '../../layout/shell/shell.messages';
/** "Gasto em novembro". */
export const spentIn = (month: string): string => `Gasto em ${month}`;
export const LABEL_SEE_PURCHASES = 'Ver compras';
/** "Nenhuma compra em novembro." */
export const noPurchasesIn = (month: string): string => `Nenhuma compra em ${month}.`;

// Comparison seal (RN-02, RN-03). `suffix` is " até o dia N" or "".
export const sealMore = (percent: number, previous: string, suffix: string): string =>
  `${percent}% a mais que ${previous}${suffix}`;
export const sealLess = (percent: number, previous: string, suffix: string): string =>
  `${percent}% a menos que ${previous}${suffix}`;
export const sealEqual = (previous: string, suffix: string): string =>
  `Igual a ${previous}${suffix}`;
export const sealNoBase = (previous: string, suffix: string): string =>
  `Sem compras em ${previous}${suffix} para comparar.`;

// Previous month shorter than the current one (feature 007, RN-04).
/** " (até o dia 31; setembro até o dia 30)". */
export const shorterMonthSuffix = (
  untilDay: number,
  previous: string,
  previousUntilDay: number,
): string => ` (até o dia ${untilDay}; ${previous} até o dia ${previousUntilDay})`;

// Month indicators (feature 007, RN-06, RN-08).
export const KPI_PAID = 'Já pago';
export const KPI_PENDING = 'A pagar';
export const KPI_COUNT = 'Compras';
export const KPI_COUNT_FOOT = 'neste mês';
export const KPI_AVERAGE = 'Média por dia';
/** "0 compras", "1 compra", "3 compras". */
export const purchaseCount = (n: number): string => `${n} ${n === 1 ? 'compra' : 'compras'}`;
/** "em 1 dia", "em 10 dias". */
export const inDays = (n: number): string => `em ${n} ${n === 1 ? 'dia' : 'dias'}`;

// Daily spend (RF-02, ADR-08).
export const DAILY_TITLE = 'Gastos por dia';
export const DAILY_SUBTITLE = 'Passe o mouse sobre a barra para ver o valor';
export const peakDay = (day: number): string => `Pico dia ${day}`;
export const dailyChartLabel = (month: string): string => `Gráfico de gastos por dia de ${month}`;
/** "Dia 2: R$ 100,00", "Dia 25: R$ 1.000,00 (previsto)". */
export const dayValue = (day: number, brl: string, forecast: boolean): string =>
  `Dia ${day}: ${brl}${forecast ? ' (previsto)' : ''}`;

// By category (RF-03, ADR-08).
export const CATEGORY_TITLE = 'Por categoria';
export const CATEGORY_TOP_CAPTION = 'maior gasto';
/** Each part is "<name> <value>". */
export const categoryChartLabel = (parts: readonly string[]): string =>
  `Gastos por categoria: ${parts.join(', ')}`;

// Latest purchases (RF-04).
export const LATEST_TITLE = 'Últimas compras';
export const LATEST_SEE_ALL = 'Ver todas';
/** "02 nov · Pix". */
export const purchaseMeta = (dayMonth: string, payment: string): string =>
  `${dayMonth} · ${payment}`;

// Payment methods (RF-05).
export const PAYMENT_TITLE = 'Formas de pagamento';
