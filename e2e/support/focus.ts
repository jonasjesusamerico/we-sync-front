import { Locator } from '@playwright/test';

/** Cor do contorno de foco por teclado (`outline` em `:focus-visible`), ou `null` se não houver contorno visível. */
export function focusRingColor(locator: Locator): Promise<string | null> {
  return locator.evaluate((element) => {
    if (!element.matches(':focus-visible')) {
      return null;
    }
    const style = getComputedStyle(element);
    const color = style.outlineColor;
    const visible =
      style.outlineStyle !== 'none' &&
      parseFloat(style.outlineWidth) > 0 &&
      color !== 'transparent' &&
      !/rgba\(.*,\s*0\)$/.test(color);
    return visible ? color : null;
  });
}
