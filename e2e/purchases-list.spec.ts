import { expect, Page, test } from '@playwright/test';

import { CONTRACT, mockApi } from './support/api-mock';
import { horizontalOverflow } from './support/layout';
import {
  GLOBAL_CATEGORIES,
  mockPurchasesApi,
  PERSONAL_CATEGORIES,
  PurchaseSeed,
  PurchasesMockOptions,
  seeds,
} from './support/purchases-mock';
import { seedSession } from './support/session';
import {
  DELETE_DIALOG_TITLE,
  DELETE_DIALOG_WARNING,
  LABEL_CANCEL,
  LABEL_CATEGORY,
  LABEL_CLEAR_FILTERS,
  LABEL_CURRENT_MONTH,
  LABEL_DELETE,
  LABEL_HOME,
  LABEL_MAIN_NAV,
  LABEL_NEW_PURCHASE,
  LABEL_NEXT_PAGE,
  LABEL_PAYMENT_METHOD,
  LABEL_PREVIOUS_MONTH,
  LABEL_PURCHASES,
  LABEL_RETRY,
  LABEL_STATUS,
  MSG_CONNECTION,
  MSG_DELETED,
  MSG_EMPTY_FILTERED,
  MSG_SERVER,
  TITLE_EDIT_PURCHASE,
  emptyMonthMessage,
  pickMonthLabel,
} from './support/texts';

test.use({ timezoneId: 'America/Sao_Paulo', locale: 'pt-BR' });

const OCTOBER = '/lancamentos?ano=2026&mes=10';

const mercado: PurchaseSeed = {
  id: 42,
  date: '2026-10-05',
  description: 'Mercado',
  amount: '1234.56',
  status: 'PAID',
  categoryId: 1,
  paymentMethodId: 4,
};

async function setup(
  page: Page,
  purchases: PurchaseSeed[] = [],
  options: PurchasesMockOptions = {},
) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.clock.setFixedTime(new Date('2026-10-22T12:00:00-03:00'));
  await mockApi(page, { logout: CONTRACT.loggedOut });
  const mock = await mockPurchasesApi(page, { users: { A1: { purchases } }, ...options });
  await seedSession(page);
  return mock;
}

const nav = (page: Page) => page.getByRole('navigation', { name: LABEL_MAIN_NAV });
const dataRows = (page: Page) => page.getByRole('row').filter({ has: page.getByRole('cell') });
const rangeLabel = (page: Page) => page.locator('.mat-mdc-paginator-range-label');
const combobox = (page: Page, name: string) => page.getByRole('combobox', { name });

