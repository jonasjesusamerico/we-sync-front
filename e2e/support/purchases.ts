// Purchases data and helpers of the e2e tests (feature 005).
import { expect, type Page } from '@playwright/test';
import type { ApiMock, MockStatus } from './api-mock';

/** PURCHASES of prototype/assets/app.js: [day, description, categoryId, paymentMethodId, cents, status]. */
export const OCTOBER: readonly [number, string, number, number, number, MockStatus][] = [
  [2, 'Aluguel', 3, 6, 145000, 'PAID'],
  [3, 'Supermercado do mês', 1, 3, 38645, 'PAID'],
  [5, 'Combustível', 2, 2, 21000, 'PAID'],
  [7, 'Farmácia', 4, 4, 7490, 'PAID'],
  [8, 'Almoço com a equipe', 1, 4, 5800, 'PAID'],
  [10, 'Curso de inglês', 5, 6, 32000, 'PAID'],
  [12, 'Cinema', 6, 2, 6400, 'PAID'],
  [14, 'Conta de luz', 3, 4, 18237, 'PAID'],
  [15, 'Feira', 1, 1, 9250, 'PAID'],
  [17, 'Corrida de aplicativo', 2, 2, 3870, 'PAID'],
  [19, 'Padaria', 1, 3, 2780, 'PAID'],
  [21, 'Consulta no dentista', 4, 2, 25000, 'PENDING'],
  [23, 'Supermercado', 1, 2, 41230, 'PAID'],
  [25, 'Internet', 3, 6, 11990, 'PENDING'],
  [27, 'Show', 6, 2, 18000, 'CANCELED'],
  [28, 'Livro', 5, 4, 6990, 'PAID'],
  [29, 'Restaurante', 1, 2, 14360, 'PAID'],
  [30, 'Estacionamento', 2, 4, 2500, 'PENDING'],
];

const pad = (n: number, size = 2) => String(n).padStart(size, '0');
export const isoDate = (year: number, month: number, day: number) =>
  `${pad(year, 4)}-${pad(month)}-${pad(day)}`;

/** The 18 purchases of the prototype in the given month (October 2026 by default); returns their ids. */
export function seedOctober(api: ApiMock, email: string, year = 2026, month = 10): number[] {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return OCTOBER.map(([day, description, categoryId, paymentMethodId, cents, status]) =>
    api.addPurchase(email, {
      date: isoDate(year, month, Math.min(day, last)),
      description,
      categoryId,
      paymentMethodId,
      cents,
      status,
    }),
  );
}

/**
 * "Today" starts at 10/11/2026 (the date of the CAs) and time keeps flowing. Not setFixedTime: a frozen Date.now
 * stops RxJS debounceTime (it compares Date.now) and the search would never navigate. Call before page.goto.
 */
export async function fixedToday(page: Page, date = new Date(2026, 10, 10, 12)): Promise<void> {
  await page.clock.install({ time: date });
}

/** Opens Compras and waits for the list (or its empty state) to load. */
export async function openPurchases(page: Page, query = 'ano=2026&mes=11'): Promise<void> {
  await page.goto(`/compras?${query}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Compras');
  await expect(page.locator('#rows, .ws-empty').first()).toBeAttached();
}

/** "R$ 1.234,56" with the non-breaking space of Intl, as the screen shows it. */
export const brl = (text: string) => text.replace(' ', ' ');
