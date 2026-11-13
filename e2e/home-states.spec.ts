// Feature 007: loading, empty month and errors of the home blocks (RF-07, RN-11, RN-12).
import { expect, test } from './support/fixtures';
import { addHomePurchase, loginHome, seedTable } from './support/home';
import * as t from './support/texts';

test('RF-07 carregando', async ({ page, api }) => {
  await loginHome(page, api);
  seedTable(api);
  api.delay('/purchases/overview', 1000);
  await page.goto('/inicio?ano=2026&mes=11');
  await expect(page.locator('#kpi-cards [role="status"]')).toBeVisible();
  await expect(page.locator('#hero-col')).toHaveClass(/col-xl-5/);
  await expect(page.locator('#kpi-paid')).toHaveText('R$ 200,00');
  await expect(page.locator('ws-payment-meters')).toBeVisible();
});

test('CA-11 dezembro sem compras', async ({ page, api }) => {
  await loginHome(page, api);
  await page.goto('/inicio?ano=2026&mes=12');
  await expect(page.locator('#kpi-total')).toHaveText('R$ 0,00');
  await expect(page.locator('.ws-hero-progress p')).toHaveText('Nenhuma compra em dezembro.');
  await expect(page.locator('.ws-hero-progress').getByRole('link')).toHaveText(
    t.LABEL_NEW_PURCHASE,
  );
  await expect(page.locator('.ws-hero-chip')).toHaveCount(0);
  await expect(page.locator('#kpi-cards')).toHaveCount(0);
  await expect(page.locator('#hero-col')).not.toHaveClass(/col-xl-5/);
  const hero = await page.locator('#hero-col .ws-hero').boundingBox();
  const content = await page.locator('.ws-page-head').boundingBox();
  expect(Math.abs(hero!.width - content!.width)).toBeLessThanOrEqual(1);
});

test('CA-12 só cancelada', async ({ page, api }) => {
  await loginHome(page, api);
  addHomePurchase(api, '2026-09-10', 3000, 'CANCELED');
  await page.goto('/inicio?ano=2026&mes=9');
  await expect(page.locator('#kpi-total')).toHaveText('R$ 0,00');
  await expect(page.locator('.ws-hero-progress').getByRole('link')).toContainText(
    t.LABEL_SEE_PURCHASES,
  );
  await expect(page.locator('#hero-col')).not.toHaveClass(/col-xl-5/);
  await expect(page.locator('#kpi-cards')).toHaveCount(0);
});

test('CA-17 API dos blocos fora do ar', async ({ page, api }) => {
  await loginHome(page, api);
  seedTable(api);
  api.fail('/purchases/overview', 500);
  await page.goto('/inicio?ano=2026&mes=11');
  const alert = page.getByRole('alert');
  await expect(alert).toHaveCount(1);
  await expect(page.locator('#kpi-cards').getByRole('alert')).toContainText(t.MSG_SERVER);
  await expect(page.locator('#kpi-total')).toHaveText('R$ 1.200,00');
  const summaries = api.calls('/purchases/summary');
  await page.locator('#kpi-cards').getByRole('button', { name: t.LABEL_RETRY }).click();
  await expect(page.locator('#kpi-paid')).toHaveText('R$ 200,00');
  expect(api.calls('/purchases/summary')).toBe(summaries);

  api.fail('/purchases/overview', 'abort');
  await page.getByRole('button', { name: 'Mês anterior' }).click();
  await expect(page.locator('#kpi-cards').getByRole('alert')).toContainText(t.MSG_CONNECTION);
});
