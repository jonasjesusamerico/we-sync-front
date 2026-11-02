import { test, expect, url, expectNoOverflow } from './helpers.mjs';

// Every screen opens without errors and without sideways scroll.
const PAGES = [
  'index.html', 'login.html', 'cadastro.html', 'dashboard.html', 'compras.html', 'nova-compra.html', 'casa.html',
  'casa.html?vazio=1', 'casa.html?semrenda=1', 'casa.html?arquivada=1', 'casa.html?mes=setembro', 'convite.html',
  'metas.html', 'investimentos.html', 'configuracoes.html', 'admin.html',
];

for (const page of PAGES) {
  test(`abre ${page}`, async ({ page: p }) => {
    await p.goto(url(page + (page.includes('?') ? '&' : '?') + 'semtour=1'));
    await expect(p.locator('body')).toBeVisible();
    await expectNoOverflow(p);
  });
}

test('índice leva ao Encontro do mês e ao tour da novidade', async ({ page }) => {
  await page.goto(url('index.html'));
  await page.getByText('Encontro do mês', { exact: true }).click();
  await expect(page.locator('#meet-view')).toBeVisible();
  await page.goBack();
  await page.getByText('Tour da novidade').click();
  await expect(page.locator('#ws-tour-title')).toHaveText('Novidade: Sonhos do casal');
});

test('admin mostra fonte e data de verificação dos valores externos (ADM-10)', async ({ page }) => {
  await page.goto(url('admin.html?semtour=1'));
  await expect(page.locator('#tab-salario')).toContainText('verificado em 01/11/2026');
  await page.locator('[data-tab="taxas"]').click();
  await expect(page.locator('#tab-taxas')).toContainText('revisar a cada 6 meses');
});
