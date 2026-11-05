import type { Page } from '@playwright/test';
import { expect, openUserMenu, test } from './support/fixtures';
import { JONAS, openSettings, SETTINGS_URL } from './support/settings';
import { seedSession } from './support/session';
import * as t from './support/texts';

const s = t.settings;

async function openHome(page: Page, api: Parameters<typeof openSettings>[1]) {
  api.addUser(JONAS);
  await seedSession(page, api.issueSession(JONAS.email));
  await page.goto('/inicio');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Olá, Jonas');
}

test.describe('CA-01: os quatro caminhos abrem Conta', () => {
  test('menu lateral a 1280 px', async ({ page, api }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openHome(page, api);
    const link = page.locator('#ws-sidebar').getByRole('link', { name: 'Configurações' });
    await expect(link).not.toContainText(t.SOON_TAG);
    await link.click();
    await expect(page).toHaveURL(SETTINGS_URL);
    await expect(link).toHaveAttribute('aria-current', 'page');
    await expect(page).toHaveTitle(s.TITLE_SETTINGS);
  });

  test('"Ajustes" a 360 px', async ({ page, api }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await openHome(page, api);
    const link = page.locator('#ws-bottomnav').getByRole('link', { name: 'Ajustes' });
    await link.click();
    await expect(page).toHaveURL(SETTINGS_URL);
    await expect(link).toHaveAttribute('aria-current', 'page');
  });

  test('"Meu perfil" do menu da conta', async ({ page, api }) => {
    await openHome(page, api);
    await openUserMenu(page);
    await page.getByRole('menuitem', { name: t.LABEL_MY_PROFILE }).click();
    await expect(page).toHaveURL(SETTINGS_URL);
    await expect(page.locator('.ws-user-menu .dropdown-menu')).not.toHaveClass(/show/);
  });

  test('"Configurações" do menu da conta, pelo teclado', async ({ page, api }) => {
    await openHome(page, api);
    await page.getByRole('button', { name: t.LABEL_ACCOUNT_MENU }).press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: t.LABEL_SETTINGS })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(SETTINGS_URL);
  });
});

test('CA-01: Rendas e Orçamento em breve não navegam', async ({ page, api }) => {
  await openSettings(page, api, JONAS, '/configuracoes/categorias');
  const nav = page.getByRole('navigation', { name: s.LABEL_SECTIONS });
  for (const name of ['Rendas em breve', 'Orçamento em breve']) {
    const item = nav.getByRole('button', { name });
    await expect(item).toHaveAttribute('aria-disabled', 'true');
    await item.click({ force: true });
    await item.press('Enter');
    await expect(page).toHaveURL('/configuracoes/categorias');
  }
});

test('CA-02: seção desconhecida vai para Conta', async ({ page, api }) => {
  await openSettings(page, api, JONAS, '/configuracoes/rendas');
  await expect(page).toHaveURL(SETTINGS_URL);
  await page.goto('/configuracoes/abc');
  await expect(page).toHaveURL(SETTINGS_URL);
  await page.goto('/configuracoes');
  await expect(page).toHaveURL(SETTINGS_URL);
  await expect(
    page.getByRole('navigation', { name: s.LABEL_SECTIONS }).locator('[aria-current="page"]'),
  ).toHaveText(s.SECTION_LABELS.conta);
});

test('CA-03: e-mail só leitura, sem mês financeiro nem tour', async ({ page, api }) => {
  await openSettings(page, api, JONAS);
  const email = page.locator('#acc-email');
  await expect(email).toHaveValue(JONAS.email);
  await expect(email).toHaveAttribute('readonly', '');
  await expect(page.locator('#acc-email-hint')).toHaveText(s.EMAIL_HINT);
  await expect(page.locator('#acc-start')).toHaveCount(0);
  await expect(page.locator('#tours-reset')).toHaveCount(0);
  await expect(page.locator('#tab-conta h2')).toHaveText([
    s.PROFILE_TITLE,
    s.PASSWORD_TITLE,
    s.PREFERENCES_TITLE,
    s.DELETE_TITLE,
  ]);
});

test('CA-04: trocar o nome muda o avatar sem recarregar', async ({ page, api }) => {
  await openSettings(page, api, JONAS);
  const avatar = page.locator('#ws-user-btn .ws-avatar');
  await expect(avatar).toHaveText('J');
  await expect(page.locator('#acc-name')).toHaveValue('Jonas');
  await page.locator('#acc-name').fill('Jonas Silva');
  await page.getByRole('button', { name: s.SAVE_PROFILE }).click();
  await expect(page.locator('.ws-toast')).toContainText(s.TOAST_PROFILE_SAVED);
  await expect(avatar).toHaveText('JS');
  await expect(page.locator('#ws-user-btn .ws-user-name')).toHaveText('Jonas Silva');
  expect(api.userOf(JONAS.email)!.name).toBe('Jonas Silva');
  expect(api.requests('/users/me').length).toBe(1);
});

test('CA-04: nome inválido não envia', async ({ page, api }) => {
  await openSettings(page, api, JONAS);
  const name = page.locator('#acc-name');
  for (const [value, message] of [
    ['A', s.ERR_NAME_LENGTH],
    ['   ', s.ERR_NAME_REQUIRED],
  ]) {
    await name.fill(value);
    await page.getByRole('button', { name: s.SAVE_PROFILE }).click();
    await expect(page.locator('#acc-name-error')).toHaveText(message);
    await expect(name).toBeFocused();
  }
  expect(api.calls('/users/me/profile')).toBe(0);
});

test('CA-04 salvar perfil @double-submit', async ({ page, api }) => {
  await openSettings(page, api, JONAS);
  await page.locator('#acc-name').fill('Jonas Silva');
  api.delay('/users/me/profile', 1000);
  const save = page.getByRole('button', { name: s.SAVE_PROFILE });
  await save.dblclick();
  await page.locator('#acc-name').press('Enter');
  await expect(save).toBeDisabled();
  await expect(page.locator('.ws-toast')).toContainText(s.TOAST_PROFILE_SAVED, { timeout: 5000 });
  expect(api.calls('/users/me/profile')).toBe(1);
});
