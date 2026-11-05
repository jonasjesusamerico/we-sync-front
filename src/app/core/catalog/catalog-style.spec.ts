import { PAYMENT_METHODS_EXAMPLE } from '../../../testing/api-examples';
import {
  COLOR_CHOICES,
  DEFAULT_COLOR,
  DEFAULT_ICON,
  ICON_CHOICES,
  PAYMENT_STYLE,
  catalogStyle,
  colorValue,
  editableColor,
  editableIcon,
  findPix,
  iconName,
} from './catalog-style';

describe('catalog-style', () => {
  it('catalogStyle enums', () => {
    expect(catalogStyle({ icon: 'HEART', color: 'LEISURE' })).toEqual({
      icon: 'heart',
      color: 'var(--ws-cat-leisure)',
    });
    expect(catalogStyle({ icon: 'FOOD', color: 'FOOD' })).toEqual({
      icon: 'food',
      color: 'var(--ws-cat-food)',
    });
  });

  it('catalogStyle neutra', () => {
    expect(catalogStyle({ icon: 'TAG', color: 'NEUTRAL' })).toEqual({
      icon: 'tag',
      color: 'var(--ws-muted)',
    });
  });

  it('catalogStyle desconhecido', () => {
    expect(catalogStyle({ icon: 'ROCKET', color: 'PURPLE' })).toEqual({
      icon: 'tag',
      color: 'var(--ws-muted)',
    });
    expect(iconName('toString')).toBe('tag');
    expect(colorValue('constructor')).toBe('var(--ws-muted)');
  });

  it('todos os ícones e cores', () => {
    expect(ICON_CHOICES.map(iconName)).toEqual([
      'tag',
      'heart',
      'smile',
      'book',
      'car',
      'house',
      'food',
      'card',
      'gift',
      'sparkle',
    ]);
    expect(COLOR_CHOICES.map(colorValue)).toEqual([
      'var(--ws-cat-food)',
      'var(--ws-cat-transport)',
      'var(--ws-cat-home)',
      'var(--ws-cat-health)',
      'var(--ws-cat-education)',
      'var(--ws-cat-leisure)',
    ]);
  });

  it('escolhas', () => {
    // ICON_CHOICES and COLOR_CHOICES of configuracoes.html.
    expect(ICON_CHOICES).toEqual([
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
    ]);
    expect(COLOR_CHOICES).toEqual(['FOOD', 'TRANSPORT', 'HOME', 'HEALTH', 'EDUCATION', 'LEISURE']);
    expect(DEFAULT_ICON).toBe('TAG');
    expect(DEFAULT_COLOR).toBe(COLOR_CHOICES[0]);
  });

  it('editableColor', () => {
    expect(editableColor('NEUTRAL')).toBe('FOOD');
    expect(editableColor('X')).toBe('FOOD');
    expect(editableColor('HOME')).toBe('HOME');
    expect(editableIcon('ROCKET')).toBe('TAG');
    expect(editableIcon('GIFT')).toBe('GIFT');
  });

  it('bolha das formas', () => {
    expect(PAYMENT_STYLE).toEqual({ icon: 'card', color: 'var(--ws-primary)' });
  });

  it('Pix', () => {
    expect(findPix(PAYMENT_METHODS_EXAMPLE)?.id).toBe(4);
    expect(findPix(PAYMENT_METHODS_EXAMPLE.filter((m) => m.name !== 'Pix'))).toBeNull();
    expect(findPix([{ name: 'Pix', is_global: false }])).toBeNull();
  });
});
