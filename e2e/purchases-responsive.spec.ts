import type { Locator, Page } from '@playwright/test';
import { ANA, type ApiMock } from './support/api-mock';
import { expect, test } from './support/fixtures';
import { expectNoHorizontalScroll } from './support/layout';
import { fixedToday, openPurchases, seedOctober } from './support/purchases';
import { seedSession } from './support/session';
import * as t from './support/texts';

async function login(page: Page, api: ApiMock) {
  api.addUser(ANA);
  await fixedToday(page);
  await seedSession(page, api.issueSession(ANA.email));
}

/** CA-47, D-01: every touch target of the feature has at least 44 × 44 px. */
async function expectTarget(locator: Locator, what: string) {
  const count = await locator.count();
  expect(count, what).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const box = await locator.nth(i).boundingBox();
    expect(box, what).not.toBeNull();
    expect(box!.width, `${what} (largura)`).toBeGreaterThanOrEqual(44);
    expect(box!.height, `${what} (altura)`).toBeGreaterThanOrEqual(44);
  }
}

test('CA-16: tabela no computador e cartões no celular', async ({ page, api }) => {
  await login(page, api);
  seedOctober(api, ANA.email, 2026, 11);
  await page.setViewportSize({ width: 1280, height: 800 });
  await openPurchases(page);
  await expect(page.locator('.ws-table-wrap')).toBeVisible();
  await expect(page.locator('#cards')).toBeHidden();
  await page.setViewportSize({ width: 360, height: 740 });
  await expect(page.locator('.ws-table-wrap')).toBeHidden();
  await expect(page.locator('#cards')).toBeVisible();
  await expect(page.locator('#cards li')).toHaveCount(8);
});

test('CA-16: sem rolagem lateral a 360 px', async ({ page, api }) => {
  await login(page, api);
  seedOctober(api, ANA.email, 2026, 11);
  const id = api.addPurchase(ANA.email, {
    date: '2026-11-05',
    description: 'Descrição bem longa '.repeat(6),
    categoryId: 1,
    paymentMethodId: 5,
    cents: 9999999999,
    status: 'CANCELED',
  });
  await page.setViewportSize({ width: 360, height: 740 });
  await openPurchases(page);
  await expectNoHorizontalScroll(page);
  await page.goto('/compras/nova');
  await expect(page.locator('#categories input').first()).toBeAttached();
  await expectNoHorizontalScroll(page);
  await page.goto(`/compras/${id}`);
  await expect(page.locator('#description')).not.toHaveValue('');
  await expectNoHorizontalScroll(page);
  await page.goto('/inicio');
  await expect(page.locator('#kpi-total')).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test('CA-16: o Resumo vem depois dos campos no celular', async ({ page, api }) => {
  await login(page, api);
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/compras/nova');
  const fields = await page.locator('#payments').boundingBox();
  const summary = await page.locator('aside.ws-summary').boundingBox();
  expect(summary!.y).toBeGreaterThan(fields!.y);
});

test('CA-47: alvos de toque de 44 px', async ({ page, api }) => {
  await login(page, api);
  seedOctober(api, ANA.email, 2026, 11);
  await page.setViewportSize({ width: 1280, height: 800 });
  await openPurchases(page, 'ano=2026&mes=10&busca=a');
  await expectTarget(page.locator('.ws-month .btn-icon'), 'setas do mês');
  await expectTarget(page.getByRole('button', { name: t.LABEL_CURRENT_MONTH }), 'Mês atual');
  await expectTarget(page.locator('#f-status label'), 'chips de situação');
  await expectTarget(
    page
      .locator('section[aria-label="Filtros"]')
      .getByRole('button', { name: t.LABEL_CLEAR_FILTERS }),
    'Limpar filtros',
  );

  await openPurchases(page);
  await expectTarget(page.locator('.ws-pager .btn'), 'paginador');
  await expectTarget(page.locator('#rows a.btn-icon'), 'lápis');
  await expectTarget(page.locator('#rows button.btn-icon'), 'lixeira');
  await page.locator('#rows button.btn-icon').first().click();
  await expect(page.locator('dialog.ws-dialog')).toBeVisible();
  await expectTarget(page.locator('dialog.ws-dialog .d-grid .btn'), 'botões do modal');
  await page.keyboard.press('Escape');

  await page.goto('/compras/nova');
  await expect(page.locator('#payments label').first()).toBeVisible();
  await expectTarget(page.locator('.ws-segmented label'), 'opções da situação');
  await expectTarget(page.locator('#payments label'), 'chips de pagamento');
  await page.locator('#amount').fill('1,00');
  await page.locator('#description').fill('Pão');
  await page.locator('label[for="c-1"]').click();
  await page.getByRole('button', { name: t.SAVE_PURCHASE, exact: true }).click();
  await expect(page.locator('.ws-toast')).toBeVisible();
  await expectTarget(page.locator('.ws-toast .btn-icon'), 'fechar o aviso');

  await page.goto('/inicio');
  await expect(page.getByRole('link', { name: t.LABEL_SEE_PURCHASES })).toBeVisible();
  await expectTarget(page.getByRole('link', { name: t.LABEL_SEE_PURCHASES }), 'Ver compras');
});