async function choose(page: Page, field: string, option: string) {
  await combobox(page, field).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

const listUrls = (mock: Awaited<ReturnType<typeof setup>>) =>
  mock.requests.filter((r) => r.route === 'list').map((r) => r.url.search);

test.describe('lista de lançamentos', () => {
  test('CA-01 menu', async ({ page }) => {
    await setup(page);
    await page.goto('/');
    const links = nav(page).getByRole('link');
    await expect(links).toHaveCount(2);
    await expect(links.nth(0)).toHaveAccessibleName(LABEL_HOME);
    await expect(links.nth(1)).toHaveAccessibleName(LABEL_PURCHASES);

    await links.nth(1).click();
    await expect(page).toHaveURL(OCTOBER);
    await expect(links.nth(1)).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { level: 1, name: LABEL_PURCHASES })).toBeVisible();
  });

  test('destaque nas três rotas', async ({ page }) => {
    await setup(page, [{ ...mercado, id: 1001 }]);
    for (const url of ['/lancamentos/novo', '/lancamentos/1001']) {
      await page.goto(url);
      const links = nav(page).getByRole('link');
      await expect(links.nth(1)).toHaveAttribute('aria-current', 'page');
      await expect(links.nth(0)).not.toHaveAttribute('aria-current', 'page');
    }
  });

  test('CA-02 mês atual', async ({ page }) => {
    const mock = await setup(page, [
      ...seeds(2, { id: 1, date: '2026-09-10', description: 'Setembro' }),
      ...seeds(2, { id: 10, date: '2026-10-10', description: 'Outubro' }),
    ]);
    await page.goto('/lancamentos');
    await expect(page).toHaveURL(OCTOBER);
    await expect(dataRows(page)).toHaveCount(2);
    await expect(dataRows(page).nth(0)).toContainText('Outubro');
    await expect(page.getByText('Setembro')).toHaveCount(0);
    await expect(page.getByRole('button', { name: pickMonthLabel('outubro de 2026') })).toHaveText(
      'outubro de 2026',
    );
    await expect(page.getByRole('button', { name: LABEL_CURRENT_MONTH })).toHaveCount(0);
    expect(listUrls(mock).at(-1)).toContain('year=2026&month=10');
  });

  test('CA-03 mês anterior e Mês atual', async ({ page }) => {
    await setup(page, [
      ...seeds(2, { id: 1, date: '2026-09-10', description: 'Setembro' }),
      ...seeds(2, { id: 10, date: '2026-10-10', description: 'Outubro' }),
    ]);
    await page.goto(OCTOBER);
    await expect(dataRows(page)).toHaveCount(2);
    await page.getByRole('button', { name: LABEL_PREVIOUS_MONTH }).click();
    await expect(page).toHaveURL('/lancamentos?ano=2026&mes=9');
    await expect(dataRows(page).nth(0)).toContainText('Setembro');
    const current = page.getByRole('button', { name: LABEL_CURRENT_MONTH });
    await expect(current).toBeVisible();
    await current.click();
    await expect(page).toHaveURL(OCTOBER);
    await expect(current).toHaveCount(0);
  });

  test('CA-04 seletor', async ({ page }) => {
    const mock = await setup(page);
    await page.goto(OCTOBER);
    await page.getByRole('button', { name: pickMonthLabel('outubro de 2026') }).click();
    await page.getByRole('button', { name: '2025', exact: true }).click();
    await page.getByRole('button', { name: 'março de 2025', exact: true }).click();
    await expect(page).toHaveURL('/lancamentos?ano=2025&mes=3');
    await expect(page.getByRole('button', { name: pickMonthLabel('março de 2025') })).toHaveText(
      'março de 2025',
    );
    await expect(page.locator('mat-calendar')).toHaveCount(0);
    await expect.poll(() => listUrls(mock).at(-1)).toContain('year=2025&month=3');
  });

  test('CA-05 filtro de status', async ({ page }) => {
    await setup(page, [
      ...seeds(13, { id: 1, date: '2026-10-10', status: 'PENDING', description: 'Pendente' }),
      ...seeds(12, { id: 100, date: '2026-10-11', status: 'PAID', description: 'Pago' }),
    ]);
    await page.goto(`${OCTOBER}&pagina=2`);
    await expect(dataRows(page)).toHaveCount(5);
    await choose(page, LABEL_STATUS, 'Pendente');
    await expect(page).toHaveURL(`${OCTOBER}&status=PENDING`);
    await expect(dataRows(page)).toHaveCount(13);
    for (const cell of await page.locator('td.status').all()) {
      await expect(cell).toHaveText('Pendente');
    }
    const clear = page.getByRole('button', { name: LABEL_CLEAR_FILTERS });
    await expect(clear).toBeVisible();
    await clear.click();
    await expect(page).toHaveURL(OCTOBER);
  });

  test('CA-06 filtros ao trocar de mês', async ({ page }) => {
    await setup(page, [mercado]);
    await page.goto(OCTOBER);
    await choose(page, LABEL_CATEGORY, 'Alimentação');
    await expect(page).toHaveURL(`${OCTOBER}&categoria=1`);
    await choose(page, LABEL_PAYMENT_METHOD, 'Pix');
    await expect(page).toHaveURL(`${OCTOBER}&categoria=1&forma=4`);
    await page.getByRole('button', { name: LABEL_PREVIOUS_MONTH }).click();
    await expect(page).toHaveURL('/lancamentos?ano=2026&mes=9&categoria=1&forma=4');
    await expect(combobox(page, LABEL_CATEGORY)).toContainText('Alimentação');
    await expect(combobox(page, LABEL_PAYMENT_METHOD)).toContainText('Pix');
  });

  test('CA-07 paginador', async ({ page }) => {
    const mock = await setup(page, seeds(47, { date: '2026-10-10' }));
    await page.goto(OCTOBER);
    await expect(dataRows(page)).toHaveCount(20);
    await expect(rangeLabel(page)).toHaveText('1–20 de 47');
    await page.getByRole('button', { name: LABEL_NEXT_PAGE }).click();
    await expect(page).toHaveURL(`${OCTOBER}&pagina=2`);
    await expect(rangeLabel(page)).toHaveText('21–40 de 47');

    mock.user('A1').purchases = seeds(15, { date: '2026-10-10' });
    await page.goto(OCTOBER);
    await expect(dataRows(page)).toHaveCount(15);
    await expect(page.locator('mat-paginator')).toHaveCount(0);
  });

  test('CA-08 recarregar', async ({ page }) => {
    await setup(page, seeds(25, { date: '2026-09-10', status: 'PENDING' }));
    const url = '/lancamentos?ano=2026&mes=9&status=PENDING&pagina=2';
    await page.goto(url);
    await expect(rangeLabel(page)).toHaveText('21–25 de 25');
    const before = await page.locator('td.description').allTextContents();
    await page.reload();
    await expect(page).toHaveURL(url);
    await expect(rangeLabel(page)).toHaveText('21–25 de 25');
    await expect(combobox(page, LABEL_STATUS)).toContainText('Pendente');
    expect(await page.locator('td.description').allTextContents()).toEqual(before);
  });

  test('CA-09 tabela e itens', async ({ page }) => {
    await setup(page, [mercado]);
    await page.goto(OCTOBER);
    await expect(page.getByRole('columnheader')).toHaveText([
      'Data',
      'Descrição',
      'Categoria',
      'Forma de pagamento',
      'Valor',
      'Status',
      'Ações',
    ]);

    await page.setViewportSize({ width: 360, height: 640 });
    await expect(page.locator('table')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Excluir Mercado' })).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });

  test('CA-10 formatos', async ({ page }) => {
    await setup(page, [mercado]);
    await page.goto(OCTOBER);
    const row = dataRows(page).nth(0);
    await expect(row).toContainText('05/10/2026');
    await expect(row).toContainText('R$ 1.234,56');
  });

  test('CA-11 cancelado', async ({ page }) => {
    await setup(page, [{ ...mercado, status: 'CANCELED' }]);
    await page.goto(OCTOBER);
    const row = dataRows(page).nth(0);
    await expect(row).toContainText('Cancelado');
    await expect(row.locator('td.amount')).toHaveCSS('text-decoration-line', 'line-through');
  });

  test('CA-12 vazios', async ({ page }) => {
    await setup(page);
    await page.goto(OCTOBER);
    const empty = page.getByRole('status').filter({ hasText: 'Nenhum lançamento' });
    await expect(empty).toContainText(emptyMonthMessage('outubro de 2026'));
    await expect(empty.getByRole('link', { name: LABEL_NEW_PURCHASE })).toHaveAttribute(
      'href',
      '/lancamentos/novo',
    );

    await page.goto(`${OCTOBER}&status=CANCELED`);
    await expect(empty).toContainText(MSG_EMPTY_FILTERED);
    await expect(empty.getByRole('button', { name: LABEL_CLEAR_FILTERS })).toBeVisible();
  });

  test('RF-09 clique na linha', async ({ page }) => {
    await setup(page, [mercado]);
    await page.goto(OCTOBER);
    await dataRows(page).nth(0).locator('td.category').click();
    await expect(page).toHaveURL('/lancamentos/42');
    await expect(page.getByRole('heading', { level: 1, name: TITLE_EDIT_PURCHASE })).toBeVisible();
  });

  test('CA-26 excluir', async ({ page }) => {
    const mock = await setup(page, [mercado, { ...mercado, id: 41, description: 'Padaria' }]);
    await page.goto(OCTOBER);
    await page.getByRole('button', { name: 'Excluir Mercado' }).click();
    const dialog = page.getByRole('alertdialog', { name: DELETE_DIALOG_TITLE });
    await expect(dialog).toContainText('Mercado');
    await expect(dialog).toContainText('05/10/2026');
    await expect(dialog).toContainText('R$ 1.234,56');
    await expect(dialog).toContainText(DELETE_DIALOG_WARNING);
    await dialog.getByRole('button', { name: LABEL_CANCEL }).click();
    await expect(dialog).toHaveCount(0);
    expect(mock.calls.delete).toBe(0);
    await expect(dataRows(page)).toHaveCount(2);

    await page.getByRole('button', { name: 'Excluir Mercado' }).click();
    await dialog.getByRole('button', { name: LABEL_DELETE }).click();
    await expect(page.getByText(MSG_DELETED)).toBeVisible();
    await expect(dataRows(page)).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Excluir Mercado' })).toHaveCount(0);
    expect(mock.calls.delete).toBe(1);
  });

  test('CA-27 único da página 3', async ({ page }) => {
    await setup(page, seeds(41, { date: '2026-10-10' }));
    await page.goto(`${OCTOBER}&pagina=3`);
    await expect(dataRows(page)).toHaveCount(1);
    await page.getByRole('button', { name: /^Excluir / }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: LABEL_DELETE }).click();
    await expect(page).toHaveURL(`${OCTOBER}&pagina=2`);
    await expect(rangeLabel(page)).toHaveText('21–40 de 40');
  });

  test('CA-28 já excluído', async ({ page }) => {
    const mock = await setup(page, [mercado], {
      override: {
        delete: { status: 404, body: { code: 'NOT_FOUND', message: 'purchase not found' } },
      },
    });
    await page.goto(OCTOBER);
    await expect(dataRows(page)).toHaveCount(1);
    const listsBefore = mock.calls.list;
    await page.getByRole('button', { name: 'Excluir Mercado' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: LABEL_DELETE }).click();
    await expect(page.getByText(MSG_DELETED)).toBeVisible();
    await expect.poll(() => mock.calls.list).toBe(listsBefore + 1);
  });

  test('excluir sem servidor', async ({ page }) => {
    await setup(page, [mercado], {
      override: {
        delete: {
          status: 500,
          body: { code: 'INTERNAL_SERVER_ERROR', message: 'internal server error' },
        },
      },
    });
    await page.goto(OCTOBER);
    await page.getByRole('button', { name: 'Excluir Mercado' }).click();
    const dialog = page.getByRole('alertdialog');
    await dialog.getByRole('button', { name: LABEL_DELETE }).click();
    await expect(dialog.getByRole('alert')).toHaveText(MSG_SERVER);
    await expect(dialog.getByRole('button', { name: LABEL_DELETE })).toBeEnabled();
  });

  test('CA-32 endereço inválido', async ({ page }) => {
    const mock = await setup(page);
    await page.goto('/lancamentos?mes=13&ano=2026&status=X');
    await expect(page).toHaveURL(OCTOBER);
    await expect(page.getByText(emptyMonthMessage('outubro de 2026'))).toBeVisible();
    expect(listUrls(mock).some((search) => search.includes('month=13'))).toBe(false);
    expect(listUrls(mock).some((search) => search.includes('status=X'))).toBe(false);
  });

  test('categoria inexistente', async ({ page }) => {
    await setup(page);
    await page.goto(`${OCTOBER}&categoria=999`);
    await expect(page).toHaveURL(OCTOBER);
  });

  test('página além da última', async ({ page }) => {
    await setup(page, seeds(47, { date: '2026-10-10' }));
    await page.goto(`${OCTOBER}&pagina=9`);
    await expect(page).toHaveURL(`${OCTOBER}&pagina=3`);
    await expect(rangeLabel(page)).toHaveText('41–47 de 47');
  });

  test('CA-33 lista sem API', async ({ page }) => {
    const mock = await setup(page, [mercado], { override: { list: 'abort' } });
    await page.goto(OCTOBER);
    await expect(page.getByRole('alert')).toHaveText(MSG_CONNECTION);
    delete mock.options.override!.list;
    await page.getByRole('button', { name: LABEL_RETRY }).click();
    await expect(dataRows(page)).toHaveCount(1);
  });

  test('carregando', async ({ page }) => {
    await setup(page, [mercado], { delayMs: { list: 1000 } });
    await page.goto(OCTOBER);
    await expect(page.getByRole('progressbar')).toBeVisible();
    await expect(dataRows(page)).toHaveCount(1);
    await expect(page.getByRole('progressbar')).toHaveCount(0);
  });

  test('CA-35 filtro de categoria', async ({ page }) => {
    await setup(page, [], {
      users: { A1: { categories: [...GLOBAL_CATEGORIES, ...PERSONAL_CATEGORIES] } },
    });
    await page.goto(OCTOBER);
    await combobox(page, LABEL_CATEGORY).click();
    await expect(page.getByRole('option')).toHaveText([
      'Todas',
      'Academia',
      'Alimentação',
      'Educação',
      'Lazer',
      'Moradia',
      'Pets',
      'Saúde',
      'Transporte',
    ]);
  });
});
