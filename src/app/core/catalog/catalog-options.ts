// Which categories and payment methods each screen offers, and in which order (ADR-13, RN-16, RN-18). Pure.
import { archivedOptionLabel } from './catalog.messages';
import { GLOBAL_CATEGORY_ORDER, GLOBAL_PAYMENT_ORDER } from './catalog-style';
import type { CatalogKind } from './catalog.models';

export interface CatalogEntry {
  id: number;
  name: string;
  is_global: boolean;
  archived_at: string | null;
}

export interface CatalogOption<T extends CatalogEntry> {
  item: T;
  label: string;
  archived: boolean;
}

export interface SettingsLists<T extends CatalogEntry> {
  own: T[];
  globals: T[];
  archived: T[];
}

const ORDER: Record<CatalogKind, readonly string[]> = {
  category: GLOBAL_CATEGORY_ORDER,
  payment: GLOBAL_PAYMENT_ORDER,
};

const byName = (a: CatalogEntry, b: CatalogEntry): number =>
  a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });

const isArchived = (item: CatalogEntry): boolean => !item.is_global && item.archived_at !== null;

/** Known globals in the prototype order, then the unknown globals A→Z. */
function globalsOf<T extends CatalogEntry>(list: readonly T[], kind: CatalogKind): T[] {
  const order = ORDER[kind];
  const globals = list.filter((item) => item.is_global);
  const known = globals
    .filter((item) => order.includes(item.name))
    .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
  const unknown = globals.filter((item) => !order.includes(item.name)).sort(byName);
  return [...known, ...unknown];
}

const activeOwnOf = <T extends CatalogEntry>(list: readonly T[]): T[] =>
  list.filter((item) => !item.is_global && !isArchived(item)).sort(byName);

const archivedOf = <T extends CatalogEntry>(list: readonly T[]): T[] =>
  list.filter(isArchived).sort(byName);

const active = <T extends CatalogEntry>(item: T): CatalogOption<T> => ({
  item,
  label: item.name,
  archived: false,
});

const archived = <T extends CatalogEntry>(item: T): CatalogOption<T> => ({
  item,
  label: archivedOptionLabel(item.name),
  archived: true,
});

/** New purchase: globals in order, then the active own items A→Z. */
export function newPurchaseOptions<T extends CatalogEntry>(
  list: readonly T[],
  kind: CatalogKind,
): CatalogOption<T>[] {
  return [...globalsOf(list, kind), ...activeOwnOf(list)].map(active);
}

/** Purchase edit: the new purchase options + the purchase's own item, if archived, at the end. */
export function editPurchaseOptions<T extends CatalogEntry>(
  list: readonly T[],
  kind: CatalogKind,
  currentId: number,
): CatalogOption<T>[] {
  const current = list.find((item) => item.id === currentId && isArchived(item));
  const options = newPurchaseOptions(list, kind);
  return current ? [...options, archived(current)] : options;
}

/** Purchase list filter: the new purchase options + every archived own item A→Z. */
export function filterOptions<T extends CatalogEntry>(
  list: readonly T[],
  kind: CatalogKind,
): CatalogOption<T>[] {
  return [...newPurchaseOptions(list, kind), ...archivedOf(list).map(archived)];
}

/** Settings: active own items A→Z, globals in order, archived own items A→Z. */
export function settingsLists<T extends CatalogEntry>(
  list: readonly T[],
  kind: CatalogKind,
): SettingsLists<T> {
  return { own: activeOwnOf(list), globals: globalsOf(list, kind), archived: archivedOf(list) };
}
