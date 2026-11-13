import type { Page } from '@playwright/test';
import { ANA, type ApiMock, type MockStatus } from './support/api-mock';
import { expect, test } from './support/fixtures';
import { fixedToday } from './support/purchases';
import { seedSession } from './support/session';
import * as t from './support/texts';

const total = (page: Page) => page.locator('#kpi-total');
const seal = (page: Page) => page.locator('.ws-hero-chip');

async function login(page: Page, api: ApiMock, today?: Date) {
  api.addUser(ANA);
  await fixedToday(page, today);
  await seedSession(page, api.issueSession(ANA.email));
}

function add(api: ApiMock, date: string, cents: number, status: MockStatus = 'PAID') {
  return api.addPurchase(ANA.email, {
    date,
    description: `Compra ${date}`,
    categoryId: 1,
    paymentMethodId: 4,
    cents,
    status,
  });
}

/** CA-03: today 10/11; November spends 150 (100 until day 10), October spent 200 until day 10. */
function seedNovember(api: ApiMock) {
  add(api, '2026-11-05', 10000);
  add(api, '2026-11-20', 5000, 'PENDING');
  add(api, '2026-11-06', 9999, 'CANCELED');
  add(api, '2026-10-03', 20000);
  add(api, '2026-10-25', 90000);
}

test('CA-02 e CA-03: gasto do mês e comparação até o dia', async ({ page, api }) => {
  await login(page, api);
  seedNovember(api);
  await page.goto('/inicio');
  await expect(page).toHaveURL('/inicio?ano=2026&mes=11');
  await expect(page.locator('.ws-month-label')).toHaveText('novembro 2026');
  await expect(page.getByRole('button', { name: t.LABEL_CURRENT_MONTH })).toHaveCount(0);
  await expect(page.locator('#hero-label')).toHaveText('Gasto em novembro');
  await expect(total(page)).toHaveText('R$ 150,00');
  await expect(seal(page)).toHaveText('50% a menos que outubro até o dia 10');
  const query = api.requests('/purchases/summary').at(-1)!.query;
  expect(query).toEqual({ year: '2026', month: '11', today: '2026-11-10' });
});

test('CA-04: outro mês compara os meses inteiros', async ({ page, api }) => {
  await login(page, api);
  add(api, '2026-09-02', 60000);
  add(api, '2026-09-28', 50000);
  add(api, '2026-08-15', 100000);
  await page.goto('/inicio?ano=2026&mes=9');
  await expect(total(page)).toHaveText('R$ 1.100,00');
  await expect(seal(page)).toHaveText('10% a mais que agosto');
  await expect(page.getByRole('button', { name: t.LABEL_CURRENT_MONTH })).toBeVisible();
  await page.getByRole('button', { name: t.LABEL_CURRENT_MONTH }).click();
  await expect(page).toHaveURL('/inicio?ano=2026&mes=11');
});

test('CA-05: sem base e igual', async ({ page, api }) => {
  await login(page, api);
  add(api, '2026-09-10', 3000);
  add(api, '2026-07-10', 50000);
  add(api, '2026-06-10', 50000);
  await page.goto('/inicio?ano=2026&mes=9');
  await expect(seal(page)).toHaveText('Sem compras em agosto para comparar.');
  await page.goto('/inicio?ano=2026&mes=7');
  await expect(seal(page)).toHaveText('Igual a junho');
});

test('CA-06: em 31/03, fevereiro inteiro', async ({ page, api }) => {
  await login(page, api, new Date(2027, 2, 31, 12));
  add(api, '2027-03-30', 30000);
  add(api, '2027-02-27', 60000);
  await page.goto('/inicio');
  await expect(page).toHaveURL('/inicio?ano=2027&mes=3');
  // Feature 007 (RN-04, D-10): February is shorter, so the seal says up to which day each month was summed.
  await expect(seal(page)).toHaveText(
    '50% a menos que fevereiro (até o dia 31; fevereiro até o dia 28)',
  );
  expect(api.requests('/purchases/summary').at(-1)!.query['today']).toBe('2027-03-31');
});

test('CA-07: mês vazio e Nova compra no dia 1', async ({ page, api }) => {
  await login(page, api);
  await page.goto('/inicio?ano=2026&mes=9');
  await expect(total(page)).toHaveText('R$ 0,00');
  await expect(page.locator('.ws-hero-progress p')).toHaveText('Nenhuma compra em setembro.');
  await expect(page.locator('.ws-hero-progress').getByText(t.LABEL_SEE_PURCHASES)).toHaveCount(0);
  await page.locator('.ws-hero-progress').getByRole('link', { name: 'Nova compra' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(t.NEW_PURCHASE_HEADING);
  await expect(page.locator('#date')).toHaveValue('2026-09-01');
});

test('CA-08: Ver compras abre o mês sem filtros', async ({ page, api }) => {
  await login(page, api);
  add(api, '2026-09-10', 3000);
  await page.goto('/inicio?ano=2026&mes=9');
  await page.getByRole('link', { name: t.LABEL_SEE_PURCHASES }).click();
  await expect(page).toHaveURL('/compras?ano=2026&mes=9');
  await expect(page.locator('#rows tr')).toHaveCount(1);
});

test('CA-09: sem o aviso "em breve"', async ({ page, api }) => {
  await login(page, api);
  await page.goto('/inicio');
  await expect(total(page)).toBeVisible();
  await expect(page.getByText('O resumo do seu mês vai aparecer aqui em breve.')).toHaveCount(0);
  await expect(page.locator('.ws-callout')).toHaveCount(0);
});

test('CA-29: salvar pelo Início volta com o aviso e o gasto atualizado', async ({ page, api }) => {
  await login(page, api);
  seedNovember(api);
  await page.goto('/inicio');
  await expect(total(page)).toHaveText('R$ 150,00');
  await page.locator('#ws-topbar').getByRole('link', { name: 'Nova compra' }).click();
  await page.locator('#amount').fill('25,00');
  await page.locator('#description').fill('Pão');
  await page.locator('label[for="c-1"]').click();
  await page.getByRole('button', { name: t.SAVE_PURCHASE, exact: true }).click();
  await expect(page).toHaveURL('/inicio?ano=2026&mes=11');
  await expect(page.locator('.ws-toast')).toContainText(t.TOAST_SAVED);
  await expect(total(page)).toHaveText('R$ 175,00');
});

test('RN-26: a falha do resumo fica só no cartão', async ({ page, api }) => {
  await login(page, api);
  api.fail('/purchases/summary', 500);
  await page.goto('/inicio');
  const hero = page.locator('.ws-hero');
  await expect(hero.getByRole('alert')).toContainText(t.MSG_SERVER);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Olá, Ana Souza');
  await expect(page.locator('.ws-month')).toBeVisible();
  await hero.getByRole('button', { name: t.LABEL_RETRY }).click();
  await expect(total(page)).toHaveText('R$ 0,00');
});
