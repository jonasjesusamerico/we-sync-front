import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { JONAS, openDialog, openSettings } from './support/settings';
import * as t from './support/texts';

const s = t.settings;
const cat = s.CATALOG_TEXTS.category;
const pay = s.CATALOG_TEXTS.payment;
const CATEGORIES_URL = '/configuracoes/categorias';
const PAYMENTS_URL = '/configuracoes/formas-de-pagamento';

const row = (page: Page, name: string) =>
  page.locator('#tab-categorias, #tab-pagamentos').locator('li.ws-tx', {
    has: page.locator('.ws-tx-title', { hasText: new RegExp(`^${name}$`) }),
  });
const titles = (page: Page) =>
  page.locator('.ws-card').nth(1).locator(':scope > ul > li .ws-tx-title');

async function createCategory(page: Page, name: string, icon?: string, color?: string) {
  await page.locator('#cat-name').fill(name);
  if (icon) await page.locator(`label[for=ci-${icon}]`).click();
  if (color) await page.locator(`label[for=cc-${color}]`).click();
  await page.getByRole('button', { name: cat.submit }).click();
}

test('CA-15: criar Pets com ícone e cor, acima das padrão', async ({ page, api }) => {
  await openSettings(page, api, JONAS, CATEGORIES_URL);
  await expect(titles(page)).toHaveCount(6);
  await createCategory(page, 'Pets', 'HEART', 'LEISURE');
  await expect(page.locator('.ws-toast')).toContainText(cat.toastAdded);
  await expect(titles(page)).toHaveText([
    'Pets',
    'Alimentação',
    'Transporte',
    'Moradia',
    'Saúde',
    'Educação',
    'Lazer',
  ]);
  const pets = row(page, 'Pets');
  await expect(pets.locator('.ws-tag.is-primary')).toHaveText(s.TAG_OWN);
  await expect(pets.locator('ws-category-bubble')).toHaveAttribute(
    'style',
    /--cat: var\(--ws-cat-leisure\)/,
  );
  await expect(page.locator('#cat-name')).toHaveValue('');
  await expect(page.locator('#ci-TAG')).toBeChecked();
  await expect(page.locator('#cc-FOOD')).toBeChecked();
  expect(api.catalogOf(JONAS.email).categories).toMatchObject([
    { name: 'Pets', icon: 'HEART', color: 'LEISURE' },
  ]);
});

test('CA-16: nome de padrão e de própria repetidos', async ({ page, api }) => {
  api.addUser(JONAS);
  api.addCategory(JONAS.email, 'Pets', { icon: 'HEART', color: 'LEISURE' });
  await openSettings(page, api, JONAS, CATEGORIES_URL);
  for (const name of ['saude', 'SAÚDE', ' Saúde ']) {
    await createCategory(page, name);
    await expect(page.locator('#cat-name-error')).toHaveText(cat.errDefaultName);
    await expect(page.locator('#cat-name')).toBeFocused();
  }
  await createCategory(page, 'pets');
  await expect(page.locator('#cat-name-error')).toHaveText(cat.errOwnName);
  expect(api.catalogOf(JONAS.email).categories).toHaveLength(1);
});

test('CA-17: vazio e 41 caracteres', async ({ page, api }) => {
  await openSettings(page, api, JONAS, CATEGORIES_URL);
  await createCategory(page, '   ');
  await expect(page.locator('#cat-name-error')).toHaveText(s.ERR_CATALOG_NAME_REQUIRED);
  expect(api.requests('/categories').filter((r) => r.method === 'POST')).toHaveLength(0);
  await page.locator('#cat-name').fill('');
  await page.locator('#cat-name').pressSequentially('a'.repeat(41));
  await expect(page.locator('#cat-name')).toHaveValue('a'.repeat(40));
});

