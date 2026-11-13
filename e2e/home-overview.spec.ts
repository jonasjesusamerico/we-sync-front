// Feature 007: the month blocks of the home page with the fake API (CA-01 to CA-19).
import { ANA } from './support/api-mock';
import { expect, test } from './support/fixtures';
import { addHomePurchase, loginHome, openHome, seedTable } from './support/home';
import * as t from './support/texts';

test('CA-01 indicadores', async ({ page, api }) => {
  await loginHome(page, api);
  seedTable(api);
  await openHome(page);
  await expect(page.locator('#kpi-paid')).toHaveText('R$ 200,00');
  await expect(page.locator('#kpi-paid-n')).toHaveText('3 compras');
  await expect(page.locator('#kpi-pending')).toHaveText('R$ 1.000,00');
  await expect(page.locator('#kpi-pending-n')).toHaveText('1 compra');
  await expect(page.locator('#kpi-count')).toHaveText('4');
  await expect(page.locator('#kpi-avg')).toHaveText('R$ 20,00');
  await expect(page.locator('#kpi-avg-foot')).toHaveText('em 10 dias');
  expect(api.requests('/purchases/overview').at(-1)!.query).toEqual({
    year: '2026',
    month: '11',
    today: '2026-11-10',
  });
});

test('CA-02 barras', async ({ page, api }) => {
  await loginHome(page, api);
  seedTable(api);
  await openHome(page);
  const bars = page.locator('#daily-bars .ws-bar');
  await expect(bars).toHaveCount(30);
  await expect(bars.nth(1)).toHaveAttribute('title', 'Dia 2: R$\u00a0100,00');
  await expect(bars.nth(4)).toHaveAttribute('title', 'Dia 5: R$\u00a0100,00');
  await expect(bars.nth(24)).toHaveAttribute('title', 'Dia 25: R$\u00a01.000,00 (previsto)');
  await expect(bars.nth(7)).toHaveClass(/is-empty/);
  await expect(bars.nth(24)).toHaveClass(/is-forecast/);
  await expect(page.locator('#daily-peak')).toHaveText('Pico dia 25');
});

test('CA-03 pico no empate', async ({ page, api }) => {
  await loginHome(page, api);
  addHomePurchase(api, '2026-11-02', 10000);
  addHomePurchase(api, '2026-11-05', 10000);
  await openHome(page);
  await expect(page.locator('#daily-peak')).toHaveText('Pico dia 2');
  await expect(page.locator('.ws-bar.is-peak')).toHaveCount(1);
  await expect(page.locator('#daily-bars .ws-bar').nth(1)).toHaveClass(/is-peak/);
});

test('CA-04 e CA-05', async ({ page, api }) => {
  await loginHome(page, api);
  seedTable(api);
  await openHome(page);
  const legend = page.locator('#cat-legend li');
  await expect(legend).toHaveCount(3);
  await expect(legend.nth(0)).toHaveText(/^Moradia\s*83%\s*R\$\s1\.000,00$/);
  await expect(legend.nth(1)).toHaveText(/^Alimentação\s*13%\s*R\$\s160,00$/);
  await expect(legend.nth(2)).toHaveText(/^Transporte\s*3%\s*R\$\s40,00$/);
  await expect(page.locator('#cat-legend')).not.toContainText('Lazer');
  await expect(page.locator('#cat-top')).toHaveText('Moradia');
  const meters = page.locator('#pay-meters .ws-meter');
  await expect(meters.locator('.ws-meter-row span')).toHaveText([
    'Boleto',
    'Pix',
    'Cartão de crédito',
  ]);
  const progress = meters.locator('.progress');
  await expect(progress.nth(0)).toHaveAttribute('aria-valuenow', '83');
  await expect(progress.nth(1)).toHaveAttribute('aria-valuenow', '13');
  await expect(progress.nth(2)).toHaveAttribute('aria-valuenow', '3');
  // D-17: the conic-gradient binding reaches the real DOM.
  const background = await page
    .locator('#cat-donut')
    .evaluate((el) => (el as HTMLElement).style.background);
  expect(background).toContain('conic-gradient(');
  expect(background).toContain('var(--ws-cat-home) 0.00% 83.33%');
});

test('CA-06 últimas e Ver todas', async ({ page, api }) => {
  await loginHome(page, api);
  seedTable(api);
  await openHome(page);
  const rows = page.locator('#last-list li');
  await expect(rows.locator('.ws-tx-title')).toHaveText([
    'Aluguel',
    'Cinema',
    'Padaria',
    'Uber',
    'Mercado',
  ]);
  await expect(rows.nth(1)).toHaveClass(/is-canceled/);
  await expect(rows.nth(1).locator('.ws-status')).toHaveText(t.STATUS_LABELS.CANCELED);
  await page.getByRole('link', { name: t.LATEST_SEE_ALL }).click();
  await expect(page).toHaveURL('/compras?ano=2026&mes=11');
  await expect(page.locator('#rows tr')).toHaveCount(5);
});

