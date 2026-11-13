// Feature 007: the comparison seal against a shorter previous month (RN-04) and in a future month (RN-03).
import { expect, test } from './support/fixtures';
import { addHomePurchase, loginHome } from './support/home';

const OCT_31 = new Date(2026, 9, 31, 12);
const seal = '.ws-hero-chip';

test('CA-13 31/10 contra setembro', async ({ page, api }) => {
  await loginHome(page, api, OCT_31);
  addHomePurchase(api, '2026-10-05', 95000);
  addHomePurchase(api, '2026-09-30', 100000);
  await page.goto('/inicio?ano=2026&mes=10');
  await expect(page.locator(seal)).toHaveText(
    '5% a menos que setembro (até o dia 31; setembro até o dia 30)',
  );
});

test('RN-04 empate e sem base', async ({ page, api }) => {
  await loginHome(page, api, OCT_31);
  addHomePurchase(api, '2026-10-05', 100000);
  const september = addHomePurchase(api, '2026-09-30', 100000);
  await page.goto('/inicio?ano=2026&mes=10');
  await expect(page.locator(seal)).toHaveText(
    'Igual a setembro (até o dia 31; setembro até o dia 30)',
  );
  api.removePurchase(september);
  await page.reload();
  await expect(page.locator(seal)).toHaveText('Sem compras em setembro para comparar.');
});

test('CA-14 mesmo dia', async ({ page, api }) => {
  await loginHome(page, api);
  addHomePurchase(api, '2026-11-05', 10000);
  addHomePurchase(api, '2026-10-05', 20000);
  await page.goto('/inicio?ano=2026&mes=11');
  await expect(page.locator(seal)).toHaveText('50% a menos que outubro até o dia 10');
});

test('RN-03 mês futuro sem selo', async ({ page, api }) => {
  await loginHome(page, api);
  addHomePurchase(api, '2026-11-05', 10000);
  await page.goto('/inicio?ano=2026&mes=12');
  await expect(page.locator('#kpi-total')).toHaveText('R$ 0,00');
  await expect(page.locator(seal)).toHaveCount(0);
  addHomePurchase(api, '2026-12-05', 5000, 'PENDING');
  await page.reload();
  await expect(page.locator('#kpi-total')).toHaveText('R$ 50,00');
  await expect(page.locator('#kpi-paid')).toBeVisible();
  await expect(page.locator(seal)).toHaveCount(0);
});
