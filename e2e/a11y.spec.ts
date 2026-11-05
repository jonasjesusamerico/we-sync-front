import type { Page } from '@playwright/test';
import { ANA } from './support/api-mock';
import { openUserMenu } from './support/fixtures';
import { expect, test } from './support/a11y';
import { seedSession, seedTheme } from './support/session';
import * as t from './support/texts';

test.beforeEach(({ api }) => api.addUser(ANA));

for (const theme of ['light', 'dark'] as const) {
  for (const width of [360, 1280]) {
    test(`CA-34 axe ${theme} ${width}px`, async ({ page, context, api, makeAxeBuilder }) => {
      await seedTheme(context, theme);
      await page.setViewportSize({ width, height: 800 });
      const check = async (where: string) => {
        const results = await makeAxeBuilder().analyze();
        expect(results.violations, where).toEqual([]);
      };

      await page.goto('/login');
      await expect(page.locator('html')).toHaveAttribute('data-bs-theme', theme);
      await check('login');

      await page.goto('/cadastro');
      await check('cadastro');
      await page.getByRole('button', { name: t.LABEL_REGISTER_SUBMIT, exact: true }).click();
      await expect(page.locator('#name-error')).toBeVisible();
      await check('cadastro com erros');

      await seedSession(page, api.issueSession(ANA.email));
      await page.goto('/inicio');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Olá, Ana Souza');
      await check('início');
      await openUserMenu(page);
      await check('início com o menu aberto');
    });
  }
}

async function expectVisibleFocus(page: Page, where: string) {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const seen = new Set<string>();
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      return {
        key: `${el.tagName}#${el.id}.${el.className}|${el.getAttribute('aria-label') ?? el.textContent?.trim()}`,
        outline: style.outlineStyle,
        shadow: style.boxShadow,
      };
    });
    if (!info || seen.has(info.key)) break;
    seen.add(info.key);
    expect(info.outline !== 'none' || info.shadow !== 'none', `${where}: ${info.key}`).toBe(true);
  }
  expect(seen.size, where).toBeGreaterThan(2);
}

test('foco visível', async ({ page, api }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/login');
  await expectVisibleFocus(page, 'login');
  await page.goto('/cadastro');
  await expectVisibleFocus(page, 'cadastro');
  await seedSession(page, api.issueSession(ANA.email));
  await page.goto('/inicio');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Olá, Ana Souza');
  await expectVisibleFocus(page, 'início');
});

test('alvos de toque', async ({ page, api }) => {
  await seedSession(page, api.issueSession(ANA.email));
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto('/inicio');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Olá, Ana Souza');
  const small = page.locator(
    '#ws-topbar button:visible, #ws-bottomnav > a, #ws-bottomnav > button',
  );
  for (const box of await small.evaluateAll((els) =>
    els.map((e) => ({
      w: e.getBoundingClientRect().width,
      h: e.getBoundingClientRect().height,
      l: e.getAttribute('aria-label') ?? e.textContent,
    })),
  )) {
    expect(box.w, `${box.l} width`).toBeGreaterThanOrEqual(44);
    expect(box.h, `${box.l} height`).toBeGreaterThanOrEqual(44);
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const h of await page
    .locator('#ws-sidebar .ws-nav-link')
    .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))) {
    expect(h).toBeGreaterThanOrEqual(44);
  }
  await page.evaluate(() => localStorage.clear());
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto('/login');
  for (const name of [t.LABEL_USE_DARK_THEME, t.LABEL_SHOW_PASSWORD]) {
    const box = await page.getByRole('button', { name }).boundingBox();
    expect(box!.width, name).toBeGreaterThanOrEqual(44);
    expect(box!.height, name).toBeGreaterThanOrEqual(44);
  }
});
