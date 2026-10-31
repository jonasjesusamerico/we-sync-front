import { expect, Page, test } from '@playwright/test';

import { horizontalOverflow } from './support/layout';
import { seedSession } from './support/session';
import { APP_NAME, LABEL_MAIN_NAV, LABEL_OPEN_MENU } from './support/texts';

test.use({ viewport: { width: 360, height: 640 } });

async function expectUsable(page: Page) {
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);

  // Só os visíveis: o menu lateral fechado fica oculto de propósito a 360 px (RF-08 da 002).
  const controls = page.locator('input, button, a').filter({ visible: true });
  const count = await controls.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const control = controls.nth(i);
    await control.scrollIntoViewIfNeeded();
    await expect(control).toBeVisible();
    await expect(control).toBeInViewport();
    await control.click({ trial: true });
  }
}

test.describe('responsive', () => {
  test('360 px', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
    await expectUsable(page);

    await page.goto('/cadastro');
    await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible();
    await expectUsable(page);

    await seedSession(page);
    await page.goto('/');
    await expect(page.getByRole('button', { name: LABEL_OPEN_MENU })).toBeVisible();
    await expectUsable(page);
  });

  test('CA-07 login no celular', async ({ page }) => {
    await page.goto('/login');
    const brand = page.locator('app-auth-layout app-brand');
    const tablist = page.getByRole('tablist');

    await expect(brand).toBeVisible();
    await expect(brand.locator('.name')).toHaveText(APP_NAME);
    const brandBox = await brand.boundingBox();
    const tablistBox = await tablist.boundingBox();
    expect(brandBox!.y).toBeLessThan(tablistBox!.y);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });

  test('CA-02 Início no celular', async ({ page }) => {
    await seedSession(page);
    await page.goto('/');

    await expect(page.getByRole('navigation', { name: LABEL_MAIN_NAV })).toBeHidden();
    await expect(page.getByRole('button', { name: LABEL_OPEN_MENU })).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
});
