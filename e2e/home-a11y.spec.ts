// Feature 007: accessibility of the home blocks (CA-21, ADR-08).
import { expect, test } from './support/a11y';
import { loginHome, openHome, seedTable } from './support/home';
import { seedTheme } from './support/session';

for (const theme of ['light', 'dark'] as const) {
  for (const width of [360, 1280]) {
    test(`CA-21 axe ${theme} ${width}px`, async ({ page, context, api, makeAxeBuilder }) => {
      await page.setViewportSize({ width, height: 800 });
      await seedTheme(context, theme);
      await loginHome(page, api);
      seedTable(api);
      await openHome(page);
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    });
  }
}

test('CA-21 axe no erro dos blocos', async ({ page, api, makeAxeBuilder }) => {
  await loginHome(page, api);
  seedTable(api);
  api.fail('/purchases/overview', 500);
  await page.goto('/inicio?ano=2026&mes=11');
  await expect(page.locator('#kpi-cards').getByRole('alert')).toBeVisible();
  await expect(page.locator('#kpi-total')).toBeVisible();
  expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
});

test('rótulos dos gráficos', async ({ page, api }) => {
  await loginHome(page, api);
  seedTable(api);
  await openHome(page);
  await expect(
    page.getByRole('img', { name: 'Gráfico de gastos por dia de novembro' }),
  ).toBeVisible();
  await expect(page.locator('#daily-values li')).toHaveText([
    /^Dia 2: R\$\s100,00$/,
    /^Dia 5: R\$\s100,00$/,
    /^Dia 25: R\$\s1\.000,00 \(previsto\)$/,
  ]);
  await expect(
    page.getByRole('img', { name: /^Gastos por categoria: Moradia R\$\s1\.000,00/ }),
  ).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Boleto' })).toHaveAttribute(
    'aria-valuenow',
    '83',
  );
});

test('foco visível', async ({ page, api }) => {
  await loginHome(page, api);
  seedTable(api);
  await openHome(page);
  let reached = false;
  for (let i = 0; i < 60 && !reached; i++) {
    await page.keyboard.press('Tab');
    reached = await page.evaluate(() => document.activeElement?.id === 'last-all');
  }
  expect(reached, '"Ver todas" recebe o foco pelo Tab').toBe(true);
  const style = await page.evaluate(() => {
    const s = getComputedStyle(document.activeElement!);
    return { outline: s.outlineStyle, shadow: s.boxShadow };
  });
  expect(style.outline !== 'none' || style.shadow !== 'none').toBe(true);
});
