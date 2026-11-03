import { CONTRAST_PAIRS, contrastRatio } from '../testing/contrast';

describe('token contrast', () => {
  it('computes the WCAG ratio (contrastRatio)', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 2);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 2);
  });

  it.each(CONTRAST_PAIRS)(
    '$theme: $use reaches 4.5:1 (pares de tokens)',
    ({ theme, fg, bg, use }) => {
      const ratio = contrastRatio(fg, bg);
      expect(ratio, `${theme} theme, ${use}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    },
  );
});
