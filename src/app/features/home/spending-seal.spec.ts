import {
  SUMMARY_FULL_MONTH_EXAMPLE,
  SUMMARY_NO_BASE_EXAMPLE,
  SUMMARY_UNTIL_DAY_EXAMPLE,
} from '../../../testing/api-examples';
import { spendingSeal } from './spending-seal';

const UNTIL_DAY = SUMMARY_UNTIL_DAY_EXAMPLE.comparison;

describe('spendingSeal', () => {
  it('LESS até o dia (CA-03)', () => {
    expect(spendingSeal(UNTIL_DAY)).toEqual({
      text: '50% a menos que outubro até o dia 10',
      icon: 'arrowDown',
    });
  });

  it('MORE no mês inteiro (CA-04)', () => {
    expect(spendingSeal(SUMMARY_FULL_MONTH_EXAMPLE.comparison)).toEqual({
      text: '10% a mais que agosto',
      icon: 'arrowUp',
    });
  });

  it('NO_BASE (CA-05)', () => {
    expect(spendingSeal(SUMMARY_NO_BASE_EXAMPLE.comparison)).toEqual({
      text: 'Sem compras em agosto para comparar.',
      icon: null,
    });
  });

  it('EQUAL e NO_BASE até o dia', () => {
    expect(spendingSeal({ ...UNTIL_DAY, result: 'EQUAL', percent: 0 })).toEqual({
      text: 'Igual a outubro até o dia 10',
      icon: null,
    });
    expect(spendingSeal({ ...UNTIL_DAY, result: 'NO_BASE', percent: null })).toEqual({
      text: 'Sem compras em outubro até o dia 10 para comparar.',
      icon: null,
    });
  });
});
