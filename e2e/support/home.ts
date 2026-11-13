// Data and helpers of the home e2e tests (feature 007).
import type { Page } from '@playwright/test';
import { ANA, type ApiMock, type MockStatus } from './api-mock';
import { fixedToday } from './purchases';
import { seedSession } from './session';

/** The table of the CAs: [date, description, categoryId, paymentMethodId, status, cents], in this order. */
export const CA_TABLE: readonly [string, string, number, number, MockStatus, number][] = [
  ['2026-11-02', 'Mercado', 1, 4, 'PAID', 10000],
  ['2026-11-05', 'Uber', 2, 2, 'PAID', 4000],
  ['2026-11-05', 'Padaria', 1, 4, 'PAID', 6000],
  ['2026-11-08', 'Cinema', 6, 2, 'CANCELED', 3000],
  ['2026-11-25', 'Aluguel', 3, 6, 'PENDING', 100000],
];

export function addHomePurchase(
  api: ApiMock,
  date: string,
  cents: number,
  status: MockStatus = 'PAID',
  extra: { description?: string; categoryId?: number; paymentMethodId?: number } = {},
): number {
  return api.addPurchase(ANA.email, {
    date,
    description: extra.description ?? `Compra ${date}`,
    categoryId: extra.categoryId ?? 1,
    paymentMethodId: extra.paymentMethodId ?? 4,
    cents,
    status,
  });
}

export function seedTable(api: ApiMock): void {
  for (const [date, description, categoryId, paymentMethodId, status, cents] of CA_TABLE) {
    addHomePurchase(api, date, cents, status, { description, categoryId, paymentMethodId });
  }
}

/** Ana with a session; "today" is 10/11/2026 unless given. Call before page.goto. */
export async function loginHome(page: Page, api: ApiMock, today?: Date): Promise<void> {
  api.addUser(ANA);
  await fixedToday(page, today);
  await seedSession(page, api.issueSession(ANA.email));
}

/** Waits for the card and the month blocks of the home page. */
export async function openHome(page: Page, query = 'ano=2026&mes=11'): Promise<void> {
  await page.goto(`/inicio?${query}`);
  await page.locator('#kpi-total').waitFor();
  await page.locator('#kpi-paid').waitFor();
}
