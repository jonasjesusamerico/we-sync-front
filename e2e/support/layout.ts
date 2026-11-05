import { expect, type Locator, type Page } from '@playwright/test';

export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const sizes = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(sizes.scroll, 'horizontal scroll').toBeLessThanOrEqual(sizes.viewport);
}

export async function expectInViewport(locator: Locator): Promise<void> {
  const box = await locator.boundingBox();
  const width = locator.page().viewportSize()!.width;
  expect(box, 'element has a box').not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(width + 0.5);
}

/** The element is the one that receives a click at its center (works for aria-disabled items too). */
export async function expectHitTarget(locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  const hit = await locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const target = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!target && (el === target || el.contains(target));
  });
  expect(hit, 'element receives the click').toBe(true);
}
