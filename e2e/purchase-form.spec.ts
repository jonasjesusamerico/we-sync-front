import type { Page } from '@playwright/test';
import { ANA, type ApiMock, type MockUser } from './support/api-mock';
import { expect, test } from './support/fixtures';
import { fixedToday, openPurchases } from './support/purchases';
import { seedSession } from './support/session';
import * as t from './support/texts';

const BIA: MockUser = { id: 43, name: 'Bia Lima', email: 'bia@exemplo.com', password: 'Senha123!' };
const heading = (page: Page) => page.getByRole('heading', { level: 1 });
const dialog = (page: Page) => page.locator('dialog.ws-dialog');
const saveButton = (page: Page) => page.getByRole('button', { name: t.SAVE_PURCHASE, exact: true });

async function login(page: Page, api: ApiMock) {
  api.addUser(ANA);
  await fixedToday(page);
  await seedSession(page, api.issueSession(ANA.email));
}

/** Opens "Nova compra" from Compras of a month, as the user does. */
async function openNew(page: Page, query = 'ano=2026&mes=11') {
  await openPurchases(page, query);
  await page.locator('#ws-topbar').getByRole('link', { name: 'Nova compra' }).click();
  await expect(heading(page)).toHaveText(t.NEW_PURCHASE_HEADING);
  await expect(page.locator('#categories input').first()).toBeAttached();
}

async function fill(page: Page, amount = '1234,56', description = 'Mercado') {
  await page.locator('#amount').fill(amount);
  await page.locator('#description').fill(description);
  await page.locator('label[for="c-1"]').click();
}

function addPurchase(api: ApiMock, email = ANA.email, description = 'Padária São João') {
  return api.addPurchase(email, {
    date: '2026-11-05',
    description,
    categoryId: 1,
    paymentMethodId: 4,
    cents: 123456,
    status: 'PAID',
  });
}

test('CA-23: valores iniciais', async ({ page, api }) => {
  await login(page, api);
  await openNew(page);
  await expect(page.locator('#amount')).toHaveValue('0,00');
  await expect(page.locator('#description')).toHaveValue('');
  await expect(page.locator('#date')).toHaveValue('2026-11-10');
  await expect(page.locator('#categories input:checked')).toHaveCount(0);
  await expect(page.locator('#p-4')).toBeChecked();
  await expect(page.locator('#s-paid')).toBeChecked();
  await expect(page.locator('#s-canceled')).toHaveCount(0);
});

test('CA-24: a partir de setembro, data 01/09', async ({ page, api }) => {
  await login(page, api);
  await openNew(page, 'ano=2026&mes=9');
  await expect(page.locator('#date')).toHaveValue('2026-09-01');
});

test('CA-25: valor entra pela direita e para no máximo', async ({ page, api }) => {
  await login(page, api);
  await openNew(page);
  const amount = page.locator('#amount');
  await amount.click();
  await amount.press('1');
  await amount.press('2');
  await amount.press('3');
  await expect(amount).toHaveValue('1,23');
  await amount.fill('99999999,99');
  await expect(amount).toHaveValue('99.999.999,99');
  await amount.press('End');
  await amount.press('5');
  await expect(amount).toHaveValue('99.999.999,99');
});

test('CA-26: salvar vazio mostra os erros e não envia', async ({ page, api }) => {
  await login(page, api);
  await openNew(page);
  await saveButton(page).click();
  await expect(page.locator('#amount-error')).toHaveText(t.ERR_AMOUNT);
  await expect(page.locator('#description-error')).toHaveText(t.ERR_DESCRIPTION_REQUIRED);
  await expect(page.locator('#category-error')).toHaveText(t.ERR_CATEGORY);
  await expect(page.locator('#amount')).toBeFocused();
  expect(api.requests('/purchases').filter((r) => r.method === 'POST')).toHaveLength(0);
});

