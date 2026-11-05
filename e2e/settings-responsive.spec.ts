import type { Locator, Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { expectNoHorizontalScroll } from './support/layout';
import { JONAS, openDialog, openSettings, seedCatalog } from './support/settings';
import * as t from './support/texts';

const SECTIONS = [
  ['/configuracoes/conta', t.settings.SECTION_LABELS.conta],
  ['/configuracoes/categorias', t.settings.SECTION_LABELS.categorias],
  ['/configuracoes/formas-de-pagamento', t.settings.SECTION_LABELS.pagamentos],
] as const;

const nav = (page: Page) => page.locator('nav.ws-settings-nav');

async function expectTarget(locator: Locator, name: string) {
  const count = await locator.count();
  expect(count, name).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const box = await locator.nth(i).boundingBox();
    expect(box, `${name} #${i}`).not.toBeNull();
    expect(box!.width, `${name} #${i} width`).toBeGreaterThanOrEqual(44);
    expect(box!.height, `${name} #${i} height`).toBeGreaterThanOrEqual(44);
  }
}

test.beforeEach(({ api }) => {
  api.addUser(JONAS);
  seedCatalog(api, JONAS.email);
});

test('CA-29: celular, sem rolagem lateral e com a seção atual à vista', async ({ page, api }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const [url, label] of SECTIONS) {
    await openSettings(page, api, JONAS, url);
    await expect(page.locator('li.ws-tx, #acc-name').first()).toBeVisible();
    await expectNoHorizontalScroll(page);
    const menu = nav(page);
    expect(await menu.evaluate((el) => getComputedStyle(el).flexDirection)).toBe('row');
    expect(await menu.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    const current = menu.locator('a[aria-current="page"]');
    await expect(current).toHaveText(label);
    await expect
      .poll(async () => {
        const [m, c] = [await menu.boundingBox(), await current.boundingBox()];
        return c!.x >= m!.x - 0.5 && c!.x + c!.width <= m!.x + m!.width + 0.5;
      })
      .toBe(true);
  }
});

test('CA-29: computador, menu em coluna e fixo', async ({ page, api }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openSettings(page, api, JONAS, '/configuracoes/categorias');
  const style = await nav(page).evaluate((el) => {
    const cs = getComputedStyle(el);
    return { direction: cs.flexDirection, position: cs.position };
  });
  expect(style).toEqual({ direction: 'column', position: 'sticky' });
  await expectNoHorizontalScroll(page);
});

for (const width of [360, 1280]) {
  test(`CA-29: alvos de 44 px a ${width} px`, async ({ page, api }) => {
    await page.setViewportSize({ width, height: 800 });
    await openSettings(page, api, JONAS, '/configuracoes/categorias');
    await expect(page.locator('li.ws-tx').first()).toBeVisible();
    await expectTarget(nav(page).locator('a, button'), 'menu de seções');
    await expectTarget(page.locator('.ws-chips label'), 'ícones');
    await expectTarget(page.locator('.ws-swatches label'), 'cores');
    await expectTarget(
      page.getByRole('button', { name: /^(Editar|Arquivar) / }),
      'lápis e arquivar',
    );
    await expectTarget(page.locator('details.ws-archived > summary'), 'Arquivadas');
    await page.locator('details.ws-archived > summary').click();
    await expect(page.getByRole('button', { name: /^Reativar / }).first()).toBeVisible();
    await expectTarget(page.getByRole('button', { name: /^Reativar / }), 'Reativar');
    await page.getByRole('button', { name: 'Editar Pets' }).click();
    await expect(openDialog(page)).toBeVisible();
    await expectTarget(openDialog(page).getByRole('button', { name: t.settings.LABEL_CLOSE }), '×');
    await expectTarget(openDialog(page).locator('.ws-chips label'), 'ícones do diálogo');
    await expectTarget(openDialog(page).locator('.ws-swatches label'), 'cores do diálogo');
    await page.keyboard.press('Escape');

    await page.goto('/configuracoes/conta');
    await expect(page.locator('#acc-name')).toBeVisible();
    await expectTarget(page.getByRole('button', { name: t.LABEL_SHOW_PASSWORD }), 'mostrar senha');
    await expectTarget(page.locator('.ws-segmented label'), 'tema');
    await page.getByRole('button', { name: t.settings.DELETE_OPEN }).click();
    await expect(openDialog(page)).toBeVisible();
    await expectTarget(
      openDialog(page).getByRole('button', { name: t.LABEL_SHOW_PASSWORD }),
      'mostrar senha da exclusão',
    );
  });
}
