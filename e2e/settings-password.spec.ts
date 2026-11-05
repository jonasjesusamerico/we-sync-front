import type { Page } from '@playwright/test';
import { expect, fillLogin, openUserMenu, test } from './support/fixtures';
import { JONAS, openSettings } from './support/settings';
import { readSession, seedSession } from './support/session';
import * as t from './support/texts';

const s = t.settings;
const NEW_PASSWORD = 'Nova-senha-2026';

async function changePassword(page: Page, current: string, next: string) {
  await page.locator('#acc-pass').fill(current);
  await page.locator('#acc-new').fill(next);
  await page.getByRole('button', { name: s.PASSWORD_TITLE, exact: true }).click();
}

async function login(page: Page, password: string) {
  await page.goto('/login');
  await fillLogin(page, JONAS.email, password);
  await page.getByRole('button', { name: t.LABEL_LOGIN_SUBMIT, exact: true }).click();
}

test('CA-06: troca certa, continua conectado e só a nova entra', async ({ page, api }) => {
  await openSettings(page, api, JONAS);
  const before = await readSession(page);
  await changePassword(page, JONAS.password, NEW_PASSWORD);
  await expect(page.locator('.ws-toast')).toContainText(s.TOAST_PASSWORD_CHANGED);
  await expect(page.locator('#acc-pass')).toHaveValue('');
  await expect(page.locator('#acc-new')).toHaveValue('');
  const after = await readSession(page);
  expect(after).not.toBeNull();
  expect(after!.access_token).not.toBe(before!.access_token);

  // Still signed in with the new pair.
  await page.locator('#ws-sidebar').getByRole('link', { name: 'Compras' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Compras');
  await expect(page.locator('#rows, .ws-empty').first()).toBeAttached();

  await openUserMenu(page);
  await page.getByRole('menuitem', { name: t.LABEL_LOGOUT }).click();
  await expect(page).toHaveURL(/\/login/);
  await login(page, JONAS.password);
  await expect(page.locator('.alert')).toContainText(t.MSG_INVALID_CREDENTIALS);
  await login(page, NEW_PASSWORD);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Olá, Jonas');
});

test('CA-07: o outro navegador sai na próxima ação', async ({ page, api, browser }) => {
  await openSettings(page, api, JONAS);
  const other = await browser.newContext();
  await api.attach(other);
  const second = await other.newPage();
  await seedSession(second, api.issueSession(JONAS.email));
  await second.goto('/inicio');
  await expect(second.getByRole('heading', { level: 1 })).toHaveText('Olá, Jonas');

  await changePassword(page, JONAS.password, NEW_PASSWORD);
  await expect(page.locator('.ws-toast')).toContainText(s.TOAST_PASSWORD_CHANGED);

  await second.locator('#ws-sidebar').getByRole('link', { name: 'Compras' }).click();
  await expect(second).toHaveURL(/\/login/);
  await expect(second.locator('.alert')).toContainText(t.MSG_SESSION_EXPIRED);
  await other.close();

  // This browser goes on.
  await page.reload();
  await expect(page.locator('#acc-name')).toHaveValue('Jonas');
});

test('CA-08: senha atual errada e nova igual à atual', async ({ page, api }) => {
  await openSettings(page, api, JONAS);
  await changePassword(page, 'errada-123', NEW_PASSWORD);
  await expect(page.locator('#acc-pass-error')).toHaveText(s.ERR_CURRENT_WRONG);
  await expect(page.locator('#acc-pass')).toHaveValue('');
  await expect(page.locator('#acc-pass')).toBeFocused();
  await expect(page.locator('#acc-new')).toHaveValue(NEW_PASSWORD);
  expect(api.userOf(JONAS.email)!.password).toBe(JONAS.password);

  await changePassword(page, JONAS.password, JONAS.password);
  await expect(page.locator('#acc-new-error')).toHaveText(s.ERR_NEW_SAME);
  expect(api.calls('/users/me/password')).toBe(1);
});

test('CA-06 trocar senha @double-submit', async ({ page, api }) => {
  await openSettings(page, api, JONAS);
  await page.locator('#acc-pass').fill(JONAS.password);
  await page.locator('#acc-new').fill(NEW_PASSWORD);
  api.delay('/users/me/password', 1000);
  const save = page.getByRole('button', { name: s.PASSWORD_TITLE, exact: true });
  await save.dblclick();
  await page.locator('#acc-new').press('Enter');
  await expect(save).toBeDisabled();
  await expect(page.locator('.ws-toast')).toContainText(s.TOAST_PASSWORD_CHANGED, {
    timeout: 5000,
  });
  expect(api.calls('/users/me/password')).toBe(1);
});
