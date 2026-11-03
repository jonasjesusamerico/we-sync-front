import type { Page } from '@playwright/test';
import { ANA } from './support/api-mock';
import { expect, test } from './support/fixtures';
import { expectHitTarget, expectInViewport, expectNoHorizontalScroll } from './support/layout';
import { seedSession } from './support/session';
import * as t from './support/texts';

test.beforeEach(({ api }) => api.addUser(ANA));

test('CA-27', async ({ page, api }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await seedSession(page, api.issueSession(ANA.email));
  await page.goto('/inicio');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Olá, Ana Souza');
  await expect(page.locator('#ws-sidebar')).toBeHidden();
  const topbar = page.locator('#ws-topbar');
  await expect(topbar.locator('.ws-brand')).toBeVisible();
  await expect(topbar.getByRole('button', { name: t.LABEL_USE_DARK_THEME })).toBeVisible();
  await expect(topbar.getByRole('button', { name: 'Notificações, em breve' })).toBeVisible();
  await expect(topbar.locator('.ws-avatar')).toHaveText('AS');
  await expect(topbar.locator('.ws-user-name')).toBeHidden();
  await expect(topbar.getByRole('button', { name: 'Nova compra, em breve' })).toBeHidden();
  const nav = page.locator('#ws-bottomnav');
  await expect(nav).toBeVisible();
  const items = nav.locator(':scope > a, :scope > button');
  await expect(items).toHaveCount(5);
  await expect(items.nth(0)).toHaveText('Início');
  await expect(items.nth(0)).toHaveAttribute('aria-current', 'page');
  const labels = await items.evaluateAll((els) =>
    els.slice(1).map((e) => e.getAttribute('aria-label')),
  );
  expect(labels).toEqual([
    'Compras, em breve',
    'Nova compra, em breve',
    'Casa, em breve',
    'Ajustes, em breve',
  ]);
  await expect(nav.locator('[aria-current]')).toHaveCount(1);
  await expectNoHorizontalScroll(page);
});

async function checkScreen(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expectNoHorizontalScroll(page);
  const controls = page.locator('button:visible, a:visible, input:visible');
  const count = await controls.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const control = controls.nth(i);
    await expectInViewport(control);
    if ((await control.getAttribute('aria-disabled')) === 'true') {
      await expectHitTarget(control);
    } else {
      await control.click({ trial: true });
    }
  }
}

test('CA-28', async ({ page, api }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/login');
  await checkScreen(page);
  await page.goto('/cadastro');
  await checkScreen(page);
  await seedSession(page, api.issueSession(ANA.email));
  await page.goto('/inicio');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Olá, Ana Souza');
  await checkScreen(page);
});

for (const url of ['/login', '/cadastro']) {
  test(`painel de acesso ${url}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(url);
    await expect(page.locator('.ws-auth-art')).toBeVisible();
    await expect(page.locator('.ws-auth-form > .d-lg-none')).toBeHidden();
    await page.setViewportSize({ width: 375, height: 740 });
    await expect(page.locator('.ws-auth-art')).toBeHidden();
    await expect(page.locator('.ws-auth-form .ws-brand')).toBeVisible();
    const brand = await page.locator('.ws-auth-form .ws-brand').boundingBox();
    const title = await page.getByRole('heading', { level: 1 }).boundingBox();
    expect(brand!.y).toBeLessThan(title!.y);
  });
}
