import { CATEGORIES_EXAMPLE, PAYMENT_METHODS_EXAMPLE } from '../../../testing/api-examples';
import {
  GLOBAL_CATEGORY_STYLES,
  NEUTRAL_STYLE,
  categoryStyle,
  findPix,
  sortCategories,
  sortPaymentMethods,
} from './catalog-style';

const names = (list: readonly { name: string }[]) => list.map((item) => item.name);
const shuffled = <T>(list: readonly T[]): T[] => [...list].reverse();

describe('catalog-style', () => {
  it('ordem das categorias', () => {
    const input = shuffled(CATEGORIES_EXAMPLE);
    const copy = [...input];
    expect(names(sortCategories(input))).toEqual([
      'Alimentação',
      'Transporte',
      'Moradia',
      'Saúde',
      'Educação',
      'Lazer',
      'Bar',
      'Pets',
    ]);
    expect(input).toEqual(copy);
  });

  it('globais fora do mapa e próprias juntas, por nome (sem diferenciar acento)', () => {
    const list = [
      { name: 'Viagem', is_global: true },
      { name: 'Água', is_global: false },
      { name: 'Lazer', is_global: true },
      { name: 'Alimentação', is_global: false },
    ];
    expect(names(sortCategories(list))).toEqual(['Lazer', 'Água', 'Alimentação', 'Viagem']);
  });

  it('estilo', () => {
    expect(categoryStyle({ name: 'Alimentação', is_global: true })).toEqual({
      icon: 'food',
      color: 'var(--ws-cat-food)',
    });
    expect(categoryStyle({ name: 'Alimentação', is_global: false })).toEqual(NEUTRAL_STYLE);
    expect(categoryStyle({ name: 'Viagem', is_global: true })).toEqual(NEUTRAL_STYLE);
    expect(NEUTRAL_STYLE).toEqual({ icon: 'tag', color: 'var(--ws-muted)' });
  });

  it('mapa = seed da API', () => {
    const seed = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer'];
    expect(GLOBAL_CATEGORY_STYLES.map((s) => s.name)).toEqual(seed);
    for (const name of seed) {
      expect(categoryStyle({ name, is_global: true })).not.toEqual(NEUTRAL_STYLE);
    }
  });

  it('formas', () => {
    const vale = { ...PAYMENT_METHODS_EXAMPLE[0], id: 30, name: 'Vale', is_global: false };
    expect(names(sortPaymentMethods(shuffled([...PAYMENT_METHODS_EXAMPLE, vale])))).toEqual([
      'Dinheiro',
      'Cartão de crédito',
      'Cartão de débito',
      'Pix',
      'Transferência bancária',
      'Boleto',
      'Vale',
    ]);
    expect(findPix(PAYMENT_METHODS_EXAMPLE)?.id).toBe(4);
    expect(findPix(PAYMENT_METHODS_EXAMPLE.filter((m) => m.name !== 'Pix'))).toBeNull();
    expect(findPix([{ name: 'Pix', is_global: false }])).toBeNull();
  });
});
