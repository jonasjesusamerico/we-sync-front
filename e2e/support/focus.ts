import { Locator } from '@playwright/test';

/**
 * Cor da borda do indicador de foco forte (`::before` de `.mat-focus-indicator` / `.mat-mdc-focus-indicator`, no
 * próprio elemento ou num filho direto), ou `null` se não houver indicador visível.
 */
export function focusRingColor(locator: Locator): Promise<string | null> {
  return locator.evaluate((element) => {
    const isIndicator = (el: Element) =>
      el.classList.contains('mat-focus-indicator') ||
      el.classList.contains('mat-mdc-focus-indicator');
    const candidates = [element, ...Array.from(element.children)].filter(isIndicator);
    for (const candidate of candidates) {
      const style = getComputedStyle(candidate, '::before');
      const color = style.borderTopColor;
      const visible =
        style.content !== 'none' &&
        style.display !== 'none' &&
        parseFloat(style.borderTopWidth) > 0 &&
        color !== 'transparent' &&
        !/rgba\(.*,\s*0\)$/.test(color);
      if (visible) {
        return color;
      }
    }
    return null;
  });
}
