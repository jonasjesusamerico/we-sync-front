import type { Page } from '@playwright/test';
import { ICON_PATHS } from '../src/app/shared/ui/icon/icons';
import { expect, test } from './support/fixtures';
import { brl, fixedToday, openPurchases } from './support/purchases';
import { JONAS, openDialog, openSettings } from './support/settings';
import * as t from './support/texts';

const s = t.settings;
const cat = s.CATALOG_TEXTS.category;
const LAZER = 6;

async function setup(page: Page, api: Parameters<typeof openSettings>[1]) {
  api.addUser(JONAS);
  const pets = api.addCategory(JONAS.email, 'Pets', { icon: 'HEART', color: 'LEISURE' });
  for (const [day, description, cents] of [
    [3, 'Ração', 12000],
    [12, 'Veterinário', 25000],
  ] as const) {
    api.addPurchase(JONAS.email, {
      date: `2026-09-${String(day).padStart(2, '0')}`,
      description,
      categoryId: pets,
      paymentMethodId: 4,
      cents,
      status: 'PAID',
    });
  }
  await fixedToday(page);
  await openSettings(page, api, JONAS, '/configuracoes/categorias');
  return pets;
}

async function archivePets(page: Page) {
  await page.getByRole('button', { name: 'Arquivar Pets' }).click();
  await openDialog(page).getByRole('button', { name: s.ARCHIVE, exact: true }).click();
  await expect(page.locator('.ws-toast')).toContainText(cat.toastArchived);
}

const rowOf = (page: Page, description: string) =>
  page.locator('#rows tr', { has: page.getByRole('link', { name: description }) });

test('CA-18 e CA-24: arquivada some da Nova compra e continua em Compras e no filtro', async ({
  page,
  api,
}) => {
  const pets = await setup(page, api);
  await archivePets(page);

  await page.goto('/compras/nova');
  await expect(page.locator('#categories input').first()).toBeAttached();
  await expect(page.locator(`#c-${pets}`)).toHaveCount(0);
  await expect(page.locator('#categories')).not.toContainText('Pets');

  await openPurchases(page, 'ano=2026&mes=9');
  await expect(page.locator('#summary')).toContainText(brl('R$ 370,00'));
  const row = rowOf(page, 'Ração');
  await expect(row).toContainText('Pets');
  await expect(row.locator('ws-category-bubble path')).toHaveAttribute('d', ICON_PATHS.heart);
  await expect(row.locator('ws-category-bubble')).toHaveAttribute(
    'style',
    /--cat: var\(--ws-cat-leisure\)/,
  );
  const filter = page.locator('#f-category option');
  await expect(filter.last()).toHaveText(t.archivedOptionLabel('Pets'));
  await page.locator('#f-category').selectOption(String(pets));
  await expect(page).toHaveURL(new RegExp(`categoria=${pets}`));
  await expect(page.locator('#rows tr')).toHaveCount(2);
});

test('CA-19: editar compra de arquivada e trocar para Lazer', async ({ page, api }) => {
  const pets = await setup(page, api);
  await archivePets(page);
  await openPurchases(page, 'ano=2026&mes=9');
  await page.getByRole('link', { name: 'Ração', exact: true }).click();
  const archived = page.locator(`#c-${pets}`);
  await expect(archived).toBeChecked();
  await expect(page.locator(`label[for=c-${pets}]`)).toContainText(t.archivedOptionLabel('Pets'));

  // Saving without a change keeps the archived category (PUT accepts it).
  await page.getByRole('button', { name: t.SAVE_CHANGES, exact: true }).click();
  await expect(page).toHaveURL(/\/compras\?/);
  expect(api.purchasesOf(JONAS.email).find((p) => p.description === 'Ração')!.categoryId).toBe(
    pets,
  );

  await page.getByRole('link', { name: 'Ração', exact: true }).click();
  await page.locator(`label[for=c-${LAZER}]`).click();
  // The archived option stays while the page is open.
  await expect(archived).toHaveCount(1);
  await page.getByRole('button', { name: t.SAVE_CHANGES, exact: true }).click();
  await expect(page).toHaveURL(/\/compras\?/);
  await page.getByRole('link', { name: 'Ração', exact: true }).click();
  await expect(page.locator(`#c-${LAZER}`)).toBeChecked();
  await expect(page.locator(`#c-${pets}`)).toHaveCount(0);
});

test('CA-23: renomear com ícone novo aparece em Compras', async ({ page, api }) => {
  await setup(page, api);
  await page.getByRole('button', { name: 'Editar Pets' }).click();
  await page.locator('#edit-name').fill('Animais');
  await openDialog(page).locator('label[for=ei-HOUSE]').click();
  await openDialog(page).getByRole('button', { name: s.SAVE, exact: true }).click();
  await expect(page.locator('.ws-toast')).toContainText(cat.toastUpdated);

  await openPurchases(page, 'ano=2026&mes=9');
  const row = rowOf(page, 'Ração');
  await expect(row).toContainText('Animais');
  await expect(row.locator('ws-category-bubble path')).toHaveAttribute('d', ICON_PATHS.house);
});

test('CA-24 e CA-25: padrão sem ações e com os ícones da API', async ({ page, api }) => {
  await setup(page, api);
  const list = page.locator('.ws-card').nth(1);
  for (const [name, icon] of [
    ['Alimentação', ICON_PATHS.food],
    ['Transporte', ICON_PATHS.car],
    ['Moradia', ICON_PATHS.house],
    ['Saúde', ICON_PATHS.heart],
    ['Educação', ICON_PATHS.book],
    ['Lazer', ICON_PATHS.smile],
  ] as const) {
    const item = list.locator('li.ws-tx', { has: page.getByText(name, { exact: true }) });
    await expect(item.locator('ws-category-bubble path')).toHaveAttribute('d', icon);
    await expect(item.locator('.ws-tag')).toHaveText(s.TAG_DEFAULT);
    await expect(item.locator('button')).toHaveCount(0);
  }
  await expect(
    page.getByRole('button', { name: /^(Editar|Arquivar) (Alimentação|Lazer)$/ }),
  ).toHaveCount(0);
});

test('CA-25: própria neutra criada antes da feature', async ({ page, api }) => {
  api.addUser(JONAS);
  api.addCategory(JONAS.email, 'Bar');
  await openSettings(page, api, JONAS, '/configuracoes/categorias');
  const bar = page.locator('li.ws-tx', { has: page.getByText('Bar', { exact: true }) });
  await expect(bar.locator('ws-category-bubble path')).toHaveAttribute('d', ICON_PATHS.tag);
  await expect(bar.locator('ws-category-bubble')).toHaveAttribute(
    'style',
    /--cat: var\(--ws-muted\)/,
  );
  await page.getByRole('button', { name: 'Editar Bar' }).click();
  await expect(page.locator('#ei-TAG')).toBeChecked();
  await expect(page.locator('#ec-FOOD')).toBeChecked();
});
