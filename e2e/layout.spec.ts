import type { Page } from '@playwright/test';
import { ANA, type ApiMock, type MockUser } from './support/api-mock';
import { expect, HOME_URL, openUserMenu, test } from './support/fixtures';
import { expectNoHorizontalScroll } from './support/layout';
import { seedSession } from './support/session';
import * as t from './support/texts';

async function openHome(page: Page, api: ApiMock, user: MockUser = ANA) {
  api.addUser(user);
  await seedSession(page, api.issueSession(user.email));
  await page.goto('/inicio');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Olá, ${user.name}`);
}

test('CA-26', async ({ page, api }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openHome(page, api);
  const sidebar = page.locator('#ws-sidebar');
  await expect(sidebar).toBeVisible();
  await expect(sidebar.locator('.ws-nav-title')).toHaveText([
    'Menu',
    'Planejamento',
    'Administração',
  ]);
  await expect(sidebar.locator('.ws-nav-link')).toHaveCount(6);
  const home = sidebar.getByRole('link', { name: 'Início' });
  await expect(home).toHaveAttribute('aria-current', 'page');
  await expect(sidebar.getByRole('link', { name: 'Compras' })).toHaveAttribute('href', '/compras');
  // Feature 006: Configurações navigates; Nossa casa, Metas e relatórios and Investimentos stay "em breve".
  await expect(sidebar.locator('button.ws-nav-link .ws-badge-soon')).toHaveText(
    Array(3).fill(t.SOON_TAG),
  );
  await expect(sidebar.getByRole('link', { name: 'Configurações' })).toHaveAttribute(
    'href',
    '/configuracoes',
  );
  await expect(
    sidebar.locator('.ws-sidebar-card').getByRole('link', { name: 'Nova compra' }),
  ).toHaveAttribute('href', '/compras/nova');
  await expect(sidebar.locator('.ws-sidebar-card strong')).toHaveText(t.SIDEBAR_CARD_TITLE);
  const topbar = page.locator('#ws-topbar');
  await expect(topbar.getByRole('link', { name: 'Nova compra' })).toHaveAttribute(
    'href',
    '/compras/nova',
  );
  await expect(topbar.getByRole('button', { name: t.LABEL_USE_DARK_THEME })).toBeVisible();
  await expect(topbar.getByRole('button', { name: 'Notificações, em breve' })).toBeVisible();
  await expect(topbar.locator('.ws-avatar')).toHaveText('AS');
  await expect(topbar.locator('.ws-user-name')).toBeVisible();
  await expect(topbar.locator('.ws-user-name')).toHaveText('Ana Souza');
  await expect(page.locator('#ws-bottomnav')).toBeHidden();
});

test('CA-29', async ({ page, api }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openHome(page, api);
  const apiRequests: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/api/')) apiRequests.push(r.url());
  });

  async function tryAll(selector: string, menuOpen = false) {
    const items = page.locator(selector);
    const count = await items.count();
    expect(count, selector).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      await item.click({ force: true });
      await item.press('Enter');
      await item.press(' ');
      await expect(page).toHaveURL(HOME_URL);
      await expect(page.locator('.dropdown-menu.show')).toHaveCount(menuOpen ? 1 : 0);
    }
  }

  await tryAll('#ws-sidebar button.is-soon');
  await tryAll('#ws-topbar > .ws-topbar-actions > button.is-soon');
  // Feature 006: "Meu perfil" and "Configurações" of the account menu navigate (settings-account.spec.ts).
  await openUserMenu(page);
  await expect(page.locator('.ws-user-menu [role=menuitem].is-soon')).toHaveCount(0);
  await page.keyboard.press('Escape');

  await page.setViewportSize({ width: 375, height: 740 });
  await tryAll('#ws-bottomnav button.is-soon');
  expect(apiRequests).toEqual([]);

  await page.evaluate(() => localStorage.clear());
  await page.goto('/login');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(t.LOGIN_TITLE);
  apiRequests.length = 0;
  const forgot = page.getByRole('button', { name: `${t.LABEL_FORGOT_PASSWORD}, em breve` });
  await forgot.click({ force: true });
  await forgot.press('Enter');
  await forgot.press(' ');
  await expect(page).toHaveURL('/login');
  expect(apiRequests).toEqual([]);
});

test('CA-30', async ({ page, api }) => {
  await openHome(page, api);
  const button = page.getByRole('button', { name: t.LABEL_ACCOUNT_MENU });
  const menu = page.locator('.ws-user-menu .dropdown-menu');
  await button.click();
  await expect(menu).toHaveClass(/show/);
  await expect(menu).toContainText('Ana Souza');
  await expect(menu).toContainText('ana@exemplo.com');
  // Feature 006: the two items are links to Conta (RF-02).
  await expect(page.getByRole('menuitem', { name: t.LABEL_MY_PROFILE })).toHaveAttribute(
    'href',
    '/configuracoes/conta',
  );
  await expect(page.getByRole('menuitem', { name: t.LABEL_SETTINGS })).toHaveAttribute(
    'href',
    '/configuracoes',
  );
  await expect(page.locator('.ws-user-menu [aria-disabled="true"]')).toHaveCount(0);
  await expect(page.getByRole('menuitem', { name: t.LABEL_LOGOUT })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: t.LABEL_MY_PROFILE })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).not.toHaveClass(/show/);
  await expect(button).toBeFocused();

  await button.press('ArrowDown');
  await expect(menu).toHaveClass(/show/);
  await expect(page.getByRole('menuitem', { name: t.LABEL_MY_PROFILE })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(button).toBeFocused();
  await button.press('Enter');
  await expect(menu).toHaveClass(/show/);
  await page.keyboard.press('Escape');
  await expect(menu).not.toHaveClass(/show/);
});

test('CA-31', async ({ page, api }) => {
  await openHome(page, api, { id: 1, name: 'Jonas Silva', email: 'js@exemplo.com', password: 'x' });
  await expect(page.locator('.ws-avatar')).toHaveText('JS');
  await page.evaluate(() => localStorage.clear());
  await openHome(page, api, { id: 2, name: 'Jonas', email: 'j@exemplo.com', password: 'x' });
  await expect(page.locator('.ws-avatar')).toHaveText('J');
});

test('nome longo', async ({ page, api }) => {
  const name = 'Maria Aparecida dos Santos Albuquerque de Oliveira Cavalcant';
  expect(Array.from(name)).toHaveLength(60);
  await page.setViewportSize({ width: 1280, height: 800 });
  await openHome(page, api, { id: 3, name, email: 'maria@exemplo.com', password: 'x' });
  await openUserMenu(page);
  for (const selector of ['.ws-user-name', '.ws-user-menu .dropdown-menu .fw-bold']) {
    const overflow = await page.locator(selector).evaluate((el) => ({
      cut: el.scrollWidth > el.clientWidth,
      ellipsis: getComputedStyle(el).textOverflow,
    }));
    expect(overflow, selector).toEqual({ cut: true, ellipsis: 'ellipsis' });
  }
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Olá, ${name}`);
  await expectNoHorizontalScroll(page);
  await page.setViewportSize({ width: 360, height: 740 });
  await expectNoHorizontalScroll(page);
});