test('CA-27: descrição sem as pontas e no máximo 120 caracteres', async ({ page, api }) => {
  await login(page, api);
  await openNew(page);
  await page.locator('#description').fill('a'.repeat(130));
  await expect(page.locator('#description')).toHaveValue('a'.repeat(120));
  await fill(page, '1234,56', '  Mercado  ');
  await saveButton(page).click();
  await expect(page).toHaveURL('/compras?ano=2026&mes=11');
  const post = api.requests('/purchases').find((r) => r.method === 'POST')!;
  expect(post.body).toEqual({
    purchase_date: '2026-11-10',
    description: 'Mercado',
    category_id: 1,
    payment_method_id: 4,
    amount: '1234.56',
    status: 'PAID',
  });
});

test('CA-28: resumo ao vivo', async ({ page, api }) => {
  await login(page, api);
  await openNew(page);
  await expect(page.locator('#preview-desc')).toHaveText(t.NO_DESCRIPTION);
  await fill(page, '1234,56', 'Feira');
  await expect(page.locator('#preview-desc')).toHaveText('Feira');
  await expect(page.locator('#preview-meta')).toHaveText('Alimentação · 10/11/2026 · Pix');
  await expect(page.locator('#preview-amount')).toHaveText('R$ 1.234,56');
});

