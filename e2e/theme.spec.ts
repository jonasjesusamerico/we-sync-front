import { expect, Locator, Page, test } from '@playwright/test';

import { contrastRatio } from './support/contrast';
import { seedSession } from './support/session';
import { HOME_TITLE, LABEL_HOME, LABEL_LOGIN, LABEL_MAIN_NAV } from './support/texts';

// Cores do tema ArchitectUI (free), conferidas no CSS do demo publicado.
const PRIMARY = 'rgb(3, 60, 115)';
const WHITE = 'rgb(255, 255, 255)';
const HEADER_BACKGROUND = 'rgb(250, 251, 252)';
const CONTENT_BACKGROUND = 'rgb(241, 244, 246)';
const NAV_ACTIVE_BACKGROUND = 'rgb(209, 243, 255)';
const BODY_TEXT = 'rgb(73, 80, 87)';

test.use({ viewport: { width: 1280, height: 800 } });

const css = (locator: Locator, property: string) =>
  locator.evaluate((el, prop) => getComputedStyle(el).getPropertyValue(prop), property);

async function openHome(page: Page) {
  await seedSession(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: HOME_TITLE })).toBeVisible();
}

test.describe('tema', () => {
  test('fórmula de contraste', () => {
    expect(Math.abs(contrastRatio('rgb(255, 255, 255)', 'rgb(0, 0, 0)') - 21)).toBeLessThan(0.01);
  });

  test('topo claro com sombra', async ({ page }) => {
    await openHome(page);
    const header = page.locator('header.app-header');
    expect(await css(header, 'background-color')).toBe(HEADER_BACKGROUND);
    expect(await css(header, 'box-shadow')).not.toBe('none');
    expect(await css(page.locator('body'), 'color')).toBe(BODY_TEXT);
  });

  test('item ativo', async ({ page }) => {
    await openHome(page);
    const link = page
      .getByRole('navigation', { name: LABEL_MAIN_NAV })
      .getByRole('link', { name: LABEL_HOME });
    const text = await css(link, 'color');
    const background = await css(link, 'background-color');

    expect(text).toBe(PRIMARY);
    expect(background).toBe(NAV_ACTIVE_BACKGROUND);
    expect(contrastRatio(text, background)).toBeGreaterThanOrEqual(4.5);
  });

  test('fundo e cartões', async ({ page }) => {
    await openHome(page);
    expect(await css(page.locator('.app-container'), 'background-color')).toBe(CONTENT_BACKGROUND);
    expect(await css(page.locator('.app-sidebar-content'), 'background-color')).toBe(WHITE);
    expect(await css(page.locator('app-home-page > .card'), 'background-color')).toBe(WHITE);
  });

  test('botão principal do login', async ({ page }) => {
    await page.goto('/login');
    const button = page.getByRole('button', { name: LABEL_LOGIN });
    const background = await css(button, 'background-color');
    const color = await css(button, 'color');

    expect(background).toBe(PRIMARY);
    expect(color).toBe(WHITE);
    expect(contrastRatio(color, background)).toBeGreaterThanOrEqual(4.5);
  });

  test('login sobre o degradê', async ({ page }) => {
    await page.goto('/login');
    expect(await css(page.locator('app-auth-layout'), 'background-image')).toContain(
      'linear-gradient',
    );
    expect(await css(page.locator('app-auth-layout .card'), 'background-color')).toBe(WHITE);
  });
});
