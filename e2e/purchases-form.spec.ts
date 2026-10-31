import { expect, Page, test } from '@playwright/test';

import { CONTRACT, mockApi } from './support/api-mock';
import {
  GLOBAL_CATEGORIES,
  GLOBAL_PAYMENT_METHODS,
  mockPurchasesApi,
  PERSONAL_CATEGORIES,
  PurchaseSeed,
  PurchasesMockOptions,
} from './support/purchases-mock';
import { seedSession } from './support/session';
import {
  DISCARD_DIALOG_TITLE,
  LABEL_AMOUNT,
  LABEL_CANCEL,
  LABEL_CATEGORY,
  LABEL_DATE,
  LABEL_DELETE,
  LABEL_DESCRIPTION,
  LABEL_DISCARD,
  LABEL_HOME,
  LABEL_KEEP_EDITING,
  LABEL_MAIN_NAV,
  LABEL_NEW_PURCHASE,
  LABEL_PAYMENT_METHOD,
  LABEL_RETRY,
  LABEL_SAVE,
  LABEL_SAVE_AND_NEW,
  LABEL_STATUS,
  MSG_AMOUNT_MAX,
  MSG_AMOUNT_POSITIVE,
  MSG_AMOUNT_REQUIRED,
  MSG_CATEGORY_GONE,
  MSG_CATEGORY_REQUIRED,
  MSG_CONNECTION,
  MSG_DATE_INVALID,
  MSG_DATE_REQUIRED,
  MSG_DELETED,
  MSG_DESCRIPTION_MAX,
  MSG_DESCRIPTION_REQUIRED,
  MSG_NOT_FOUND,
  MSG_PAYMENT_METHOD_GONE,
  MSG_PAYMENT_METHOD_REQUIRED,
  MSG_PURCHASE_GONE,
  MSG_SAVED,
  MSG_SERVER,
  TITLE_EDIT_PURCHASE,
  savedInMonthMessage,
} from './support/texts';

test.use({ timezoneId: 'America/Sao_Paulo', locale: 'pt-BR' });

const OCTOBER = '/lancamentos?ano=2026&mes=10';
const SEPTEMBER = '/lancamentos?ano=2026&mes=9';

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

type Mock = Awaited<ReturnType<typeof setup>>;

// Por papel, e não por `getByLabel`: o painel do calendário também é rotulado por "Data" enquanto está aberto.
const field = (page: Page, name: string) => page.getByRole('textbox', { name, exact: true });
const combobox = (page: Page, name: string) => page.getByRole('combobox', { name, exact: true });
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const discardDialog = (page: Page) => page.getByRole('alertdialog', { name: DISCARD_DIALOG_TITLE });
const dataRows = (page: Page) => page.getByRole('row').filter({ has: page.getByRole('cell') });

/** Opção escolhida do `<select>` nativo. */
const chosen = (page: Page, name: string) => combobox(page, name).locator('option:checked');
/** Opções que a pessoa vê (sem o vazio `hidden` dos campos obrigatórios). */
const options = (page: Page, name: string) => combobox(page, name).locator('option:not([hidden])');

async function choose(page: Page, name: string, option: string) {
  await combobox(page, name).selectOption({ label: option });
}

/** Abre a lista e clica em "Novo lançamento" (para o formulário ter a origem). */
async function newFromList(page: Page, listUrl: string) {
  await page.goto(listUrl);
  await page.getByRole('link', { name: LABEL_NEW_PURCHASE }).first().click();
  await expect(page).toHaveURL('/lancamentos/novo');
  await expect(button(page, LABEL_SAVE)).toBeVisible();
}

async function editFromList(page: Page, listUrl: string, description = 'Mercado') {
  await page.goto(listUrl);
  await dataRows(page).filter({ hasText: description }).locator('td.category').click();
  await expect(button(page, LABEL_SAVE)).toBeVisible();
}

async function fill(
  page: Page,
  { description = 'Mercado', amount = '1.234,56', category = 'Alimentação', payment = 'Pix' } = {},
) {
  await field(page, LABEL_DESCRIPTION).fill(description);
  await field(page, LABEL_AMOUNT).fill(amount);
  await choose(page, LABEL_CATEGORY, category);
  await choose(page, LABEL_PAYMENT_METHOD, payment);
}

const bodies = (mock: Mock, route: 'create' | 'update') =>
  mock.requests.filter((r) => r.route === route).map((r) => r.body);

