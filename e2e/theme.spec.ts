import { expect, Locator, Page, test } from '@playwright/test';

import { contrastRatio } from './support/contrast';
import { seedSession } from './support/session';
import { HOME_TITLE, LABEL_HOME, LABEL_LOGIN, LABEL_MAIN_NAV } from './support/texts';

const PRIMARY = 'rgb(75, 102, 254)';
const TERTIARY = 'rgb(234, 0, 80)';
const WHITE = 'rgb(255, 255, 255)';
const CONTENT_BACKGROUND = 'rgb(246, 247, 255)';
const NAV_ACTIVE_BACKGROUND = 'rgb(243, 245, 255)';
const NAV_ACTIVE_TEXT = 'rgb(64, 93, 254)';

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

  test('CA-12 topo', async ({ page }) => {
    await openHome(page);
    const toolbar = page.locator('mat-toolbar');
    const background = await css(toolbar, 'background-color');
    const color = await css(toolbar, 'color');

    expect(background).toBe(PRIMARY);
    expect(color).toBe(WHITE);
    expect(contrastRatio(color, background)).toBeGreaterThanOrEqual(4.5);
  });

  test('CA-12 destaque', async ({ page }) => {
    await openHome(page);
    const [background, color] = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.backgroundColor = 'var(--mat-sys-tertiary)';
      probe.style.color = 'var(--mat-sys-on-tertiary)';
      document.body.append(probe);
      const style = getComputedStyle(probe);
      const result = [style.backgroundColor, style.color];
      probe.remove();
      return result;
    });

    expect(background).toBe(TERTIARY);
    expect(contrastRatio(color, background)).toBeGreaterThanOrEqual(4.5);
  });

  test('item ativo', async ({ page }) => {
    await openHome(page);
    const link = page
      .getByRole('navigation', { name: LABEL_MAIN_NAV })
      .getByRole('link', { name: LABEL_HOME });
    const text = await css(link.locator('[matListItemTitle]'), 'color');
    const background = await css(link, 'background-color');

    expect(text).toBe(NAV_ACTIVE_TEXT);
    expect(background).toBe(NAV_ACTIVE_BACKGROUND);
    expect(contrastRatio(text, background)).toBeGreaterThanOrEqual(4.5);
    expect(await css(link.locator('mat-icon'), 'color')).toBe(PRIMARY);
  });

  test('fundo e cartões', async ({ page }) => {
    await openHome(page);
    // O fundo da área de conteúdo é pintado no container (token `content-background-color` do sidenav); o
    // `mat-sidenav-content` é transparente sobre ele.
    expect(await css(page.locator('mat-sidenav-container'), 'background-color')).toBe(
      CONTENT_BACKGROUND,
    );
    expect(await css(page.locator('mat-sidenav-content'), 'background-color')).toBe(
      'rgba(0, 0, 0, 0)',
    );
    expect(await css(page.locator('mat-sidenav'), 'background-color')).toBe(WHITE);
    expect(await css(page.locator('app-home-page > mat-card'), 'background-color')).toBe(WHITE);
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

  test('marca no celular', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/login');
    await expect(page.locator('.brand-small')).toBeVisible();
    expect(await css(page.locator('.brand-small'), 'color')).toBe(PRIMARY);
  });
});