test('CA-01 e CA-48: Compras e Nova compra navegam; o resto continua em breve', async ({
  page,
  api,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openHome(page, api);
  const sidebar = page.locator('#ws-sidebar');
  await sidebar.getByRole('link', { name: 'Compras' }).click();
  await expect(page).toHaveURL(/\/compras\?ano=\d+&mes=\d+$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Compras');
  await expect(sidebar.getByRole('link', { name: 'Compras' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await page.locator('#ws-topbar').getByRole('link', { name: 'Nova compra' }).click();
  await expect(page).toHaveURL('/compras/nova');
  await sidebar.getByRole('link', { name: 'Início' }).click();
  await sidebar.locator('.ws-sidebar-card').getByRole('link', { name: 'Nova compra' }).click();
  await expect(page).toHaveURL('/compras/nova');
  // Feature 006: Configurações is a link now (settings-account.spec.ts).
  for (const name of ['Nossa casa', 'Metas e relatórios', 'Investimentos']) {
    await expect(sidebar.getByRole('button', { name: new RegExp(name) })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  }
  await expect(
    page.locator('#ws-topbar').getByRole('button', { name: 'Notificações, em breve' }),
  ).toHaveAttribute('aria-disabled', 'true');

  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/inicio');
  const bottom = page.locator('#ws-bottomnav');
  await bottom.getByRole('link', { name: 'Compras' }).click();
  await expect(page).toHaveURL(/\/compras\?ano=\d+&mes=\d+$/);
  await bottom.getByRole('link', { name: 'Nova compra' }).click();
  await expect(page).toHaveURL('/compras/nova');
  await expect(bottom.getByRole('button', { name: 'Casa, em breve' })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
});
