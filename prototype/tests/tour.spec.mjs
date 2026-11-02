import { test, expect, url, finishTour } from './helpers.mjs';

// TOUR-*: each screen has its tour, every step points at something visible, finishing hides it for good.
const TOURS = ['dashboard', 'compras', 'nova-compra', 'casa', 'metas', 'investimentos', 'configuracoes', 'admin'];

for (const name of TOURS) {
  test(`tour de ${name}: abre na primeira visita e não volta depois de concluído`, async ({ page }) => {
    await page.goto(url(name + '.html'));
    await finishTour(page);
    await page.reload();
    await page.waitForTimeout(800);
    await expect(page.locator('.ws-tour')).toHaveCount(0);
  });
}

test('fechar sem marcar: não volta na mesma sessão, volta numa nova (TOUR-05)', async ({ page, context }) => {
  await page.goto(url('compras.html'));
  await page.locator('[data-tour="close"]').click();
  await page.goto(url('dashboard.html?semtour=1'));
  await page.goto(url('compras.html'));
  await page.waitForTimeout(800);
  await expect(page.locator('.ws-tour')).toHaveCount(0);
  const other = await context.newPage(); // new tab = new session in the prototype
  await other.goto(url('compras.html'));
  await expect(other.locator('.ws-tour-card')).toBeVisible();
});

test('"Não exibir novamente" encerra o tour; Esc fecha; ajuda refaz', async ({ page }) => {
  await page.goto(url('metas.html'));
  await page.locator('#ws-tour-never').check();
  await page.locator('[data-tour="close"]').click();
  await page.reload();
  await page.waitForTimeout(800);
  await expect(page.locator('.ws-tour')).toHaveCount(0);
  await page.locator('[data-tour-help]').click();
  await expect(page.locator('.ws-tour-card')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.ws-tour')).toHaveCount(0);
});

test('novidade no Início abre o tour dos sonhos e some depois (TOUR-04)', async ({ page }) => {
  await page.goto(url('dashboard.html?semtour=1'));
  await page.locator('.ws-news a').click();
  await expect(page.locator('#ws-tour-title')).toHaveText('Novidade: Sonhos do casal');
  await finishTour(page);
  await page.goto(url('dashboard.html?semtour=1'));
  await expect(page.locator('.ws-news')).toHaveCount(0);
});

test('"Rever os tours" traz os tours de volta', async ({ page }) => {
  await page.goto(url('compras.html'));
  await finishTour(page);
  await page.goto(url('configuracoes.html?semtour=1#conta'));
  await page.locator('[data-tab="conta"]').click();
  await page.locator('#tours-reset').click();
  await page.goto(url('compras.html'));
  await expect(page.locator('.ws-tour-card')).toBeVisible();
});
