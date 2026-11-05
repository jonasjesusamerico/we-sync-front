import { expect, fillLogin, test } from './support/fixtures';
import { JONAS, openSettings } from './support/settings';
import { seedTheme, THEME_KEY } from './support/session';
import * as t from './support/texts';

const PREFERENCES = '/users/me/preferences';

test.use({ colorScheme: 'light' });

test('CA-09: o tema da conta vence o do navegador, desde a primeira pintura', async ({
  page,
  api,
}) => {
  api.addUser({ ...JONAS, theme: 'DARK' });
  await page.goto('/login');
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'light');
  await fillLogin(page, JONAS.email, JONAS.password);
  await page.getByRole('button', { name: t.LABEL_LOGIN_SUBMIT, exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Olá, Jonas');
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
  expect(await page.evaluate((key) => localStorage.getItem(key), THEME_KEY)).toBe('dark');

  // Reload with only theme-init.js: the first paint is already dark.
  await page.route('**/*', (route) => {
    const request = route.request();
    if (request.resourceType() === 'script' && !request.url().endsWith('/theme-init.js')) {
      return route.abort();
    }
    return route.fallback();
  });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
  expect(api.calls(PREFERENCES)).toBe(0);
});

test('CA-10: conta sem tema mantém o do navegador e não grava', async ({ page, api, context }) => {
  await seedTheme(context, 'dark');
  await openSettings(page, api, JONAS);
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
  await expect(page.locator('#th-dark')).toBeChecked();
  await page.reload();
  await expect(page.locator('#acc-name')).toHaveValue('Jonas');
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
  expect(api.calls(PREFERENCES)).toBe(0);
});

test('RN-07: trocar em Preferências grava na conta', async ({ page, api }) => {
  await openSettings(page, api, JONAS);
  await expect(page.locator('#th-light')).toBeChecked();
  await page.locator('label[for=th-dark]').click();
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
  await expect.poll(() => api.userOf(JONAS.email)!.theme).toBe('DARK');
  expect(api.requests(PREFERENCES).map((r) => r.body)).toEqual([{ theme: 'DARK' }]);
  // The top button follows the same theme.
  await expect(page.getByRole('button', { name: t.LABEL_USE_LIGHT_THEME })).toBeVisible();
});

test('CA-11: falha ao gravar não desfaz o tema', async ({ page, api }) => {
  await openSettings(page, api, JONAS);
  api.fail(PREFERENCES, 500);
  await page.getByRole('button', { name: t.LABEL_USE_DARK_THEME }).click();
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
  await expect(page.locator('.ws-toast')).toContainText(t.TOAST_THEME_NOT_SAVED);
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
  expect(api.userOf(JONAS.email)!.theme ?? null).toBeNull();
});

test('RN-07: sem sessão, a troca fica só no navegador', async ({ page, api }) => {
  api.addUser(JONAS);
  await page.goto('/login');
  await page.getByRole('button', { name: t.LABEL_USE_DARK_THEME }).click();
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
  expect(await page.evaluate((key) => localStorage.getItem(key), THEME_KEY)).toBe('dark');
  expect(api.calls(PREFERENCES)).toBe(0);
});
