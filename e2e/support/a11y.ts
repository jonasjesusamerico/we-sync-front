import AxeBuilder from '@axe-core/playwright';
import { test as base } from './fixtures';

export { expect } from './fixtures';

/** axe with the WCAG 2.0/2.1 A and AA rules (CA-34). */
export const test = base.extend<{ makeAxeBuilder: () => AxeBuilder }>({
  makeAxeBuilder: async ({ page }, use) => {
    await use(() =>
      new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']),
    );
  },
});
