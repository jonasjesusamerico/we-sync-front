// Chart geometry of the home blocks (ADR-06 of feature 007). Pure functions: every amount comes from the API
// (RN-15); the front only turns it into heights, angles and labels.
import { catalogStyle } from '../../core/catalog/catalog-style';
import { apiToCents, formatBrl } from '../../shared/money/money';
import type { MonthOverview } from '../purchases/data/purchase.models';
import { categoryChartLabel, dayValue } from './home.messages';

/** One bar of "Gastos por dia" (dailyBars of dashboard.html). */
export interface BarView {
  day: number;
  /** % of the chart height: amount > 0 → max(4, round(amount ÷ max × 100)); amount = 0 → 2 (prototype). */
  height: number;
  /** day === peak_day (D-04 of the DAS, RP-07): one bar only, even on a tie. */
  peak: boolean;
  /** forecast && amount > 0 (ADR-08, D-07). */
  forecast: boolean;
  /** amount === "0". */
  empty: boolean;
  /** Tooltip and hidden list item: "Dia 25: R$ 1.000,00 (previsto)". */
  label: string;
}

export function dailyBars(o: MonthOverview): BarView[] {
  const cents = o.daily.map((d) => apiToCents(d.amount));
  const max = Math.max(0, ...cents);
  return o.daily.map((d, i) => {
    const value = cents[i];
    const empty = value === 0;
    const forecast = d.forecast && !empty;
    return {
      day: d.day,
      height: empty ? 2 : Math.max(4, Math.round((value * 100) / max)),
      peak: d.day === o.peak_day,
      forecast,
      empty,
      label: dayValue(d.day, formatBrl(value), forecast),
    };
  });
}

/** Axis of the daily chart: 1, 8, 15, 22 and the last day of the month (D-03 of the DAS). */
export function axisTicks(daysInMonth: number): number[] {
  return [1, 8, 15, 22, daysInMonth];
}

/** conic-gradient over the cents of each category (not the rounded percents), stops with 2 decimals. */
export function donutBackground(o: MonthOverview): string {
  const total = apiToCents(o.spent);
  let acc = 0;
  const stops = o.categories.map((c) => {
    const from = ((acc * 100) / total).toFixed(2);
    acc += apiToCents(c.amount);
    const to = ((acc * 100) / total).toFixed(2);
    return `${catalogStyle(c.category).color} ${from}% ${to}%`;
  });
  return `conic-gradient(${stops.join(', ')})`;
}

/** Accessible name of the donut: "Gastos por categoria: Moradia R$ 1.000,00, …" (ADR-08). */
export function donutLabel(o: MonthOverview): string {
  return categoryChartLabel(
    o.categories.map((c) => `${c.category.name} ${formatBrl(apiToCents(c.amount))}`),
  );
}
