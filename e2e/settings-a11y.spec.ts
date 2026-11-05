import { expect, test } from './support/a11y';
import { JONAS, openDialog, openSettings, seedCatalog } from './support/settings';
import { seedTheme } from './support/session';
import * as t from './support/texts';

const s = t.settings;

for (const theme of ['light', 'dark'] as const) {
  for (const width of [360, 1280]) {
    test(`CA-29 axe ${theme} ${width}px`, async ({ page, context, api, makeAxeBuilder }) => {
      api.addUser(JONAS);
      seedCatalog(api, JONAS.email);
      await seedTheme(context, theme);
      await page.setViewportSize({ width, height: 800 });
      const check = async (where: string) => {
        const results = await makeAxeBuilder().analyze();
        expect(results.violations, where).toEqual([]);
      };

      await openSettings(page, api, JONAS);
      await expect(page.locator('html')).toHaveAttribute('data-bs-theme', theme);
      await expect(page.locator('#acc-name')).toHaveValue('Jonas');
      await check('conta');
      await page.getByRole('button', { name: s.SAVE_PROFILE }).click();
      await page.locator('#acc-name').fill('');
      await page.getByRole('button', { name: s.SAVE_PROFILE }).click();
      await page.getByRole('button', { name: s.PASSWORD_TITLE, exact: true }).click();
      await expect(page.locator('#acc-pass-error')).toBeVisible();
      await check('conta com erros');
      await page.getByRole('button', { name: s.DELETE_OPEN }).click();
      await expect(openDialog(page)).toBeVisible();
      await openDialog(page).getByRole('button', { name: s.DELETE_CONFIRM }).click();
      await expect(page.locator('#delete-pass-error')).toBeVisible();
      await check('diálogo de exclusão');
      await page.keyboard.press('Escape');
      await expect(openDialog(page)).toHaveCount(0);

      for (const url of ['/configuracoes/categorias', '/configuracoes/formas-de-pagamento']) {
        await page.goto(url);
        await expect(page.locator('li.ws-tx').first()).toBeVisible();
        await check(url);
        await page.locator('details.ws-archived > summary').click();
        await expect(page.getByRole('button', { name: /^Reativar / })).toBeVisible();
        await check(`${url} com Arquivadas aberto`);
        await page.locator('form button[type=submit]').first().click();
        await expect(page.locator('.invalid-feedback')).toBeVisible();
        await check(`${url} com erro no nome`);
      }

      await page.goto('/configuracoes/categorias');
      await page.getByRole('button', { name: 'Editar Pets' }).click();
      await expect(openDialog(page)).toBeVisible();
      await check('diálogo de edição');
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Arquivar Pets' }).click();
      await expect(openDialog(page)).toBeVisible();
      await check('confirmação de arquivar');
      await page.keyboard.press('Escape');
      await expect(openDialog(page)).toHaveCount(0);
    });
  }
}

test('CA-29: foco visível e de volta à origem ao fechar os diálogos', async ({ page, api }) => {
  api.addUser(JONAS);
  seedCatalog(api, JONAS.email);
  await openSettings(page, api, JONAS, '/configuracoes/categorias');
  const outline = async () =>
    page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const cs = getComputedStyle(el);
      return cs.outlineStyle !== 'none' || cs.boxShadow !== 'none';
    });

  for (const name of ['Editar Pets', 'Arquivar Pets']) {
    const origin = page.getByRole('button', { name });
    await origin.focus();
    await page.keyboard.press('Enter');
    await expect(openDialog(page)).toBeVisible();
    // The initial focus is inside the dialog and visible (Nome in the edit, Cancelar in the confirmation).
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog[open]'))).toBe(true);
    expect(await outline(), `foco visível em ${name}`).toBe(true);
    await page.keyboard.press('Escape');
    await expect(openDialog(page)).toHaveCount(0);
    await expect(origin).toBeFocused();
  }

  await page.locator('label[for=ci-HEART]').click();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#ci-SMILE')).toBeFocused();
  await expect(page.locator('#ci-SMILE')).toBeChecked();
  const chip = await page
    .locator('label[for=ci-SMILE]')
    .evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(chip).not.toBe('none');

  await page.goto('/configuracoes/conta');
  const open = page.getByRole('button', { name: s.DELETE_OPEN });
  await open.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#delete-pass')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(open).toBeFocused();
});

test('CA-29: rótulos acessíveis', async ({ page, api }) => {
  api.addUser(JONAS);
  seedCatalog(api, JONAS.email);
  await openSettings(page, api, JONAS, '/configuracoes/categorias');
  await page.locator('details.ws-archived > summary').click();
  for (const name of ['Editar Pets', 'Arquivar Pets', 'Reativar Academia']) {
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(1);
  }
  await expect(page.getByRole('radio', { name: 'Ícone coração' })).toHaveCount(1);
  await expect(page.getByRole('radio', { name: 'Cor azul' })).toHaveCount(1);
  await page.goto('/configuracoes/conta');
  await expect(page.getByRole('button', { name: t.LABEL_SHOW_PASSWORD })).toHaveCount(2);
});
