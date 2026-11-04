import type { Page } from '@playwright/test';
import { ANA, type ApiMock } from './support/api-mock';
import { expect, test } from './support/fixtures';
import { fixedToday, isoDate, OCTOBER, openPurchases, seedOctober } from './support/purchases';
import { seedSession } from './support/session';
import * as t from './support/texts';

const money = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(cents / 100)
    .replace(' ', ' ');
const rows = (page: Page) => page.locator('#rows tr');
const descriptions = (page: Page) => page.locator('#rows tr td:first-child a');
const summary = (page: Page) => page.locator('#summary');

async function login(page: Page, api: ApiMock) {
  api.addUser(ANA);
  await fixedToday(page);
  await seedSession(page, api.issueSession(ANA.email));
}

function addPadaria(api: ApiMock, date = '2026-11-05') {
  return api.addPurchase(ANA.email, {
    date,
    description: 'Padária São João',
    categoryId: 1,
    paymentMethodId: 4,
    cents: 123456,
    status: 'PAID',
  });
}

test('CA-10 e CA-11: só o mês, na ordem, resumo e paginador', async ({ page, api }) => {
  await login(page, api);
  seedOctober(api, ANA.email, 2026, 11);
  addPadaria(api, '2026-10-31');
  await openPurchases(page);
  const total = OCTOBER.filter((p) => p[5] !== 'CANCELED').reduce((a, p) => a + p[4], 0);
  await expect(summary(page)).toHaveText(`18 compras · ${money(total)} no total`);
  await expect(descriptions(page)).toHaveText([
    'Estacionamento',
    'Restaurante',
    'Livro',
    'Show',
    'Internet',
    'Supermercado',
    'Consulta no dentista',
    'Padaria',
  ]);
  await expect(page.locator('.ws-pager > span')).toHaveText('Página 1 de 3');
  await expect(
    page.getByRole('button', { name: t.LABEL_PREVIOUS_PAGE, exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: t.LABEL_NEXT_PAGE, exact: true }).click();
  await expect(page).toHaveURL('/compras?ano=2026&mes=11&pagina=2');
  await expect(page.locator('.ws-pager > span')).toHaveText('Página 2 de 3');
});

test('CA-11: 8 compras, sem paginador', async ({ page, api }) => {
  await login(page, api);
  seedOctober(api, ANA.email, 2026, 11);
  for (const p of api.purchasesOf(ANA.email).slice(8)) {
    api.removePurchase(p.id);
  }
  await openPurchases(page);
  await expect(rows(page)).toHaveCount(8);
  await expect(page.locator('ws-paginator')).toHaveCount(0);
});

test('CA-12: busca sem acento nem maiúsculas, na página 1', async ({ page, api }) => {
  await login(page, api);
  seedOctober(api, ANA.email, 2026, 11);
  addPadaria(api);
  await openPurchases(page, 'ano=2026&mes=11&pagina=2');
  const search = page.locator('#f-search');
  await search.fill('padaria');
  await expect(page).toHaveURL('/compras?ano=2026&mes=11&busca=padaria');
  await expect(descriptions(page)).toHaveText(['Padaria', 'Padária São João']);
  await expect(summary(page)).toHaveText(`2 compras · ${money(123456 + 2780)} no total`);
  await search.fill('SAO');
  await expect(page).toHaveURL('/compras?ano=2026&mes=11&busca=SAO');
  await expect(descriptions(page)).toHaveText(['Padária São João']);
  await expect(summary(page)).toHaveText(`1 compra · ${money(123456)} no total`);
});

test('CA-13: busca e categoria ficam ao trocar de mês', async ({ page, api }) => {
  await login(page, api);
  seedOctober(api, ANA.email, 2026, 11);
  seedOctober(api, ANA.email, 2026, 10);
  await openPurchases(page, 'ano=2026&mes=11&busca=super&categoria=1');
  await expect(descriptions(page)).toHaveText(['Supermercado', 'Supermercado do mês']);
  await page.getByRole('button', { name: t.LABEL_PREVIOUS_MONTH }).click();
  await expect(page).toHaveURL('/compras?ano=2026&mes=10&busca=super&categoria=1');
  await expect(page.locator('#f-search')).toHaveValue('super');
  await expect(page.locator('#f-category')).toHaveValue('1');
  await expect(descriptions(page)).toHaveText(['Supermercado', 'Supermercado do mês']);
});

test('CA-14: só as canceladas', async ({ page, api }) => {
  await login(page, api);
  seedOctober(api, ANA.email, 2026, 11);
  await openPurchases(page);
  await page.locator('#f-status label', { hasText: 'Cancelada' }).click();
  await expect(page).toHaveURL('/compras?ano=2026&mes=11&situacao=cancelada');
  await expect(descriptions(page)).toHaveText(['Show']);
  await expect(summary(page)).toHaveText('1 compra · R$ 0,00 no total');
});

test('CA-15: endereço com filtros e página, ao recarregar e em nova aba', async ({
  page,
  context,
  api,
}) => {
  await login(page, api);
  for (let i = 1; i <= 10; i++) {
    api.addPurchase(ANA.email, {
      date: isoDate(2026, 9, i),
      description: `Uber ${i}`,
      categoryId: 2,
      paymentMethodId: 4,
      cents: 1000 + i,
      status: 'PENDING',
    });
  }
  const query = 'ano=2026&mes=9&busca=uber&situacao=pendente&pagina=2';
  await openPurchases(page, query);
  await expect(descriptions(page)).toHaveText(['Uber 2', 'Uber 1']);
  await page.reload();
  await expect(descriptions(page)).toHaveText(['Uber 2', 'Uber 1']);
  const other = await context.newPage();
  await fixedToday(other);
  await other.goto(`/compras?${query}`);
  await expect(other.locator('#rows tr td:first-child a')).toHaveText(['Uber 2', 'Uber 1']);
  await expect(other.locator('.ws-pager > span')).toHaveText('Página 2 de 2');
});

test('CA-17 e CA-18: data, valor e cancelada riscada', async ({ page, api }) => {
  await login(page, api);
  addPadaria(api);
  api.addPurchase(ANA.email, {
    date: '2026-11-03',
    description: 'Show',
    categoryId: 6,
    paymentMethodId: 2,
    cents: 18000,
    status: 'CANCELED',
  });
  await openPurchases(page);
  const first = rows(page).first();
  await expect(first.locator('td').nth(1)).toHaveText('05/11/2026');
  await expect(first.locator('td.is-num')).toHaveText('R$ 1.234,56');
  const canceled = rows(page).nth(1);
  await expect(canceled).toHaveClass(/is-canceled/);
  await expect(canceled.locator('td.is-num')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(canceled.locator('.ws-status')).toHaveText('Cancelada');
});

test('CA-19: vazio sem filtro e com filtro', async ({ page, api }) => {
  await login(page, api);
  await openPurchases(page);
  await expect(page.locator('.ws-empty')).toContainText('Nenhuma compra em novembro de 2026.');
  await expect(page.locator('.ws-empty').getByRole('link', { name: 'Nova compra' })).toBeVisible();
  await openPurchases(page, 'ano=2026&mes=11&busca=xyz');
  await expect(page.locator('.ws-empty')).toContainText(t.EMPTY_FILTERED_TITLE);
  await expect(page.locator('.ws-empty')).toContainText(t.EMPTY_FILTERED_TEXT);
  await page.locator('.ws-empty').getByRole('button', { name: t.LABEL_CLEAR_FILTERS }).click();
  await expect(page).toHaveURL('/compras?ano=2026&mes=11');
});

test('CA-20: descrição, data e lápis abrem a edição; a lixeira abre o modal', async ({
  page,
  api,
}) => {
  await login(page, api);
  const id = addPadaria(api);
  const open = async (click: () => Promise<void>) => {
    await openPurchases(page);
    await click();
    await expect(page).toHaveURL(`/compras/${id}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Editar compra');
  };
  await open(() => descriptions(page).first().click());
  await open(() => rows(page).first().locator('td').nth(1).click());
  await open(() => page.getByRole('link', { name: 'Editar Padária São João' }).click());
  await openPurchases(page);
  await page.getByRole('button', { name: 'Excluir Padária São João' }).click();
  await expect(page.locator('dialog.ws-dialog')).toBeVisible();
  await expect(page).toHaveURL('/compras?ano=2026&mes=11');
});

test('CA-22: ordem das categorias no filtro', async ({ page, api }) => {
  await login(page, api);
  api.addCategory(ANA.email, 'Pets');
  api.addCategory(ANA.email, 'Bar');
  await openPurchases(page);
  await expect(page.locator('#f-category option')).toHaveText([
    'Todas',
    'Alimentação',
    'Transporte',
    'Moradia',
    'Saúde',
    'Educação',
    'Lazer',
    'Bar',
    'Pets',
  ]);
});

test('CA-43: endereço inválido vai para o mês atual, sem a situação', async ({ page, api }) => {
  await login(page, api);
  await page.goto('/compras?ano=2026&mes=13&situacao=X');
  await expect(page).toHaveURL('/compras?ano=2026&mes=11');
  await expect(page.locator('.ws-month-label')).toHaveText('novembro 2026');
});

test('CA-44: API fora do ar e Tentar novamente', async ({ page, api }) => {
  await login(page, api);
  addPadaria(api);
  api.fail('/purchases', 'abort');
  await page.goto('/compras?ano=2026&mes=11');
  const list = page.getByRole('region', { name: t.LABEL_LIST });
  await expect(list.getByRole('alert')).toContainText(t.MSG_CONNECTION);
  await list.getByRole('button', { name: t.LABEL_RETRY }).click();
  await expect(descriptions(page)).toHaveText(['Padária São João']);
});
