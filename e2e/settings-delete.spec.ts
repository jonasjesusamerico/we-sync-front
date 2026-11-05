import type { Page } from '@playwright/test';
import { expect, fillLogin, fillRegister, test } from './support/fixtures';
import { seedOctober } from './support/purchases';
import { JONAS, openDialog, openSettings, seedCatalog } from './support/settings';
import * as t from './support/texts';

const s = t.settings;

async function openDelete(page: Page) {
  await page.getByRole('button', { name: s.DELETE_OPEN }).click();
  await expect(openDialog(page)).toBeVisible();
  await expect(page.locator('#delete-pass')).toBeFocused();
}

test('CA-13: senha errada, Cancelar e Esc não apagam nada', async ({ page, api }) => {
  await openSettings(page, api, JONAS);
  await openDelete(page);
  await page.locator('#delete-pass').fill('errada-123');
  await openDialog(page).getByRole('button', { name: s.DELETE_CONFIRM }).click();
  await expect(page.locator('#delete-pass-error')).toHaveText(s.ERR_PASSWORD_WRONG);
  await expect(page.locator('#delete-pass')).toHaveValue('');
  await expect(openDialog(page)).toBeVisible();
  expect(api.userOf(JONAS.email)).toBeDefined();

  await openDialog(page).getByRole('button', { name: s.CANCEL }).click();
  await expect(openDialog(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: s.DELETE_OPEN })).toBeFocused();

  await openDelete(page);
  await page.locator('#delete-pass').fill(JONAS.password);
  await page.keyboard.press('Escape');
  await expect(openDialog(page)).toHaveCount(0);
  expect(api.requests('/users/me').filter((r) => r.method === 'DELETE')).toHaveLength(1);
  expect(api.userOf(JONAS.email)).toBeDefined();
});

test('CA-13: senha vazia não envia', async ({ page, api }) => {
  await openSettings(page, api, JONAS);
  await openDelete(page);
  await openDialog(page).getByRole('button', { name: s.DELETE_CONFIRM }).click();
  await expect(page.locator('#delete-pass-error')).toHaveText(s.ERR_PASSWORD_REQUIRED);
  expect(api.requests('/users/me').filter((r) => r.method === 'DELETE')).toHaveLength(0);
});

test('CA-12 e CA-14: excluir, entrar de novo falha e o e-mail fica livre', async ({
  page,
  api,
  context,
}) => {
  api.addUser(JONAS);
  seedOctober(api, JONAS.email);
  seedCatalog(api, JONAS.email);
  await openSettings(page, api, JONAS);
  const other = await context.newPage();
  await other.goto('/inicio');
  await expect(other.getByRole('heading', { level: 1 })).toHaveText('Olá, Jonas');

  await openDelete(page);
  await page.locator('#delete-pass').fill(JONAS.password);
  await openDialog(page).getByRole('button', { name: s.DELETE_CONFIRM }).click();
  await expect(page).toHaveURL('/login');
  await expect(page.locator('.alert')).toHaveText(t.MSG_ACCOUNT_DELETED);
  await expect(other).toHaveURL(/\/login/);
  expect(api.userOf(JONAS.email)).toBeUndefined();
  expect(api.purchasesOf(JONAS.email)).toHaveLength(0);

  await fillLogin(page, JONAS.email, JONAS.password);
  await page.getByRole('button', { name: t.LABEL_LOGIN_SUBMIT, exact: true }).click();
  await expect(page.locator('.alert')).toContainText(t.MSG_INVALID_CREDENTIALS);

  await page.goto('/cadastro');
  await fillRegister(page, 'Jonas Novo', JONAS.email, 'Outra-senha-1');
  await page.getByRole('button', { name: t.LABEL_REGISTER_SUBMIT, exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Olá, Jonas Novo');
  await page.goto('/compras?ano=2026&mes=10');
  await expect(page.getByText(t.emptyMonth('outubro de 2026'))).toBeVisible();
  await page.goto('/configuracoes/categorias');
  await expect(page.locator('li.ws-tx').first()).toBeVisible();
  await expect(page.locator('.ws-tag.is-primary')).toHaveCount(0);
  await expect(page.locator('details.ws-archived')).toHaveCount(0);
});

test('CA-12 excluir conta @double-submit', async ({ page, api }) => {
  await openSettings(page, api, JONAS);
  await openDelete(page);
  await page.locator('#delete-pass').fill(JONAS.password);
  api.delay('/users/me', 1000);
  const confirm = openDialog(page).getByRole('button', { name: s.DELETE_CONFIRM });
  await confirm.dblclick();
  await page.locator('#delete-pass').press('Enter');
  await expect(page).toHaveURL('/login', { timeout: 5000 });
  expect(api.requests('/users/me').filter((r) => r.method === 'DELETE')).toHaveLength(1);
});
