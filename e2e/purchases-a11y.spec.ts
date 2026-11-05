import type { Page } from '@playwright/test';
import { ANA } from './support/api-mock';
import { expect, test } from './support/a11y';
import { fixedToday, openPurchases, seedOctober } from './support/purchases';
import { seedSession, seedTheme } from './support/session';
import * as t from './support/texts';

const dialog = (page: Page) => page.locator('dialog.ws-dialog');

for (const theme of ['light', 'dark'] as const) {
  for (const width of [360, 1280]) {
    test(`CA-47 axe ${theme} ${width}px`, async ({ page, context, api, makeAxeBuilder }) => {
      api.addUser(ANA);
      await seedTheme(context, theme);
      await page.setViewportSize({ width, height: 800 });
      await fixedToday(page);
      await seedSession(page, api.issueSession(ANA.email));
      const check = async (where: string) => {
        const results = await makeAxeBuilder().analyze();
        expect(results.violations, where).toEqual([]);
      };

      await page.goto('/inicio');
      await expect(page.locator('.ws-hero-progress')).toBeVisible();
      await check('início sem compras');

      seedOctober(api, ANA.email, 2026, 11);
      await openPurchases(page);
      await expect(page.locator('html')).toHaveAttribute('data-bs-theme', theme);
      await check('compras');
      await openPurchases(page, 'ano=2026&mes=11&busca=nada');
      await check('compras vazia');
      api.fail('/purchases', 500);
      await page.reload();
      await expect(
        page.getByRole('region', { name: t.LABEL_LIST }).getByRole('alert'),
      ).toBeVisible();
      await check('compras com erro');

      await openPurchases(page);
      // The row's trash only exists on the computer (table); on the phone, the edit page has "Excluir".
      const firstLink = page.locator(width === 360 ? '#cards a' : '#rows tr td:first-child a');
      if (width === 360) {
        await firstLink.first().click();
        await expect(page.locator('#description')).not.toHaveValue('');
        await page.locator('aside').getByRole('button', { name: t.DELETE }).click();
      } else {
        await page.getByRole('button', { name: 'Excluir Estacionamento' }).click();
      }
      await expect(dialog(page)).toBeVisible();
      await check('modal de exclusão');
      await page.keyboard.press('Escape');
      await expect(dialog(page)).toBeHidden();

      await page.goto('/compras/nova');
      await expect(page.locator('#categories input').first()).toBeAttached();
      await page.getByRole('button', { name: t.SAVE_PURCHASE, exact: true }).click();
      await expect(page.locator('#amount-error')).toBeVisible();
      await check('nova compra com erros');
      await page.locator('#description').fill('Pão');
      await page.locator('a.ws-back').click();
      await expect(dialog(page)).toBeVisible();
      await check('descartar alterações');
      await dialog(page).getByRole('button', { name: t.DISCARD_CONFIRM, exact: true }).click();

      await firstLink.first().click();
      await expect(page.locator('#description')).not.toHaveValue('');
      await check('editar compra');
      await page.locator('#amount').fill('9,99');
      await page.getByRole('button', { name: t.SAVE_CHANGES }).click();
      await expect(page.locator('.ws-toast')).toBeVisible();
      // The toast fades in (0.25 s): axe would measure the colors mid-animation.
      await page.waitForFunction(() => document.getAnimations().length === 0);
      await check('aviso visível');

      await page.goto('/inicio');
      await expect(page.getByRole('link', { name: t.LABEL_SEE_PURCHASES })).toBeVisible();
      await check('início com compras');
    });
  }
}

async function expectVisibleFocus(page: Page, where: string) {
  const seen = new Set<string>();
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      // Radios show the ring on their label; the amount input on its .ws-money box (:focus-within).
      const label = el.closest('.ws-chip, .ws-segmented') ? el.nextElementSibling : null;
      const labelStyle = label ? getComputedStyle(label) : null;
      const box = el.closest('.ws-money');
      const boxStyle = box ? getComputedStyle(box) : null;
      return {
        key: `${el.tagName}#${el.id}.${el.className}|${el.getAttribute('aria-label') ?? el.textContent?.trim()}`,
        visible:
          style.outlineStyle !== 'none' ||
          style.boxShadow !== 'none' ||
          (labelStyle !== null && labelStyle.outlineStyle !== 'none') ||
          (boxStyle !== null && boxStyle.boxShadow !== 'none'),
      };
    });
    if (!info || seen.has(info.key)) break;
    seen.add(info.key);
    expect(info.visible, `${where}: ${info.key}`).toBe(true);
  }
  expect(seen.size, where).toBeGreaterThan(5);
}

test('CA-47 foco visível em Compras e no formulário', async ({ page, api }) => {
  api.addUser(ANA);
  await page.setViewportSize({ width: 1280, height: 800 });
  await fixedToday(page);
  await seedSession(page, api.issueSession(ANA.email));
  seedOctober(api, ANA.email, 2026, 11);
  await openPurchases(page);
  await expectVisibleFocus(page, 'compras');
  await page.goto('/compras/nova');
  await expect(page.locator('#categories input').first()).toBeAttached();
  await expectVisibleFocus(page, 'nova compra');
});

test('CA-47 o modal prende o foco e o Esc fecha', async ({ page, api }) => {
  api.addUser(ANA);
  await page.setViewportSize({ width: 1280, height: 800 });
  await fixedToday(page);
  await seedSession(page, api.issueSession(ANA.email));
  seedOctober(api, ANA.email, 2026, 11);
  await openPurchases(page);
  const trash = page.getByRole('button', { name: 'Excluir Estacionamento' });
  await trash.click();
  await expect(dialog(page).getByRole('button', { name: t.CANCEL })).toBeFocused();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(
      () =>
        !!document.activeElement?.closest('dialog.ws-dialog') ||
        document.activeElement === document.body,
    );
    expect(inside, `Tab ${i + 1}`).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();
  await expect(trash).toBeFocused();
});
