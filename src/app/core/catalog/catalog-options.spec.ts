import { CATEGORIES_EXAMPLE, PAYMENT_METHODS_EXAMPLE } from '../../../testing/api-examples';
import {
  type CatalogEntry,
  editPurchaseOptions,
  filterOptions,
  newPurchaseOptions,
  settingsLists,
} from './catalog-options';

const shuffled = <T>(list: readonly T[]): T[] => [...list].reverse();
const names = (list: readonly { name: string }[]) => list.map((item) => item.name);
const labels = (list: readonly { label: string }[]) => list.map((option) => option.label);

const GLOBALS = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer'];

const own = (id: number, name: string, archived = false): CatalogEntry => ({
  id,
  name,
  is_global: false,
  archived_at: archived ? '2026-10-20T10:00:00Z' : null,
});

describe('catalog-options', () => {
  it('newPurchaseOptions', () => {
    const input = shuffled(CATEGORIES_EXAMPLE);
    const copy = [...input];
    const options = newPurchaseOptions(input, 'category');
    expect(labels(options)).toEqual([...GLOBALS, 'Bar', 'Pets']);
    expect(options.every((option) => !option.archived)).toBe(true);
    expect(input).toEqual(copy);
  });

  it('editPurchaseOptions', () => {
    const withArchived = editPurchaseOptions(shuffled(CATEGORIES_EXAMPLE), 'category', 32);
    expect(labels(withArchived)).toEqual([...GLOBALS, 'Bar', 'Pets', 'Academia (arquivada)']);
    expect(withArchived.at(-1)).toMatchObject({ archived: true, item: { id: 32 } });

    expect(labels(editPurchaseOptions(CATEGORIES_EXAMPLE, 'category', 31))).toEqual([
      ...GLOBALS,
      'Bar',
      'Pets',
    ]);
  });

  it('filterOptions', () => {
    const list = [...CATEGORIES_EXAMPLE, { ...CATEGORIES_EXAMPLE[6], id: 33, name: 'Zoo' }];
    const options = filterOptions(shuffled(list), 'category');
    expect(labels(options)).toEqual([
      ...GLOBALS,
      'Bar',
      'Pets',
      'Academia (arquivada)',
      'Zoo (arquivada)',
    ]);
    expect(options.filter((option) => option.archived).map((option) => option.item.id)).toEqual([
      32, 33,
    ]);
  });

  it('settingsLists', () => {
    const lists = settingsLists(shuffled(CATEGORIES_EXAMPLE), 'category');
    expect(names(lists.own)).toEqual(['Bar', 'Pets']);
    expect(names(lists.globals)).toEqual(GLOBALS);
    expect(names(lists.archived)).toEqual(['Academia']);
  });

  it('formas na ordem', () => {
    expect(labels(newPurchaseOptions(shuffled(PAYMENT_METHODS_EXAMPLE), 'payment'))).toEqual([
      'Dinheiro',
      'Cartão de crédito',
      'Cartão de débito',
      'Pix',
      'Transferência bancária',
      'Boleto',
      'Vale-refeição',
    ]);
    expect(names(settingsLists(PAYMENT_METHODS_EXAMPLE, 'payment').archived)).toEqual([
      'Cartão antigo',
    ]);
  });

  it('A→Z sem acento e caixa', () => {
    const list = [own(1, 'zebra'), own(2, 'Água'), own(3, 'abacate')];
    expect(names(settingsLists(list, 'category').own)).toEqual(['abacate', 'Água', 'zebra']);
  });

  it('global desconhecida', () => {
    const list: CatalogEntry[] = [
      own(30, 'Bar'),
      { id: 99, name: 'Viagem', is_global: true, archived_at: null },
      ...CATEGORIES_EXAMPLE.filter((c) => c.is_global),
    ];
    expect(labels(newPurchaseOptions(list, 'category'))).toEqual([...GLOBALS, 'Viagem', 'Bar']);
  });

  it('global nunca é arquivada', () => {
    const odd: CatalogEntry = { id: 7, name: 'Lazer', is_global: true, archived_at: 'x' };
    expect(labels(newPurchaseOptions([odd], 'category'))).toEqual(['Lazer']);
    expect(settingsLists([odd], 'category').archived).toEqual([]);
  });
});
