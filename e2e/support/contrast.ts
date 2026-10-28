// Contraste pela fórmula de luminância relativa da WCAG 2.x (https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio).

/** Lê `rgb(r, g, b)` ou `rgba(r, g, b, a)` (o alfa é ignorado: use só cores opacas). */
export function parseRgb(css: string): [number, number, number] {
  const match = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(css.trim());
  if (!match) {
    throw new Error(`Cor não reconhecida: ${css}`);
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function luminance(css: string): number {
  const [r, g, b] = parseRgb(css).map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
