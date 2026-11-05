import type { BrowserContext, Page } from '@playwright/test';

export const SESSION_KEY = 'we-sync.session';
export const THEME_KEY = 'we-sync.theme';

/** Opens /login and writes the session (no addInitScript, so it is not written again after logout). */
export async function seedSession(
  page: Page,
  session: { access_token: string; refresh_token: string },
): Promise<void> {
  await page.goto('/login');
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [
    SESSION_KEY,
    JSON.stringify(session),
  ] as const);
}

export async function readSession(
  page: Page,
): Promise<{ access_token: string; refresh_token: string } | null> {
  const raw = await page.evaluate((key) => localStorage.getItem(key), SESSION_KEY);
  return raw === null ? null : JSON.parse(raw);
}

export async function seedTheme(context: BrowserContext, theme: 'light' | 'dark'): Promise<void> {
  await context.addInitScript(([key, value]) => localStorage.setItem(key, value), [
    THEME_KEY,
    theme,
  ] as const);
}
