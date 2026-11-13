// Feature 007: the grid of the home blocks at 1280 and 360 px (CA-21, RF-01, D-05).
import type { Locator } from '@playwright/test';
import { ANA } from './support/api-mock';
import { expect, test } from './support/fixtures';
import { addHomePurchase, loginHome, openHome, seedTable } from './support/home';
import { expectNoHorizontalScroll } from './support/layout';

const top = async (locator: Locator) => (await locator.boundingBox())!.y;

test('CA-21 1280 px', async ({ page, api }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await loginHome(page, api);
  seedTable(api);
  await openHome(page);
  expect(await top(page.locator('#hero-col'))).toBe(await top(page.locator('#kpi-cards')));
  expect(await top(page.locator('ws-daily-bars'))).toBe(
    await top(page.locator('ws-category-donut')),
  );
  expect(await top(page.locator('ws-latest-purchases'))).toBe(
    await top(page.locator('ws-payment-meters')),
  );
  await expectNoHorizontalScroll(page);
});

test('CA-21 360 px', async ({ page, api }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await loginHome(page, api);
  seedTable(api);
  await openHome(page);
  const order = [
    page.locator('#hero-col'),
    page.locator('#kpi-cards'),
    page.locator('ws-daily-bars'),
    page.locator('ws-category-donut'),
    page.locator('ws-latest-purchases'),
    page.locator('ws-payment-meters'),
  ];
  const ys = [];
  for (const locator of order) ys.push(await top(locator));
  expect([...ys].sort((a, b) => a - b)).toEqual(ys);
  expect(new Set(ys).size).toBe(ys.length);
  const tiles = page.locator('.ws-kpi');
  expect(await top(tiles.nth(0))).toBe(await top(tiles.nth(1)));
  await expectNoHorizontalScroll(page);

  // Long names, a long description and the largest amount (D-05, RP-13).
  const long = 'Categoriacomnomemuitocompridosemespaco40';
  const category = api.addCategory(ANA.email, long, { icon: 'TAG', color: 'FOOD' });
  const payment = api.addPaymentMethod(ANA.email, long);
  addHomePurchase(api, '2026-11-09', 9_999_999_999, 'PAID', {
    description: 'x'.repeat(120),
    categoryId: category,
    paymentMethodId: payment,
  });
  await page.reload();
  await expect(page.locator('#cat-top')).toHaveText(long);
  await expectNoHorizontalScroll(page);
});

test('alvos de toque', async ({ page, api }) => {
  await loginHome(page, api);
  seedTable(api);
  for (const width of [360, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await openHome(page);
    const box = (await page.locator('#last-all').boundingBox())!;
    expect(box.height, `${width}px`).toBeGreaterThanOrEqual(44);
    expect(box.width, `${width}px`).toBeGreaterThanOrEqual(44);
  }
});