test('CA-29: pelo "+" do Início, volta ao Início com o aviso e o gasto atualizado', async ({
  page,
  api,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await login(page, api);
  await page.goto('/inicio');
  await expect(page.locator('#kpi-total')).toHaveText('R$ 0,00');
  await page.locator('#ws-bottomnav a.ws-fab').click();
  await expect(heading(page)).toHaveText(t.NEW_PURCHASE_HEADING);
  await fill(page, '50,00', 'Pão');
  await saveButton(page).click();
  await expect(page).toHaveURL('/inicio?ano=2026&mes=11');
  await expect(page.locator('.ws-toast')).toContainText(t.TOAST_SAVED);
  await expect(page.locator('#kpi-total')).toHaveText('R$ 50,00');
});

test('CA-30: data de outro mês avisa o mês e volta à origem', async ({ page, api }) => {
  await login(page, api);
  await openNew(page);
  await fill(page);
  await page.locator('#date').fill('2026-09-10');
  await saveButton(page).click();
  await expect(page).toHaveURL('/compras?ano=2026&mes=11');
  await expect(page.locator('.ws-toast')).toContainText('Compra salva em setembro de 2026');
});

test('CA-31: salvar e criar outra', async ({ page, api }) => {
  await login(page, api);
  await openNew(page);
  await fill(page);
  await page.locator('label[for="s-pending"]').click();
  await page.getByRole('button', { name: t.SAVE_AND_NEW }).click();
  await expect(page.locator('.ws-toast')).toContainText(t.TOAST_SAVED);
  await expect(page).toHaveURL('/compras/nova');
  await expect(page.locator('#amount')).toHaveValue('0,00');
  await expect(page.locator('#description')).toHaveValue('');
  await expect(page.locator('#c-1')).toBeChecked();
  await expect(page.locator('#s-pending')).toBeChecked();
  await expect(page.locator('#amount')).toBeFocused();
  await page.locator('a.ws-back').click();
  await expect(dialog(page)).toBeHidden();
  await expect(page).toHaveURL('/compras?ano=2026&mes=11');
});

test('CA-33: edição com Cancelada e os três botões', async ({ page, api }) => {
  await login(page, api);
  const id = addPurchase(api);
  await page.goto(`/compras/${id}`);
  await expect(heading(page)).toHaveText(t.EDIT_PURCHASE_HEADING);
  await expect(page.locator('#description')).toHaveValue('Padária São João');
  await expect(page.locator('#s-canceled')).toHaveCount(1);
  await expect(page.locator('aside .d-grid > *')).toHaveText([t.SAVE_CHANGES, t.DELETE, t.CANCEL]);
});

test('CA-34: descrição de 200 caracteres cortada na lista e recusada ao salvar', async ({
  page,
  api,
}) => {
  await login(page, api);
  const long = 'Descrição longa '.repeat(13).slice(0, 200);
  const id = addPurchase(api, ANA.email, long);
  await openPurchases(page);
  const link = page.locator('#rows tr td:first-child a');
  await expect(link).toHaveAttribute('title', long);
  await expect(link).toHaveCSS('text-overflow', 'ellipsis');
  await page.goto(`/compras/${id}`);
  await expect(page.locator('#description')).toHaveValue(long);
  await page.getByRole('button', { name: t.SAVE_CHANGES }).click();
  await expect(page.locator('#description-error')).toHaveText(t.ERR_DESCRIPTION_MAX);
});

test.describe('CA-35 e CA-36: alterações não salvas', () => {
  async function changed(page: Page, api: ApiMock) {
    await login(page, api);
    await openNew(page);
    await page.locator('#description').fill('Pão');
  }

  async function expectDiscard(page: Page, leave: () => Promise<void>, target: RegExp | string) {
    await leave();
    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page)).toContainText(t.DISCARD_TITLE);
    await dialog(page).getByRole('button', { name: t.DISCARD_KEEP }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(page).toHaveURL('/compras/nova');
    await expect(page.locator('#description')).toHaveValue('Pão');
    await leave();
    await dialog(page).getByRole('button', { name: t.DISCARD_CONFIRM, exact: true }).click();
    await expect(page).toHaveURL(target);
  }

  test('Cancelar', async ({ page, api }) => {
    await changed(page, api);
    await expectDiscard(
      page,
      () => page.locator('aside').getByRole('link', { name: t.CANCEL }).click(),
      '/compras?ano=2026&mes=11',
    );
  });

  test('‹ Compras', async ({ page, api }) => {
    await changed(page, api);
    await expectDiscard(page, () => page.locator('a.ws-back').click(), '/compras?ano=2026&mes=11');
  });

  test('voltar do navegador', async ({ page, api }) => {
    await changed(page, api);
    await expectDiscard(
      page,
      () => page.evaluate(() => history.back()),
      '/compras?ano=2026&mes=11',
    );
  });

  test('item do menu', async ({ page, api }) => {
    await changed(page, api);
    await expectDiscard(
      page,
      () => page.locator('#ws-sidebar').getByRole('link', { name: 'Início' }).click(),
      /\/inicio/,
    );
  });

  test('sem alteração sai direto', async ({ page, api }) => {
    await login(page, api);
    await openNew(page);
    await page.locator('a.ws-back').click();
    await expect(page).toHaveURL('/compras?ano=2026&mes=11');
    await expect(dialog(page)).toBeHidden();
  });

  test('alterar e desfazer sai direto', async ({ page, api }) => {
    await changed(page, api);
    await page.locator('#description').fill('');
    await page.locator('a.ws-back').click();
    await expect(page).toHaveURL('/compras?ano=2026&mes=11');
    await expect(dialog(page)).toBeHidden();
  });

  test('fechar a aba pede confirmação do navegador', async ({ page, api }) => {
    await changed(page, api);
    const shown = new Promise<string>((resolve) =>
      page.once('dialog', async (d) => {
        resolve(d.type());
        await d.dismiss();
      }),
    );
    await page.close({ runBeforeUnload: true });
    expect(await shown).toBe('beforeunload');
  });
});

test('CA-40: compra excluída em outra aba', async ({ page, api }) => {
  await login(page, api);
  const id = addPurchase(api);
  await openPurchases(page);
  await page.locator('#rows tr td:first-child a').click();
  await page.locator('#description').fill('Pão');
  api.removePurchase(id);
  await page.getByRole('button', { name: t.SAVE_CHANGES }).click();
  await expect(page.locator('.ws-toast')).toContainText(t.TOAST_GONE);
  await expect(page).toHaveURL('/compras?ano=2026&mes=11');
  await expect(dialog(page)).toBeHidden();
});

