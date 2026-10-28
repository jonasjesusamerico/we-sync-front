import { expect, Page, test } from '@playwright/test';

import { CONTRACT, mockApi } from './support/api-mock';
import { seedSession } from './support/session';
import {
  APP_NAME,
  HOME_TITLE,
  LABEL_ACCOUNT,
  LABEL_HOME,
  LABEL_MAIN_NAV,
  LABEL_OPEN_MENU,
} from './support/texts';

test.use({ timezoneId: 'America/Sao_Paulo', locale: 'pt-BR' });

const nav = (page: Page) => page.getByRole('navigation', { name: LABEL_MAIN_NAV });
const menuButton = (page: Page) => page.getByRole('button', { name: LABEL_OPEN_MENU });
const backdrop = (page: Page) => page.locator('.mat-drawer-backdrop.mat-drawer-shown');

async function openHome(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await mockApi(page, { logout: CONTRACT.loggedOut });
  await seedSession(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: HOME_TITLE })).toBeVisible();
}

test.describe('layout', () => {
  test('CA-01 Início no desktop', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-21T12:00:00-03:00'));
    await openHome(page, 1280, 800);

    const toolbar = page.locator('mat-toolbar');
    await expect(toolbar.locator('app-brand .name')).toHaveText(APP_NAME);
    await expect(toolbar.getByRole('button', { name: LABEL_ACCOUNT })).toBeVisible();
    await expect(menuButton(page)).toHaveCount(0);
    await expect(nav(page)).toBeVisible();
    await expect(nav(page).getByRole('link', { name: LABEL_HOME })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('heading', { level: 1, name: LABEL_HOME })).toBeVisible();
    await expect(page.getByText('21/10/2026, quarta-feira')).toBeVisible();
    await expect(page.getByRole('heading', { name: HOME_TITLE })).toBeVisible();
  });

  test('um item no menu', async ({ page }) => {
    await openHome(page, 1280, 800);
    await expect(nav(page).getByRole('link')).toHaveCount(1);
  });

  test('CA-03 ☰ abre e o item fecha', async ({ page }) => {
    await openHome(page, 360, 640);
    await expect(nav(page)).toBeHidden();

    await menuButton(page).click();
    await expect(nav(page)).toBeVisible();
    await expect(backdrop(page)).toBeVisible();

    await nav(page).getByRole('link', { name: LABEL_HOME }).click();
    await expect(nav(page)).toBeHidden();
  });

  test('CA-03 fundo fecha', async ({ page }) => {
    await openHome(page, 360, 640);
    await menuButton(page).click();
    await expect(backdrop(page)).toBeVisible();

    await page.mouse.click(320, 300);
    await expect(nav(page)).toBeHidden();
  });

  test('CA-03 Esc fecha', async ({ page }) => {
    await openHome(page, 360, 640);
    await menuButton(page).click();
    await expect(nav(page)).toBeVisible();
    // O `Esc` é ouvido pelo drawer: espera o foco entrar nele (fim da abertura), como faz quem usa o teclado.
    await expect(nav(page).getByRole('link', { name: LABEL_HOME })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(nav(page)).toBeHidden();
    await expect(menuButton(page)).toBeFocused();
  });

  test('CA-05 menu por cima vira fixo', async ({ page }) => {
    await openHome(page, 800, 800);
    await menuButton(page).click();
    await expect(backdrop(page)).toBeVisible();
    await page.evaluate(() => ((window as unknown as { __marca: number }).__marca = 1));

    await page.setViewportSize({ width: 1280, height: 800 });

    await expect(nav(page)).toBeVisible();
    await expect(backdrop(page)).toHaveCount(0);
    await expect(menuButton(page)).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __marca?: number }).__marca)).toBe(1);
  });

  test('Esc não fecha o menu fixo', async ({ page }) => {
    await openHome(page, 1280, 800);
    await nav(page).getByRole('link', { name: LABEL_HOME }).focus();

    await page.keyboard.press('Escape');
    await expect(nav(page)).toBeVisible();
  });

  test('959 e 960 px', async ({ page }) => {
    await openHome(page, 959, 800);
    await expect(menuButton(page)).toBeVisible();

    await page.setViewportSize({ width: 960, height: 800 });
    await expect(menuButton(page)).toHaveCount(0);
    await expect(nav(page)).toBeVisible();
  });

  test('cabeçalho no celular', async ({ page }) => {
    await openHome(page, 360, 640);
    const titleBox = await page.locator('app-page-header h1').boundingBox();
    const timeBox = await page.locator('app-page-header time').boundingBox();
    expect(timeBox!.y).toBeGreaterThan(titleBox!.y);
  });
});
