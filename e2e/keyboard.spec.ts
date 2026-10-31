import { expect, Page, test } from '@playwright/test';

import { CONTRACT, mockApi } from './support/api-mock';
import { focusRingColor } from './support/focus';
import { tab } from './support/layout';
import { seedSession } from './support/session';
import {
  HOME_TITLE,
  LABEL_ACCOUNT,
  LABEL_HOME,
  LABEL_LOGIN,
  LABEL_LOGOUT,
  LABEL_MAIN_NAV,
  LABEL_OPEN_MENU,
  LABEL_REGISTER,
} from './support/texts';

const PRIMARY = 'rgb(3, 60, 115)';

const nav = (page: Page) => page.getByRole('navigation', { name: LABEL_MAIN_NAV });
const homeLink = (page: Page) => nav(page).getByRole('link', { name: LABEL_HOME });

async function openHome(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await mockApi(page, { logout: CONTRACT.loggedOut });
  await seedSession(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: HOME_TITLE })).toBeVisible();
}

test.describe('teclado', () => {
  test('abas pelo teclado', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/login');
    await expect(tab(page, LABEL_LOGIN)).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(tab(page, LABEL_LOGIN)).toBeFocused();
    expect(await focusRingColor(tab(page, LABEL_LOGIN))).toBe(PRIMARY);

    await page.keyboard.press('ArrowRight');
    await expect(tab(page, LABEL_REGISTER)).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/cadastro');
    await expect(tab(page, LABEL_REGISTER)).toHaveAttribute('aria-selected', 'true');
  });

  test('menu lateral pelo teclado', async ({ page }) => {
    await openHome(page, 360, 640);
    const menuButton = page.getByRole('button', { name: LABEL_OPEN_MENU });

    await page.keyboard.press('Tab');
    await expect(menuButton).toBeFocused();
    expect(await focusRingColor(menuButton)).toBe(PRIMARY);

    await page.keyboard.press('Enter');
    await expect(nav(page)).toBeVisible();
    await expect(homeLink(page)).toBeFocused();
    expect(await focusRingColor(homeLink(page))).not.toBeNull();

    await page.keyboard.press('Escape');
    await expect(nav(page)).toBeHidden();
    await expect(menuButton).toBeFocused();
  });

  test('conta e Sair pelo teclado', async ({ page }) => {
    await openHome(page, 1280, 800);
    const account = page.getByRole('button', { name: LABEL_ACCOUNT });

    await page.keyboard.press('Tab');
    await expect(account).toBeFocused();
    expect(await focusRingColor(account)).toBe(PRIMARY);

    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitem', { name: LABEL_LOGOUT })).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/login');
  });

  test('item do menu fixo com foco', async ({ page }) => {
    await openHome(page, 1280, 800);

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(homeLink(page)).toBeFocused();
    expect(await focusRingColor(homeLink(page))).toBe(PRIMARY);
  });
});
