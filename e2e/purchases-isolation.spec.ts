import type { Page } from '@playwright/test';
import { ANA, type MockUser } from './support/api-mock';
import { expect, fillLogin, HOME_URL, loginAs, openUserMenu, test } from './support/fixtures';
import { fixedToday } from './support/purchases';
import * as t from './support/texts';

const BIA: MockUser = { id: 43, name: 'Bia Lima', email: 'bia@exemplo.com', password: 'Senha123!' };
const SECRET = ['Segredo da Ana', '777,77'];

/** Until the delayed answer arrives, nothing of the previous user is on the screen (every 50 ms). */
async function expectNothingOfAna(page: Page, until: () => Promise<boolean>) {
  for (let i = 0; i < 40 && !(await until()); i++) {
    const body = await page.locator('body').innerText();
    for (const secret of SECRET) {
      expect(body, `"${secret}" na tela`).not.toContain(secret);
    }
    await page.waitForTimeout(50);
  }
}

test('CA-45: outro usuário na mesma aba não vê nada do anterior', async ({ page, api }) => {
  api.addUser(ANA);
  api.addUser(BIA);
  await fixedToday(page);
  api.addPurchase(ANA.email, {
    date: '2026-11-05',
    description: 'Segredo da Ana',
    categoryId: 1,
    paymentMethodId: 4,
    cents: 77777,
    status: 'PAID',
  });
  const other = api.addPurchase(ANA.email, {
    date: '2026-11-04',
    description: 'Outra da Ana',
    categoryId: 1,
    paymentMethodId: 4,
    cents: 100,
    status: 'PAID',
  });
  await loginAs(page);
  await page.goto('/compras?ano=2026&mes=11');
  await expect(page.locator('#rows')).toContainText('Segredo da Ana');
  await page.getByRole('button', { name: 'Excluir Outra da Ana' }).click();
  await page
    .locator('dialog.ws-dialog')
    .getByRole('button', { name: t.DELETE, exact: true })
    .click();
  await expect(page.locator('.ws-toast')).toBeVisible();
  expect(api.purchasesOf(ANA.email).some((p) => p.id === other)).toBe(false);

  await openUserMenu(page);
  await page.getByRole('menuitem', { name: t.LABEL_LOGOUT }).click();
  await expect(page).toHaveURL('/login');
  await fillLogin(page, BIA.email, BIA.password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(HOME_URL);
  await expect(page.locator('.ws-toast')).toHaveCount(0);

  api.delay('/purchases', 1000);
  await page.goto('/compras?ano=2026&mes=11');
  await expectNothingOfAna(page, async () => (await page.locator('.ws-empty, #rows').count()) > 0);
  await expect(page.locator('.ws-empty')).toContainText('Nenhuma compra em novembro de 2026.');

  api.delay('/purchases/summary', 1000);
  await page.goto('/inicio?ano=2026&mes=11');
  await expectNothingOfAna(page, async () => (await page.locator('#kpi-total').count()) > 0);
  await expect(page.locator('#kpi-total')).toHaveText('R$ 0,00');
});
