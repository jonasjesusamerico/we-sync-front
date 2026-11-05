// Icon, color and order of categories and payment methods. Since feature 006 the icon and the color come from the
// API (ADR-06); unknown values are tolerated (contract, "Enums").
import type { IconName } from '../../shared/ui/icon/icons';
import type { CatalogColor, CatalogIcon } from './catalog.models';

export interface CatalogStyle {
  icon: IconName;
  /** CSS value, always a token: 'var(--ws-cat-food)'. */
  color: string;
}

/** Order of the icon choices (ICON_CHOICES of configuracoes.html). */
export const ICON_CHOICES: readonly CatalogIcon[] = [
  'TAG',
  'HEART',
  'SMILE',
  'BOOK',
  'CAR',
  'HOUSE',
  'FOOD',
  'CARD',
  'GIFT',
  'SPARKLE',
];

/** Order of the color choices (COLOR_CHOICES of configuracoes.html). */
export const COLOR_CHOICES: readonly CatalogColor[] = [
  'FOOD',
  'TRANSPORT',
  'HOME',
  'HEALTH',
  'EDUCATION',
  'LEISURE',
];

export const DEFAULT_ICON: CatalogIcon = 'TAG';
/** The first color (RN-11). */
export const DEFAULT_COLOR: CatalogColor = 'FOOD';

const ICON_NAMES: Record<CatalogIcon, IconName> = {
  TAG: 'tag',
  HEART: 'heart',
  SMILE: 'smile',
  BOOK: 'book',
  CAR: 'car',
  HOUSE: 'house',
  FOOD: 'food',
  CARD: 'card',
  GIFT: 'gift',
  SPARKLE: 'sparkle',
};

const COLOR_VALUES: Record<CatalogColor, string> = {
  FOOD: 'var(--ws-cat-food)',
  TRANSPORT: 'var(--ws-cat-transport)',
  HOME: 'var(--ws-cat-home)',
  HEALTH: 'var(--ws-cat-health)',
  EDUCATION: 'var(--ws-cat-education)',
  LEISURE: 'var(--ws-cat-leisure)',
};

const NEUTRAL_COLOR = 'var(--ws-muted)';

const isIcon = (icon: string): icon is CatalogIcon => Object.hasOwn(ICON_NAMES, icon);
const isColor = (color: string): color is CatalogColor => Object.hasOwn(COLOR_VALUES, color);

/** API icon → IconName; unknown → 'tag'. */
export function iconName(icon: string): IconName {
  return isIcon(icon) ? ICON_NAMES[icon] : 'tag';
}

/** API color → token; NEUTRAL and unknown → 'var(--ws-muted)'. */
export function colorValue(color: string): string {
  return isColor(color) ? COLOR_VALUES[color] : NEUTRAL_COLOR;
}

export function catalogStyle(item: { icon: string; color: string }): CatalogStyle {
  return { icon: iconName(item.icon), color: colorValue(item.color) };
}

/** The bubble of every payment method (payBubble of configuracoes.html). */
export const PAYMENT_STYLE: CatalogStyle = { icon: 'card', color: 'var(--ws-primary)' };

/** The global categories of the API seed, in the prototype order (CATEGORIES of app.js). */
export const GLOBAL_CATEGORY_ORDER: readonly string[] = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
];

/** The global payment methods of the API seed, in the prototype order (PAYMENT_METHODS of app.js). */
export const GLOBAL_PAYMENT_ORDER: readonly string[] = [
  'Dinheiro',
  'Cartão de crédito',
  'Cartão de débito',
  'Pix',
  'Transferência bancária',
  'Boleto',
];

export const PIX_NAME = 'Pix';

/** The global "Pix", chosen by default in a new purchase (RF-21 of feature 005). */
export function findPix<T extends { name: string; is_global: boolean }>(
  list: readonly T[],
): T | null {
  return list.find((item) => item.is_global && item.name === PIX_NAME) ?? null;
}

/** The editable color of an item: NEUTRAL or unknown → DEFAULT_COLOR (ADR-06). */
export function editableColor(color: string): CatalogColor {
  return isColor(color) ? color : DEFAULT_COLOR;
}

/** The editable icon of an item: unknown → DEFAULT_ICON. */
export function editableIcon(icon: string): CatalogIcon {
  return isIcon(icon) ? icon : DEFAULT_ICON;
}
