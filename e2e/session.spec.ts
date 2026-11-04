import type { Page } from '@playwright/test';
import { ANA } from './support/api-mock';
import { expect, fillLogin, HOME_URL, loginAs, openUserMenu, test } from './support/fixtures';
import { readSession, seedSession } from './support/session';
import * as t from './support/texts';

test.beforeEach(({ api }) => api.addUser(ANA));

const heading = (page: Page) => page.getByRole('heading', { level: 1 });

async function logout(page: Page) {
  await openUserMenu(page);
  await page.getByRole('menuitem', { name: t.LABEL_LOGOUT }).click();
}

test('CA-15', async ({ page, browser, api }) => {
  await loginAs(page);
  const state = await page.context().storageState();
  await page.context().close();
  const context = await browser.newContext({ storageState: state });
  await api.attach(context);
  const next = await context.newPage();
  await next.goto('/inicio');
  await expect(heading(next)).toHaveText('Olá, Ana Souza');
  await expect(next).toHaveURL(HOME_URL);
  await context.close();
});

test('CA-16', async ({ page, api }) => {
  await seedSession(page, api.issueSession(ANA.email));
  api.expireAccessTokens();
  await page.goto('/inicio');
  await expect(heading(page)).toHaveText('Olá, Ana Souza');
  expect(api.calls('/auth/refresh')).toBe(1);
  expect(api.calls('/users/me')).toBe(2);
  await expect(page.locator('.alert')).toHaveCount(0);
});

test('CA-17', async ({ page, context, api }) => {
  await seedSession(page, api.issueSession(ANA.email));
  await page.goto('/inicio');
  const other = await context.newPage();
  await other.goto('/inicio');
  await expect(heading(page)).toHaveText('Olá, Ana Souza');
  await expect(heading(other)).toHaveText('Olá, Ana Souza');
  api.expireAccessTokens();
  api.delay('/auth/refresh', 300);
  await Promise.all([page.reload(), other.reload()]);
  await expect(heading(page)).toHaveText('Olá, Ana Souza');
  await expect(heading(other)).toHaveText('Olá, Ana Souza');
  expect(api.calls('/auth/refresh')).toBe(1);
  await expect(page).toHaveURL(HOME_URL);
  await expect(other).toHaveURL(HOME_URL);
});

async function expireAndOpen(page: Page, api: import('./support/api-mock').ApiMock) {
  await seedSession(page, api.issueSession(ANA.email));
  api.expireAccessTokens();
  api.revokeRefreshTokens();
  await page.goto('/inicio');
  await expect(page).toHaveURL('/login?returnUrl=%2Finicio');
  await expect(page.getByRole('status')).toHaveText(t.MSG_SESSION_EXPIRED);
}

test('CA-18', async ({ page, api }) => {
  await expireAndOpen(page, api);
  expect(await readSession(page)).toBeNull();
  await fillLogin(page, ANA.email, ANA.password);
  await page.getByRole('button', { name: t.LABEL_LOGIN_SUBMIT, exact: true }).click();
  await expect(page).toHaveURL(HOME_URL);
  await expect(heading(page)).toHaveText('Olá, Ana Souza');
});

test('aviso não volta ao recarregar', async ({ page, api }) => {
  await expireAndOpen(page, api);
  await page.reload();
  await expect(heading(page)).toHaveText(t.LOGIN_TITLE);
  await expect(page.locator('.alert')).toHaveCount(0);
});

test('CA-22', async ({ page, api }) => {
  await loginAs(page);
  // One more history entry inside the app, so that "back" lands on a protected page.
  await page.goto('/inicio?aba=1');
  await expect(heading(page)).toHaveText('Olá, Ana Souza');
  const refresh = (await readSession(page))!.refresh_token;
  await logout(page);
  await expect(page).toHaveURL('/login');
  await expect.poll(() => api.calls('/auth/logout')).toBe(1);
  const request = api.requests('/auth/logout')[0];
  expect(request.body).toEqual({ refresh_token: refresh });
  expect(request.headers['authorization']).toBeUndefined();
  expect(await readSession(page)).toBeNull();
  await page.goBack();
  await expect(page).toHaveURL(/\/login/);
  await expect(heading(page)).toHaveText(t.LOGIN_TITLE);
});

test('CA-23', async ({ page, api }) => {
  api.fail('/auth/logout', 'abort');
  await loginAs(page);
  await logout(page);
  await expect(page).toHaveURL('/login');
  await expect(heading(page)).toHaveText(t.LOGIN_TITLE);
  await expect(page.locator('.alert')).toHaveCount(0);
});

test('CA-24', async ({ page, context }) => {
  await loginAs(page);
  const other = await context.newPage();
  await other.goto('/inicio');
  await expect(heading(other)).toHaveText('Olá, Ana Souza');
  await logout(page);
  await expect(other).toHaveURL('/login', { timeout: 5_000 });
});

test('entrar numa aba', async ({ page, context }) => {
  await page.goto('/login');
  const other = await context.newPage();
  await other.goto('/login');
  await fillLogin(page, ANA.email, ANA.password);
  await page.getByRole('button', { name: t.LABEL_LOGIN_SUBMIT, exact: true }).click();
  await expect(heading(page)).toHaveText('Olá, Ana Souza');
  await expect(other).toHaveURL(HOME_URL, { timeout: 5_000 });
});

test('CA-35', async ({ page, api }) => {
  api.addUser({ id: 7, name: 'jonas.silva', email: 'jonas.silva@exemplo.com', password: 'x' });
  await seedSession(page, api.issueSession('jonas.silva@exemplo.com'));
  await page.goto('/inicio');
  await expect(heading(page)).toHaveText('Olá, jonas.silva');
  await expect(page.locator('.ws-avatar')).toHaveText('J');
});

for (const failure of [500, 'abort'] as const) {
  test(`CA-37 ${failure}`, async ({ page, api }) => {
    await seedSession(page, api.issueSession(ANA.email));
    api.fail('/users/me', failure);
    await page.goto('/inicio');
    await expect(heading(page)).toHaveText(t.GREETING_FALLBACK);
    await expect(page.locator('#ws-sidebar')).toBeVisible();
    await expect(page.locator('.ws-avatar')).toHaveText('');
    await expect(page.locator('.ws-avatar ws-icon')).toHaveCount(1);
    await openUserMenu(page);
    await expect(page.locator('.ws-user-menu .dropdown-menu')).toContainText(
      t.MSG_USER_UNAVAILABLE,
    );
    await page.getByRole('menuitem', { name: t.LABEL_LOGOUT }).click();
    await expect(page).toHaveURL('/login');
  });
}

test('Bearer só na API', async ({ page, api }) => {
  await seedSession(page, api.issueSession(ANA.email));
  api.expireAccessTokens();
  await page.goto('/inicio');
  await expect(heading(page)).toHaveText('Olá, Ana Souza');
  for (const request of api.requests('/users/me')) {
    expect(request.headers['authorization']).toMatch(/^Bearer access-/);
  }
  expect(api.requests('/auth/refresh')[0].headers['authorization']).toBeUndefined();
});
