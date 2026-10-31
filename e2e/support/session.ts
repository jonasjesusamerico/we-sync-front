import { Page } from '@playwright/test';

export const SESSION_KEY = 'we-sync.session';

/**
 * Abre `/login` e grava uma sessão no `localStorage`. Não usa `addInitScript`, que regravaria a sessão a cada
 * carga, inclusive depois de Sair.
 */
export async function seedSession(
  page: Page,
  session: { access_token: string; refresh_token: string } = {
    access_token: 'A1',
    refresh_token: 'R1',
  },
): Promise<void> {
  await page.goto('/login');
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [
    SESSION_KEY,
    JSON.stringify(session),
  ] as const);
}

export function readSession(page: Page): Promise<string | null> {
  return page.evaluate((key) => localStorage.getItem(key), SESSION_KEY);
}
