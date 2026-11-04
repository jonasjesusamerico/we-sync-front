// WCAG 2.x contrast of the token pairs (feature 004, ADR-05). Values copied from src/styles/_tokens.scss:
// update both together.

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) {
    throw new Error(`expected #rrggbb, got ${hex}`);
  }
  const [r, g, b] = match.slice(1).map((part) => channel(parseInt(part, 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two `#rrggbb` colors (1 to 21). */
export function contrastRatio(fg: string, bg: string): number {
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

type Theme = 'light' | 'dark';

const TOKENS: Record<Theme, Record<string, string>> = {
  light: {
    primary: '#1565d8',
    'primary-strong': '#0f4fb0',
    'primary-soft': '#eaf2fe',
    'primary-contrast': '#ffffff',
    bg: '#f4f7fc',
    surface: '#ffffff',
    'surface-2': '#f8fafd',
    text: '#1b2638',
    muted: '#5b6b82',
    danger: '#c22f3c',
    'danger-soft': '#fde8ea',
    'success-soft': '#e3f6ee',
    success: '#0e7a50',
    warning: '#9a5b00',
    'warning-soft': '#fff3dc',
    'on-danger': '#ffffff',
    'hero-from': '#1565d8',
    'hero-to': '#0b3f94',
    'on-hero': '#ffffff',
    'on-hero-muted': '#e8f0fb',
    'hero-btn-hover-bg': '#eaf2fe',
  },
  dark: {
    primary: '#5b9bff',
    'primary-strong': '#8ab8ff',
    'primary-soft': '#16294a',
    'primary-contrast': '#0b1424',
    bg: '#0c1422',
    surface: '#141e30',
    'surface-2': '#1a2639',
    text: '#e7eef8',
    muted: '#9aaac0',
    danger: '#ff7c86',
    'danger-soft': '#3d1a1f',
    'success-soft': '#123326',
    success: '#4cd39a',
    warning: '#f3b64a',
    'warning-soft': '#3a2a0c',
    'on-danger': '#0b1424',
    'hero-from': '#1a4fa8',
    'hero-to': '#0c2a5e',
    'on-hero': '#ffffff',
    'on-hero-muted': '#e8f0fb',
    'hero-btn-hover-bg': '#eaf2fe',
  },
};

const PAIRS: readonly [fg: string, bg: string, use: string][] = [
  ['text', 'bg', 'body text'],
  ['text', 'surface', 'text on cards and inputs'],
  ['text', 'surface-2', 'text on hover backgrounds'],
  ['muted', 'bg', 'secondary text'],
  ['muted', 'surface', 'secondary text on cards'],
  ['muted', 'surface-2', '"em breve" tag'],
  ['primary', 'bg', 'links'],
  ['primary', 'surface', 'links on cards'],
  ['primary', 'primary-soft', 'active menu item, info alert, link in alert'],
  ['primary-contrast', 'primary', 'primary button'],
  ['primary-contrast', 'primary-strong', 'primary button hover'],
  ['danger', 'bg', 'field error'],
  ['primary', 'danger-soft', '"Entrar" link in the RN-06 alert'],
  ['text', 'danger-soft', 'error alert'],
  ['text', 'success-soft', 'success alert'],
  ['text', 'primary-soft', 'info alert and callout'],
  ['on-hero', 'hero-from', 'text on the blue panel (start)'],
  ['on-hero', 'hero-to', 'text on the blue panel (end)'],
  ['on-hero-muted', 'hero-from', 'secondary text on the blue panel (start)'],
  ['on-hero-muted', 'hero-to', 'secondary text on the blue panel (end)'],
  ['hero-to', 'on-hero', '"Nova compra" button of the sidebar card'],
  ['hero-to', 'hero-btn-hover-bg', '"Nova compra" button of the sidebar card, hover'],
  // Feature 005.
  ['bg', 'text', 'toast'],
  ['success', 'success-soft', '"Paga" status pill'],
  ['warning', 'warning-soft', '"Pendente" status pill'],
  ['danger', 'surface', 'outline danger button'],
  ['danger', 'danger-soft', 'danger icon of the confirmation'],
  ['on-danger', 'danger', 'danger button (D-22)'],
];

export const CONTRAST_PAIRS: readonly { theme: Theme; fg: string; bg: string; use: string }[] = (
  ['light', 'dark'] as const
).flatMap((theme) =>
  PAIRS.map(([fg, bg, use]) => ({
    theme,
    fg: TOKENS[theme][fg],
    bg: TOKENS[theme][bg],
    use: `${use} (--ws-${fg} on --ws-${bg})`,
  })),
);
