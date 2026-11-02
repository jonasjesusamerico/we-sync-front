import { test as base, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** file:// URL of a prototype page, e.g. url('casa.html?semtour=1'). */
export function url(page) {
  const [file, query = ''] = page.split('?');
  return pathToFileURL(path.join(root, file)).href + (query ? '?' + query : '');
}

/** Every test fails if the page throws or logs an error. */
export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
    await use(page);
    expect(errors, 'erros no console da página').toEqual([]);
  },
});
export { expect };

/** The page must not scroll sideways (phone width included). */
export async function expectNoOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'rolagem horizontal').toBeLessThanOrEqual(0);
}

/** Walks a tour to the end, checking that every step after the first points at a visible element. */
export async function finishTour(page) {
  const card = page.locator('.ws-tour-card');
  await expect(card).toBeVisible();
  for (let step = 0; (await card.count()) && step < 15; step++) {
    if (step > 0) {
      const title = await page.locator('#ws-tour-title').textContent();
      await expect(card, `passo ${step + 1} (${title}) sem elemento na tela`).not.toHaveClass(/is-center/);
    }
    await page.locator('[data-tour="next"]').click();
  }
  await expect(card).toHaveCount(0);
}

/** Waits for a Bootstrap modal to finish opening (Bootstrap ignores hide() during the open animation). */
export async function modalOpen(page, id) {
  await expect(page.locator('#' + id)).toHaveClass(/show/);
  await page.waitForFunction((m) => !document.getElementById(m).classList.contains('fade') || getComputedStyle(document.getElementById(m)).opacity === '1', id);
  await page.waitForTimeout(350);
}
