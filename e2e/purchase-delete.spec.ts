import type { Page } from '@playwright/test';
import { ANA, type ApiMock } from './support/api-mock';
import { expect, test } from './support/fixtures';
import { fixedToday, isoDate, openPurchases } from './support/purchases';
import { seedSession } from './support/session';
import * as t from './support/texts';

const dialog = (page: Page) => page.locator('dialog.ws-dialog');
const descriptions = (page: Page) => page.locator('#rows tr td:first-child a');

async function login(page: Page, api: ApiMock) {
  api.addUser(ANA);
  await fixedToday(page);
  await seedSession(page, api.issueSession(ANA.email));
}

function add(api: ApiMock, description: string, day: number, cents = 2390) {
  return api.addPurchase(ANA.email, {
    date: isoDate(2026, 11, day),
    description,
    categoryId: 2,
    paymentMethodId: 4,
    cents,
    status: 'PAID',
  });
}

test('CA-37: modal com os dados, Cancelar e Excluir', async ({ page, api }) => {
  await login(page, api);
  add(api, 'Uber', 9);
  add(api, 'Táxi', 8, 5000);
  await openPurchases(page);
  const trash = page.getByRole('button', { name: 'Excluir Uber' });
  await trash.click();
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page).locator('#ws-confirm-title')).toHaveText(t.DELETE_TITLE);
  await expect(dialog(page).locator('#ws-confirm-text p')).toHaveText([
    'Uber',
    '09/11/2026 · R$ 23,90',
    t.DELETE_WARNING,
  ]);
  await expect(dialog(page).getByRole('button', { name: t.CANCEL })).toBeFocused();

  await dialog(page).getByRole('button', { name: t.CANCEL }).click();
  await expect(dialog(page)).toBeHidden();
  await expect(trash).toBeFocused();
  await expect(descriptions(page)).toHaveText(['Uber', 'Táxi']);

  await trash.click();
  await dialog(page).getByRole('button', { name: t.DELETE, exact: true }).click();
  await expect(dialog(page)).toBeHidden();
  await expect(page.locator('.ws-toast')).toContainText(t.TOAST_DELETED);
  await expect(descriptions(page)).toHaveText(['Táxi']);
  await expect(page.locator('#summary')).toHaveText('1 compra · R$ 50,00 no total');
});

test('CA-37: Esc fecha sem excluir', async ({ page, api }) => {
  await login(page, api);
  add(api, 'Uber', 9);
  await openPurchases(page);
  await page.getByRole('button', { name: 'Excluir Uber' }).click();
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();
  await expect(descriptions(page)).toHaveText(['Uber']);
});

test('CA-37: pela edição, volta à origem', async ({ page, api }) => {
  await login(page, api);
  add(api, 'Uber', 9);
  await openPurchases(page, 'ano=2026&mes=11&busca=uber');
  await descriptions(page).first().click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(t.EDIT_PURCHASE_HEADING);
  await page.locator('aside').getByRole('button', { name: t.DELETE }).click();
  await dialog(page).getByRole('button', { name: t.DELETE, exact: true }).click();
  await expect(page).toHaveURL('/compras?ano=2026&mes=11&busca=uber');
  await expect(page.locator('.ws-toast')).toContainText(t.TOAST_DELETED);
  await expect(page.locator('.ws-empty')).toContainText(t.EMPTY_FILTERED_TITLE);
});

test('CA-38: a única compra da página 3 leva à página 2', async ({ page, api }) => {
  await login(page, api);
  for (let day = 1; day <= 17; day++) {
    add(api, `Compra ${day}`, day);
  }
  await openPurchases(page, 'ano=2026&mes=11&pagina=3');
  await expect(descriptions(page)).toHaveText(['Compra 1']);
  await page.getByRole('button', { name: 'Excluir Compra 1' }).click();
  await dialog(page).getByRole('button', { name: t.DELETE, exact: true }).click();
  await expect(page).toHaveURL('/compras?ano=2026&mes=11&pagina=2');
  await expect(page.locator('.ws-pager > span')).toHaveText('Página 2 de 2');
});

test('CA-39: compra já excluída em outra aba tem o mesmo aviso', async ({ page, api }) => {
  await login(page, api);
  const id = add(api, 'Uber', 9);
  await openPurchases(page);
  await page.getByRole('button', { name: 'Excluir Uber' }).click();
  api.removePurchase(id);
  await dialog(page).getByRole('button', { name: t.DELETE, exact: true }).click();
  await expect(page.locator('.ws-toast')).toContainText(t.TOAST_DELETED);
  await expect(page.locator('.ws-empty')).toContainText('Nenhuma compra em novembro de 2026.');
});