test('CA-22: editar para o nome de uma arquivada', async ({ page, api }) => {
  api.addUser(JONAS);
  api.addCategory(JONAS.email, 'Pets', { icon: 'HEART', color: 'LEISURE' });
  api.addCategory(JONAS.email, 'Bar', { archived: true });
  await openSettings(page, api, JONAS, CATEGORIES_URL);
  await page.getByRole('button', { name: 'Editar Pets' }).click();
  await expect(page.locator('#edit-name')).toBeFocused();
  await page.locator('#edit-name').fill('bar');
  await openDialog(page).getByRole('button', { name: s.SAVE, exact: true }).click();
  await expect(page.locator('#edit-name-error')).toHaveText(cat.errArchivedName);
  await expect(openDialog(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(openDialog(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Editar Pets' })).toBeFocused();
});

test('CA-18 e CA-21: arquivar, reativar e recriar com outro ícone', async ({ page, api }) => {
  api.addUser(JONAS);
  api.addCategory(JONAS.email, 'Pets', { icon: 'HEART', color: 'LEISURE' });
  await openSettings(page, api, JONAS, CATEGORIES_URL);
  await expect(page.locator('details.ws-archived')).toHaveCount(0);

  await page.getByRole('button', { name: 'Arquivar Pets' }).click();
  await expect(openDialog(page)).toContainText(cat.archiveTitle);
  await expect(openDialog(page)).toContainText(cat.archiveText('Pets'));
  await openDialog(page).getByRole('button', { name: s.ARCHIVE, exact: true }).click();
  await expect(page.locator('.ws-toast')).toContainText(cat.toastArchived);
  const archived = page.locator('details.ws-archived');
  await expect(archived.locator('summary')).toHaveText(s.archivedSummary(1));
  await expect(page.locator('#catalog-list-title')).toBeFocused();
  await archived.locator('summary').click();
  await archived.getByRole('button', { name: 'Reativar Pets' }).click();
  await expect(page.locator('.ws-toast')).toContainText(cat.toastReactivated);
  await expect(archived).toHaveCount(0);
  await expect(row(page, 'Pets').locator('.ws-tag.is-primary')).toBeVisible();

  // Archive again, then create "pets" with another icon: the archived one comes back, not a copy.
  await page.getByRole('button', { name: 'Arquivar Pets' }).click();
  await openDialog(page).getByRole('button', { name: s.ARCHIVE, exact: true }).click();
  await expect(archived.locator('summary')).toHaveText(s.archivedSummary(1));
  await createCategory(page, 'pets', 'GIFT', 'HOME');
  await expect(page.locator('.ws-toast')).toContainText(cat.toastReactivated);
  await expect(archived).toHaveCount(0);
  expect(api.catalogOf(JONAS.email).categories).toMatchObject([
    { name: 'Pets', icon: 'GIFT', color: 'HOME', archivedAt: null },
  ]);
  await expect(row(page, 'Pets')).toHaveCount(1);
});

test('CA-26: formas de pagamento', async ({ page, api }) => {
  await openSettings(page, api, JONAS, PAYMENTS_URL);
  await expect(page.locator('#tab-pagamentos fieldset')).toHaveCount(0);
  await page.locator('#pay-name').fill('Vale-refeição');
  await page.getByRole('button', { name: pay.submit, exact: true }).click();
  await expect(page.locator('.ws-toast')).toContainText(pay.toastAdded);
  await expect(titles(page).first()).toHaveText('Vale-refeição');

  await page.locator('#pay-name').fill('pix');
  await page.getByRole('button', { name: pay.submit, exact: true }).click();
  await expect(page.locator('#pay-name-error')).toHaveText(pay.errDefaultName);
  await page.locator('#pay-name').fill('VALE-REFEICAO');
  await page.getByRole('button', { name: pay.submit, exact: true }).click();
  await expect(page.locator('#pay-name-error')).toHaveText(pay.errOwnName);

  await page.getByRole('button', { name: 'Editar Vale-refeição' }).click();
  await expect(openDialog(page).locator('#edit-title')).toHaveText(pay.editTitle);
  await page.locator('#edit-name').fill('VR');
  await openDialog(page).getByRole('button', { name: s.SAVE, exact: true }).click();
  await expect(page.locator('.ws-toast')).toContainText(pay.toastUpdated);
  await expect(titles(page).first()).toHaveText('VR');

  await page.getByRole('button', { name: 'Arquivar VR' }).click();
  await expect(openDialog(page)).toContainText(pay.archiveText('VR'));
  await openDialog(page).getByRole('button', { name: s.ARCHIVE, exact: true }).click();
  await expect(page.locator('.ws-toast')).toContainText(pay.toastArchived);
  await page.locator('#pay-name').fill('vr');
  await page.getByRole('button', { name: pay.submit, exact: true }).click();
  await expect(page.locator('.ws-toast')).toContainText(pay.toastReactivated);
  expect(api.catalogOf(JONAS.email).paymentMethods).toMatchObject([
    { name: 'VR', archivedAt: null },
  ]);
});

test('CA-15 criar @double-submit', async ({ page, api }) => {
  await openSettings(page, api, JONAS, CATEGORIES_URL);
  await page.locator('#cat-name').fill('Viagem');
  api.delay('/categories', 1000);
  const submit = page.getByRole('button', { name: cat.submit });
  await submit.dblclick();
  await page.locator('#cat-name').press('Enter');
  await expect(page.locator('.ws-toast')).toContainText(cat.toastAdded, { timeout: 5000 });
  expect(api.requests('/categories').filter((r) => r.method === 'POST')).toHaveLength(1);
});

test('CA-23 editar @double-submit', async ({ page, api }) => {
  api.addUser(JONAS);
  api.addCategory(JONAS.email, 'Pets', { icon: 'HEART', color: 'LEISURE' });
  await openSettings(page, api, JONAS, CATEGORIES_URL);
  await page.getByRole('button', { name: 'Editar Pets' }).click();
  await page.locator('#edit-name').fill('Animais');
  api.delay('/categories/:id', 1000);
  const save = openDialog(page).getByRole('button', { name: s.SAVE, exact: true });
  await save.dblclick();
  await page.locator('#edit-name').press('Enter');
  await expect(page.locator('.ws-toast')).toContainText(cat.toastUpdated, { timeout: 5000 });
  expect(api.calls('/categories/:id')).toBe(1);
});

test('CA-21 reativar @double-submit', async ({ page, api }) => {
  api.addUser(JONAS);
  api.addCategory(JONAS.email, 'Academia', { icon: 'HEART', color: 'HEALTH', archived: true });
  await openSettings(page, api, JONAS, CATEGORIES_URL);
  await page.locator('details.ws-archived summary').click();
  api.delay('/categories/:id/archive', 1000);
  await page.getByRole('button', { name: 'Reativar Academia' }).dblclick();
  await expect(page.locator('.ws-toast')).toContainText(cat.toastReactivated, { timeout: 5000 });
  expect(api.calls('/categories/:id/archive')).toBe(1);
});
