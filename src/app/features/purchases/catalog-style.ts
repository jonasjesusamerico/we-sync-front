// Icon, color and order of categories and payment methods (ADR-06, RN-10, RN-11). The API has no icon or color:
// the global items are matched by name.
import type { IconName } from '../../shared/ui/icon/icons';

export interface CatalogStyle {
  icon: IconName;
  /** CSS value, always a token: 'var(--ws-cat-food)'. */
  color: string;
}

interface CatalogItem {
  name: string;
  is_global: boolean;
}

/** The global categories of the API seed, in the prototype order (CATEGORIES of app.js). */
export const GLOBAL_CATEGORY_STYLES: readonly ({ name: string } & CatalogStyle)[] = [
  { name: 'Alimentação', icon: 'food', color: 'var(--ws-cat-food)' },
  { name: 'Transporte', icon: 'car', color: 'var(--ws-cat-transport)' },
  { name: 'Moradia', icon: 'house', color: 'var(--ws-cat-home)' },
  { name: 'Saúde', icon: 'heart', color: 'var(--ws-cat-health)' },
  { name: 'Educação', icon: 'book', color: 'var(--ws-cat-education)' },
  { name: 'Lazer', icon: 'smile', color: 'var(--ws-cat-leisure)' },
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

export const NEUTRAL_STYLE: CatalogStyle = { icon: 'tag', color: 'var(--ws-muted)' };
export const PIX_NAME = 'Pix';

export function categoryStyle(c: CatalogItem): CatalogStyle {
  if (!c.is_global) {
    return NEUTRAL_STYLE;
  }
  const match = GLOBAL_CATEGORY_STYLES.find((style) => style.name === c.name);
  return match ? { icon: match.icon, color: match.color } : NEUTRAL_STYLE;
}

const byName = (a: CatalogItem, b: CatalogItem): number =>
  a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });

/** Globals in `order` first; then the other globals and the user's own items together, by name. */
function sortByOrder<T extends CatalogItem>(list: readonly T[], order: readonly string[]): T[] {
  const rank = (item: T): number => (item.is_global ? order.indexOf(item.name) : -1);
  const known = list.filter((item) => rank(item) >= 0).sort((a, b) => rank(a) - rank(b));
  const rest = list.filter((item) => rank(item) < 0).sort(byName);
  return [...known, ...rest];
}

export function sortCategories<T extends CatalogItem>(list: readonly T[]): T[] {
  return sortByOrder(
    list,
    GLOBAL_CATEGORY_STYLES.map((style) => style.name),
  );
}

export function sortPaymentMethods<T extends CatalogItem>(list: readonly T[]): T[] {
  return sortByOrder(list, GLOBAL_PAYMENT_ORDER);
}

/** The global "Pix", chosen by default in a new purchase (RF-21). */
export function findPix<T extends CatalogItem>(list: readonly T[]): T | null {
  return list.find((item) => item.is_global && item.name === PIX_NAME) ?? null;
}