test('CA-41: categoria própria removida', async ({ page, api }) => {
  await login(page, api);
  const pets = api.addCategory(ANA.email, 'Pets');
  await openNew(page);
  await page.locator('#amount').fill('10,00');
  await page.locator('#description').fill('Ração');
  await page.locator(`label[for="c-${pets}"]`).click();
  api.removeCategory(pets);
  await saveButton(page).click();
  await expect(page.locator('#category-error')).toHaveText(t.ERR_CATEGORY_GONE);
  await expect(page.locator(`#c-${pets}`)).toHaveCount(0);
  await expect(page.locator('#description')).toHaveValue('Ração');
});

test('CA-41: forma própria removida', async ({ page, api }) => {
  await login(page, api);
  const vale = api.addPaymentMethod(ANA.email, 'Vale');
  await openNew(page);
  await fill(page);
  await page.locator(`label[for="p-${vale}"]`).click();
  api.removePaymentMethod(vale);
  await saveButton(page).click();
  await expect(page.locator('#payment-error')).toHaveText(t.ERR_PAYMENT_GONE);
  await expect(page.locator(`#p-${vale}`)).toHaveCount(0);
});

test('CA-42: compra inexistente, de outro usuário e id inválido', async ({ page, api }) => {
  await login(page, api);
  api.addUser(BIA);
  const other = addPurchase(api, BIA.email, 'Da Bia');
  for (const id of ['999', String(other), 'abc']) {
    await page.goto(`/compras/${id}`);
    await expect(page).toHaveURL('/compras?ano=2026&mes=11');
    await expect(page.locator('.ws-toast')).toContainText(t.TOAST_NOT_FOUND);
    await expect(page.getByText('Da Bia')).toHaveCount(0);
  }
});

test('CA-44: salvar sem conexão mantém os campos', async ({ page, api }) => {
  await login(page, api);
  await openNew(page);
  await fill(page);
  api.fail('/purchases', 'abort');
  await saveButton(page).click();
  await expect(page.locator('.alert')).toContainText(t.MSG_CONNECTION);
  await expect(page.locator('#amount')).toHaveValue('1.234,56');
  await expect(page.locator('#description')).toHaveValue('Mercado');
  await expect(saveButton(page)).toBeEnabled();
});

test('CA-21: ícone da categoria global e da própria', async ({ page, api }) => {
  await login(page, api);
  const pets = api.addCategory(ANA.email, 'Pets');
  await openNew(page);
  await expect(page.locator('label[for="c-1"] ws-category-bubble')).toHaveAttribute(
    'style',
    /--cat: var\(--ws-cat-food\)/,
  );
  await expect(page.locator(`label[for="c-${pets}"] ws-category-bubble`)).toHaveAttribute(
    'style',
    /--cat: var\(--ws-muted\)/,
  );
});

test('CA-32 salvar @double-submit', async ({ page, api }) => {
  await login(page, api);
  await openNew(page);
  await fill(page);
  api.delay('/purchases', 1000);
  await saveButton(page).dblclick();
  await page.locator('#description').press('Enter');
  await expect(saveButton(page)).toBeDisabled();
  await expect(page).toHaveURL('/compras?ano=2026&mes=11', { timeout: 5000 });
  expect(api.requests('/purchases').filter((r) => r.method === 'POST')).toHaveLength(1);
});

test('CA-32 excluir @double-submit', async ({ page, api }) => {
  await login(page, api);
  addPurchase(api);
  await openPurchases(page);
  api.delay('/purchases/:id', 1000);
  await page.getByRole('button', { name: 'Excluir Padária São João' }).click();
  const confirm = dialog(page).getByRole('button', { name: t.DELETE, exact: true });
  await confirm.dblclick();
  await confirm.press('Enter');
  await expect(page.locator('.ws-toast')).toContainText(t.TOAST_DELETED, { timeout: 5000 });
  expect(api.requests('/purchases/:id').filter((r) => r.method === 'DELETE')).toHaveLength(1);
});
