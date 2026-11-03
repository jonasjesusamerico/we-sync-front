import { ANA } from './support/api-mock';
import { expect, fillLogin, test } from './support/fixtures';
import { THEME_KEY } from './support/session';
import * as t from './support/texts';

test.beforeEach(({ api }) => api.addUser(ANA));

test.describe('dark system', () => {
  test.use({ colorScheme: 'dark' });

  test('CA-32', async ({ page }) => {
    await page.route('**/*', (route) => {
      const request = route.request();
      if (request.resourceType() === 'script' && !request.url().endsWith('/theme-init.js')) {
        return route.abort();
      }
      return route.fallback();
    });
    await page.goto('/login');
    await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(background).toBe('rgb(12, 20, 34)');
    await expect(page.locator('ws-root')).toBeEmpty();
  });

  test('CA-33', async ({ page, browser, api }) => {
    await page.goto('/login');
    await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
    await page.getByRole('button', { name: t.LABEL_USE_LIGHT_THEME }).click();
    await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'light');
    await fillLogin(page, ANA.email, ANA.password);
    await page.getByRole('button', { name: t.LABEL_LOGIN_SUBMIT, exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Olá, Ana Souza');
    const state = await page.context().storageState();
    const context = await browser.newContext({ storageState: state, colorScheme: 'dark' });
    await api.attach(context);
    const next = await context.newPage();
    for (const url of ['/inicio', '/login']) {
      await next.goto(url);
      await expect(next.locator('html')).toHaveAttribute('data-bs-theme', 'light');
    }
    expect(await next.evaluate((key) => localStorage.getItem(key), THEME_KEY)).toBe('light');
    await context.close();
  });
});

test.describe('light system', () => {
  test.use({ colorScheme: 'light' });

  test('primeira visita clara', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'light');
  });

  test('rótulo', async ({ page }) => {
    await page.goto('/login');
    const toggle = page.locator('button.ws-auth-theme');
    await expect(toggle).toHaveAttribute('aria-label', t.LABEL_USE_DARK_THEME);
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-label', t.LABEL_USE_LIGHT_THEME);
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-label', t.LABEL_USE_DARK_THEME);
  });

  test('storage bloqueado', async ({ page }) => {
    await page.addInitScript((key) => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (name: string, value: string) {
        if (name === key) {
          throw new DOMException('blocked', 'SecurityError');
        }
        return original.call(this, name, value);
      };
    }, THEME_KEY);
    await page.goto('/login');
    await page.getByRole('button', { name: t.LABEL_USE_DARK_THEME }).click();
    await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'light');
  });
});
