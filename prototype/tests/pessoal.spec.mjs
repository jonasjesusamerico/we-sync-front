import { test, expect, url } from './helpers.mjs';

// Personal screens: pay yourself first, subscriptions and the freedom number.
test('pague-se primeiro no Início, com a sua parte da reserva e dos sonhos (PAG)', async ({ page }) => {
  await page.goto(url('dashboard.html?semtour=1'));
  await expect(page.locator('#pay-first')).toContainText('Guarde primeiro: R$ 1.200,00');
  await expect(page.locator('#pay-first')).toContainText('Reserva de emergência R$ 288,00');
  await page.locator('#pay-first-later').click();
  await expect(page.locator('#pay-first')).toBeEmpty();
});

test('assinaturas: total no ano, confirmar sugestão e cancelar (ASS)', async ({ page }) => {
  await page.goto(url('metas.html?semtour=1'));
  await expect(page.locator('#subs-sum')).toHaveText('3 assinaturas · R$ 156,70 por mês = R$ 1.880,40 por ano');
  await page.locator('[data-sub="yes"]').first().click();
  await page.locator('[data-sub="cancel"]').first().click();
  await expect(page.locator('#subs-sum')).toHaveText('3 assinaturas · R$ 126,70 por mês = R$ 1.520,40 por ano');
  await page.locator('label[for="sc-casa"]').click();
  await expect(page.locator('#assinaturas')).toBeHidden();
});

test('número da liberdade: gasto do mês × 300, sem a reserva (LIB)', async ({ page }) => {
  await page.goto(url('investimentos.html?semtour=1'));
  await expect(page.locator('#free-sub')).toContainText('R$ 1.140.000,00');
  await page.locator('#liberdade summary').click();
  await expect(page.locator('#free-how')).toContainText('× 300');
  await expect(page.locator('#free-income')).toContainText('dos seus gastos do mês');
});