test('CA-07 só 6', async ({ page, api }) => {
  await loginHome(page, api);
  for (let day = 1; day <= 9; day++) {
    addHomePurchase(api, `2026-11-0${day}`, 1000, 'PAID', { description: `Dia ${day}` });
  }
  await openHome(page);
  await expect(page.locator('#last-list li .ws-tx-title')).toHaveText([
    'Dia 9',
    'Dia 8',
    'Dia 7',
    'Dia 6',
    'Dia 5',
    'Dia 4',
  ]);
});

test('CA-08 categoria arquivada', async ({ page, api }) => {
  await loginHome(page, api);
  const pets = api.addCategory(ANA.email, 'Pets', { icon: 'HEART', color: 'LEISURE' });
  addHomePurchase(api, '2026-11-03', 5000, 'PAID', { categoryId: pets });
  api.archiveCategory(pets);
  await openHome(page);
  const row = page.locator('#cat-legend li').first();
  await expect(row).toContainText('Pets');
  expect(await row.locator('.ws-dot').evaluate((el) => (el as HTMLElement).style.background)).toBe(
    'var(--ws-cat-leisure)',
  );
});

test('CA-09 setembro', async ({ page, api }) => {
  await loginHome(page, api);
  addHomePurchase(api, '2026-09-10', 90000);
  await openHome(page, 'ano=2026&mes=9');
  await expect(page.locator('#kpi-avg')).toHaveText('R$ 30,00');
  await expect(page.locator('#kpi-avg-foot')).toHaveText('em 30 dias');
  await expect(page.locator('.ws-bar.is-forecast')).toHaveCount(0);
});

test('CA-10 dezembro com pendente', async ({ page, api }) => {
  await loginHome(page, api);
  addHomePurchase(api, '2026-12-15', 7000, 'PENDING');
  await openHome(page, 'ano=2026&mes=12');
  await expect(page.locator('#kpi-total')).toHaveText('R$ 70,00');
  await expect(page.locator('.ws-hero-chip')).toHaveCount(0);
  await expect(page.locator('#kpi-avg-foot')).toHaveText('em 31 dias');
  await expect(page.locator('ws-daily-bars')).toBeVisible();
});

test('CA-15 fevereiro', async ({ page, api }) => {
  await loginHome(page, api);
  addHomePurchase(api, '2028-02-10', 1000);
  addHomePurchase(api, '2027-02-10', 1000);
  await openHome(page, 'ano=2028&mes=2');
  await expect(page.locator('#daily-bars .ws-bar')).toHaveCount(29);
  await openHome(page, 'ano=2027&mes=2');
  await expect(page.locator('#daily-bars .ws-bar')).toHaveCount(28);
});

test('CA-16 dia 1', async ({ page, api }) => {
  await loginHome(page, api, new Date(2026, 10, 1, 12));
  addHomePurchase(api, '2026-11-01', 5000);
  await openHome(page);
  await expect(page.locator('#kpi-avg')).toHaveText('R$ 50,00');
  await expect(page.locator('#kpi-avg-foot')).toHaveText('em 1 dia');
});

test('CA-18 salvar pelo +', async ({ page, api }) => {
  await loginHome(page, api);
  seedTable(api);
  await openHome(page);
  await page.locator('#ws-topbar').getByRole('link', { name: 'Nova compra' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(t.NEW_PURCHASE_HEADING);
  await page.locator('#amount').fill('25,00');
  await page.locator('#description').fill('Lanche');
  await page.locator('label[for="c-1"]').click();
  await page.getByRole('button', { name: t.SAVE_PURCHASE, exact: true }).click();
  await expect(page).toHaveURL('/inicio?ano=2026&mes=11');
  await expect(page.locator('#kpi-paid')).toHaveText('R$ 225,00');
  await expect(page.locator('#kpi-paid-n')).toHaveText('4 compras');
  await expect(page.locator('#kpi-count')).toHaveText('5');
});

test('CA-19 respostas fora de ordem', async ({ page, api }) => {
  await loginHome(page, api);
  seedTable(api);
  addHomePurchase(api, '2026-12-10', 7000, 'PENDING');
  await openHome(page);
  api.delay('/purchases/overview', 1500, { month: '12' });
  api.delay('/purchases/summary', 1500, { month: '12' });
  await page.getByRole('button', { name: 'Próximo mês' }).click();
  await expect(page).toHaveURL('/inicio?ano=2026&mes=12');
  await page.getByRole('button', { name: 'Mês anterior' }).click();
  await expect(page).toHaveURL('/inicio?ano=2026&mes=11');
  await page.waitForTimeout(2000);
  await expect(page.locator('#kpi-paid')).toHaveText('R$ 200,00');
  await expect(page.locator('#kpi-total')).toHaveText('R$ 1.200,00');
});