test.describe('formulário de lançamento', () => {
  test('CA-13 novo no mês atual', async ({ page }) => {
    await setup(page, [mercado]);
    await newFromList(page, OCTOBER);
    await expect(page.getByRole('heading', { level: 1, name: LABEL_NEW_PURCHASE })).toBeVisible();
    await expect(field(page, LABEL_DATE)).toHaveValue('22/10/2026');
    await expect(chosen(page, LABEL_STATUS)).toHaveText('Pago');
    await expect(field(page, LABEL_DESCRIPTION)).toHaveValue('');
    await expect(field(page, LABEL_AMOUNT)).toHaveValue('');
    await expect(chosen(page, LABEL_CATEGORY)).toHaveText('');
    await expect(chosen(page, LABEL_PAYMENT_METHOD)).toHaveText('');
  });

  test('CA-14 novo em outro mês', async ({ page }) => {
    await setup(page);
    await newFromList(page, SEPTEMBER);
    await expect(field(page, LABEL_DATE)).toHaveValue('01/09/2026');
  });

  test('novo direto', async ({ page }) => {
    await setup(page);
    await page.goto('/lancamentos/novo');
    await expect(field(page, LABEL_DATE)).toHaveValue('22/10/2026');
    await button(page, LABEL_CANCEL).click();
    await expect(page).toHaveURL(OCTOBER);
  });

  test('CA-15 salvar', async ({ page }) => {
    const mock = await setup(page);
    await newFromList(page, `${OCTOBER}&status=PAID`);
    await fill(page);
    await button(page, LABEL_SAVE).click();
    await expect(page).toHaveURL(`${OCTOBER}&status=PAID`);
    expect(bodies(mock, 'create')).toEqual([
      {
        purchase_date: '2026-10-22',
        description: 'Mercado',
        category_id: 1,
        payment_method_id: 4,
        amount: '1234.56',
        status: 'PAID',
      },
    ]);
    await expect(page.getByText(MSG_SAVED)).toBeVisible();
    await expect(dataRows(page).filter({ hasText: 'Mercado' })).toHaveCount(1);
  });

  test('CA-16 salvo em outro mês', async ({ page }) => {
    await setup(page);
    await newFromList(page, OCTOBER);
    await field(page, LABEL_DATE).fill('10/09/2026');
    await fill(page);
    await button(page, LABEL_SAVE).click();
    await expect(page).toHaveURL(OCTOBER);
    await expect(page.getByText(savedInMonthMessage('setembro de 2026'))).toBeVisible();
  });

  test('CA-17 salvar e criar outro', async ({ page }) => {
    const mock = await setup(page);
    await newFromList(page, SEPTEMBER);
    await fill(page);
    await button(page, LABEL_SAVE_AND_NEW).click();
    await expect(page.getByText(MSG_SAVED)).toBeVisible();
    expect(mock.calls.create).toBe(1);
    await expect(page).toHaveURL('/lancamentos/novo');
    await expect(field(page, LABEL_DATE)).toHaveValue('01/09/2026');
    await expect(chosen(page, LABEL_CATEGORY)).toHaveText('Alimentação');
    await expect(chosen(page, LABEL_PAYMENT_METHOD)).toHaveText('Pix');
    await expect(chosen(page, LABEL_STATUS)).toHaveText('Pago');
    await expect(field(page, LABEL_DESCRIPTION)).toHaveValue('');
    await expect(field(page, LABEL_AMOUNT)).toHaveValue('');
    await expect(field(page, LABEL_DESCRIPTION)).toBeFocused();

    await field(page, LABEL_DESCRIPTION).fill('Padaria');
    await field(page, LABEL_AMOUNT).fill('12,00');
    await button(page, LABEL_SAVE).click();
    await expect(page).toHaveURL(SEPTEMBER);
    expect(mock.calls.create).toBe(2);
  });

  test('CA-18 validações', async ({ page }) => {
    const mock = await setup(page);
    await page.goto('/lancamentos/novo');
    await fill(page);
    const cases: [string, string, string][] = [
      [LABEL_DESCRIPTION, '   ', MSG_DESCRIPTION_REQUIRED],
      [LABEL_AMOUNT, '0', MSG_AMOUNT_POSITIVE],
      [LABEL_AMOUNT, '100.000.000,00', MSG_AMOUNT_MAX],
      [LABEL_DESCRIPTION, 'a'.repeat(256), MSG_DESCRIPTION_MAX],
    ];
    for (const [label, value, message] of cases) {
      await field(page, LABEL_DESCRIPTION).fill('Mercado');
      await field(page, LABEL_AMOUNT).fill('1.234,56');
      await field(page, label).fill(value);
      await button(page, LABEL_SAVE).click();
      await expect(page.getByText(message)).toBeVisible();
    }
    expect(mock.calls.create).toBe(0);
  });

  test('campos obrigatórios', async ({ page }) => {
    const mock = await setup(page);
    await page.goto('/lancamentos/novo');
    await field(page, LABEL_DATE).fill('');
    await button(page, LABEL_SAVE).click();
    for (const message of [
      MSG_DATE_REQUIRED,
      MSG_DESCRIPTION_REQUIRED,
      MSG_AMOUNT_REQUIRED,
      MSG_CATEGORY_REQUIRED,
      MSG_PAYMENT_METHOD_REQUIRED,
    ]) {
      await expect(page.getByText(message)).toBeVisible();
    }
    expect(mock.calls.create).toBe(0);
  });

  test('CA-19 terceira casa', async ({ page }) => {
    await setup(page);
    await page.goto('/lancamentos/novo');
    await field(page, LABEL_AMOUNT).pressSequentially('10,555');
    await expect(field(page, LABEL_AMOUNT)).toHaveValue('10,55');
  });

  test('datas', async ({ page }) => {
    await setup(page);
    await page.goto('/lancamentos/novo');
    const date = field(page, LABEL_DATE);
    await date.fill('31/02/2026');
    await date.press('Tab');
    await expect(page.getByText(MSG_DATE_INVALID)).toBeVisible();
    await date.fill('5/10/2026');
    await date.press('Tab');
    await expect(date).toHaveValue('05/10/2026');
    await expect(page.getByText(MSG_DATE_INVALID)).toHaveCount(0);
  });

  test('calendário', async ({ page }) => {
    await setup(page);
    await page.goto('/lancamentos/novo');
    await button(page, 'Abrir calendário').click();
    await page.getByRole('button', { name: '15 de outubro de 2026' }).click();
    await expect(field(page, LABEL_DATE)).toHaveValue('15/10/2026');
  });

  test('CA-20 trim', async ({ page }) => {
    const mock = await setup(page);
    await page.goto('/lancamentos/novo');
    await fill(page, { description: '  Mercado  ' });
    await button(page, LABEL_SAVE).click();
    await expect(page).toHaveURL(OCTOBER);
    expect((bodies(mock, 'create')[0] as { description: string }).description).toBe('Mercado');
  });

  test('CA-21 envio único', async ({ page }) => {
    const mock = await setup(page, [], { delayMs: { create: 500 } });
    await page.goto('/lancamentos/novo');
    await fill(page);
    await button(page, LABEL_SAVE).dblclick();
    await expect(button(page, LABEL_SAVE)).toBeDisabled();
    await field(page, LABEL_DESCRIPTION).press('Enter');
    await expect(page).toHaveURL(OCTOBER);
    expect(mock.calls.create).toBe(1);
  });

  test('CA-22 editar status', async ({ page }) => {
    const mock = await setup(page, [mercado]);
    await editFromList(page, OCTOBER);
    await choose(page, LABEL_STATUS, 'Pendente');
    await button(page, LABEL_SAVE).click();
    await expect(page).toHaveURL(OCTOBER);
    expect(bodies(mock, 'update')).toEqual([
      {
        purchase_date: '2026-10-05',
        description: 'Mercado',
        category_id: 1,
        payment_method_id: 4,
        amount: '1234.56',
        status: 'PENDING',
      },
    ]);
    await expect(dataRows(page).filter({ hasText: 'Mercado' })).toContainText('Pendente');
    await expect(page.getByText(MSG_SAVED)).toBeVisible();
  });

  test('RF-23 edição carrega', async ({ page }) => {
    await setup(page, [{ ...mercado, amount: '1234.50', status: 'CANCELED' }]);
    await page.goto('/lancamentos/42');
    await expect(page.getByRole('heading', { level: 1, name: TITLE_EDIT_PURCHASE })).toBeVisible();
    await expect(field(page, LABEL_DATE)).toHaveValue('05/10/2026');
    await expect(field(page, LABEL_AMOUNT)).toHaveValue('1.234,50');
    await expect(chosen(page, LABEL_PAYMENT_METHOD)).toHaveText('Pix');
    await expect(chosen(page, LABEL_STATUS)).toHaveText('Cancelado');
  });

  test('CA-23 Cancelar com alteração', async ({ page }) => {
    await setup(page);
    await newFromList(page, SEPTEMBER);
    await field(page, LABEL_DESCRIPTION).fill('Mercado');
    await button(page, LABEL_CANCEL).click();
    await expect(discardDialog(page)).toBeVisible();
    await discardDialog(page).getByRole('button', { name: LABEL_KEEP_EDITING }).click();
    await expect(discardDialog(page)).toHaveCount(0);
    await expect(page).toHaveURL('/lancamentos/novo');
    await expect(field(page, LABEL_DESCRIPTION)).toHaveValue('Mercado');

    await button(page, LABEL_CANCEL).click();
    await discardDialog(page).getByRole('button', { name: LABEL_DISCARD }).click();
    await expect(page).toHaveURL(SEPTEMBER);
  });

  test('CA-23 voltar do navegador', async ({ page }) => {
    await setup(page);
    await newFromList(page, SEPTEMBER);
    await field(page, LABEL_DESCRIPTION).fill('Mercado');
    await page.goBack();
    await expect(discardDialog(page)).toBeVisible();
    await discardDialog(page).getByRole('button', { name: LABEL_KEEP_EDITING }).click();
    await expect(page).toHaveURL('/lancamentos/novo');
    await expect(field(page, LABEL_DESCRIPTION)).toHaveValue('Mercado');

    await page.goBack();
    await discardDialog(page).getByRole('button', { name: LABEL_DISCARD }).click();
    await expect(page).toHaveURL(SEPTEMBER);

    // O histórico ficou certo: a entrada da frente é o formulário, que abre de novo vazio (sem o texto descartado).
    await page.goForward();
    await expect(page).toHaveURL('/lancamentos/novo');
    await expect(button(page, LABEL_SAVE)).toBeVisible();
    await expect(field(page, LABEL_DESCRIPTION)).toHaveValue('');
  });

  test('CA-23 menu', async ({ page }) => {
    await setup(page);
    await page.goto('/lancamentos/novo');
    await field(page, LABEL_DESCRIPTION).fill('Mercado');
    await page
      .getByRole('navigation', { name: LABEL_MAIN_NAV })
      .getByRole('link', { name: LABEL_HOME })
      .click();
    await expect(discardDialog(page)).toBeVisible();
    await discardDialog(page).getByRole('button', { name: LABEL_DISCARD }).click();
    await expect(page).toHaveURL('/');
  });

  test('CA-24 sem alteração', async ({ page }) => {
    await setup(page);
    await newFromList(page, SEPTEMBER);
    await button(page, LABEL_CANCEL).click();
    await expect(page).toHaveURL(SEPTEMBER);
    await expect(discardDialog(page)).toHaveCount(0);
  });

  test('alterou e desfez', async ({ page }) => {
    await setup(page);
    await newFromList(page, SEPTEMBER);
    await field(page, LABEL_DESCRIPTION).fill('Mercado');
    await field(page, LABEL_DESCRIPTION).fill('');
    await button(page, LABEL_CANCEL).click();
    await expect(page).toHaveURL(SEPTEMBER);
    await expect(discardDialog(page)).toHaveCount(0);
  });

  test('CA-25 fechar a aba com alteração', async ({ page }) => {
    await setup(page);
    await page.goto('/lancamentos/novo');
    // O Chromium só mostra o aviso de saída depois de uma interação real com a página.
    await field(page, LABEL_DESCRIPTION).click();
    await field(page, LABEL_DESCRIPTION).pressSequentially('Mercado');
    const dialog = page.waitForEvent('dialog');
    await page.close({ runBeforeUnload: true });
    const shown = await dialog;
    expect(shown.type()).toBe('beforeunload');
    await shown.dismiss();
  });

  test('CA-25 fechar a aba sem alteração', async ({ page }) => {
    await setup(page);
    await page.goto('/lancamentos/novo');
    await field(page, LABEL_DESCRIPTION).click();
    let dialogs = 0;
    page.on('dialog', (d) => {
      dialogs++;
      void d.dismiss();
    });
    const closed = page.waitForEvent('close');
    await page.close({ runBeforeUnload: true });
    await closed;
    expect(dialogs).toBe(0);
  });

  test('excluir pela edição', async ({ page }) => {
    await setup(page, [mercado]);
    await editFromList(page, SEPTEMBER.replace('mes=9', 'mes=10'));
    await field(page, LABEL_DESCRIPTION).fill('Outro');
    await button(page, LABEL_DELETE).click();
    await page.getByRole('alertdialog').getByRole('button', { name: LABEL_DELETE }).click();
    await expect(page).toHaveURL(OCTOBER);
    await expect(page.getByText(MSG_DELETED)).toBeVisible();
    await expect(discardDialog(page)).toHaveCount(0);
  });

  test('CA-29 lançamento excluído em outra aba', async ({ page }) => {
    const mock = await setup(page, [mercado]);
    await editFromList(page, OCTOBER);
    mock.user('A1').purchases = [];
    await button(page, LABEL_SAVE).click();
    await expect(page).toHaveURL(OCTOBER);
    await expect(page.getByText(MSG_PURCHASE_GONE)).toBeVisible();
    await expect(discardDialog(page)).toHaveCount(0);
  });

  test('CA-30 categoria excluída', async ({ page }) => {
    const mock = await setup(page, [], {
      users: { A1: { categories: [...GLOBAL_CATEGORIES, ...PERSONAL_CATEGORIES] } },
    });
    await page.goto('/lancamentos/novo');
    await fill(page, { category: 'Academia' });
    mock.user('A1').categories = mock.user('A1').categories.filter((c) => c.id !== 31);
    await button(page, LABEL_SAVE).click();
    await expect(page.getByText(MSG_CATEGORY_GONE)).toBeVisible();
    await expect(page).toHaveURL('/lancamentos/novo');
    await expect(chosen(page, LABEL_CATEGORY)).toHaveText('');
    await expect(field(page, LABEL_DESCRIPTION)).toHaveValue('Mercado');
    await expect(field(page, LABEL_AMOUNT)).toHaveValue('1.234,56');
    await expect(options(page, LABEL_CATEGORY)).toHaveCount(7);
    await expect(options(page, LABEL_CATEGORY).filter({ hasText: 'Academia' })).toHaveCount(0);
  });

  test('CA-30 forma excluída', async ({ page }) => {
    const voucher = { id: 41, name: 'Vale-refeição', is_global: false };
    const mock = await setup(page, [], {
      users: { A1: { paymentMethods: [...GLOBAL_PAYMENT_METHODS, voucher] } },
    });
    await page.goto('/lancamentos/novo');
    await fill(page, { payment: 'Vale-refeição' });
    mock.user('A1').paymentMethods = mock.user('A1').paymentMethods.filter((p) => p.id !== 41);
    await button(page, LABEL_SAVE).click();
    await expect(page.getByText(MSG_PAYMENT_METHOD_GONE)).toBeVisible();
    await expect(chosen(page, LABEL_PAYMENT_METHOD)).toHaveText('');
  });

  test('404 de instância antiga', async ({ page }) => {
    await setup(page, [], {
      override: {
        create: { status: 404, body: { code: 'NOT_FOUND', message: 'purchase not found' } },
      },
    });
    await page.goto('/lancamentos/novo');
    await fill(page);
    await button(page, LABEL_SAVE).click();
    await expect(page.getByRole('alert').filter({ hasText: MSG_SERVER })).toBeVisible();
    await expect(field(page, LABEL_DESCRIPTION)).toHaveValue('Mercado');
    await expect(page).toHaveURL('/lancamentos/novo');
  });

  test('CA-31 inexistente', async ({ page }) => {
    const mock = await setup(page);
    await page.goto('/lancamentos/999999');
    await expect(page).toHaveURL(OCTOBER);
    await expect(page.getByText(MSG_NOT_FOUND)).toBeVisible();

    const gets = mock.calls.get;
    await page.goto('/lancamentos/abc');
    await expect(page).toHaveURL(OCTOBER);
    await expect(page.getByText(MSG_NOT_FOUND)).toBeVisible();
    expect(mock.calls.get).toBe(gets);
  });

  test('CA-33 salvar sem API', async ({ page }) => {
    await setup(page, [], { override: { create: 'abort' } });
    await page.goto('/lancamentos/novo');
    await fill(page);
    await button(page, LABEL_SAVE).click();
    await expect(page.getByRole('alert').filter({ hasText: MSG_CONNECTION })).toBeVisible();
    await expect(field(page, LABEL_DESCRIPTION)).toHaveValue('Mercado');
    await expect(field(page, LABEL_AMOUNT)).toHaveValue('1.234,56');
  });

  test('opções não carregam', async ({ page }) => {
    const mock = await setup(page, [], {
      override: {
        categories: {
          status: 500,
          body: { code: 'INTERNAL_SERVER_ERROR', message: 'internal server error' },
        },
      },
    });
    await page.goto('/lancamentos/novo');
    await expect(page.getByRole('alert')).toHaveText(MSG_SERVER);
    await expect(button(page, LABEL_SAVE)).toHaveCount(0);
    delete mock.options.override!.categories;
    await button(page, LABEL_RETRY).click();
    await expect(button(page, LABEL_SAVE)).toBeVisible();
  });

  test('CA-35 categorias', async ({ page }) => {
    await setup(page, [], {
      users: { A1: { categories: [...GLOBAL_CATEGORIES, ...PERSONAL_CATEGORIES] } },
    });
    await page.goto('/lancamentos/novo');
    await expect(options(page, LABEL_CATEGORY)).toHaveText([
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
