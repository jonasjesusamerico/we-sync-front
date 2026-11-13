import type { Comparison } from '../purchases/data/purchase.models';
import {
  SUMMARY_FULL_MONTH_EXAMPLE,
  SUMMARY_SHORTER_MONTH_EXAMPLE,
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

  describe('mês anterior mais curto (feature 007, RN-04)', () => {
    const SHORTER = SUMMARY_SHORTER_MONTH_EXAMPLE.comparison;

    it('LESS com mês anterior mais curto (CA-13)', () => {
      expect(spendingSeal(SHORTER)).toEqual({
        text: '5% a menos que setembro (até o dia 31; setembro até o dia 30)',
        icon: 'arrowDown',
      });
    });

    it('MORE e EQUAL mais curto', () => {
      expect(spendingSeal({ ...SHORTER, result: 'MORE', percent: 12 })).toEqual({
        text: '12% a mais que setembro (até o dia 31; setembro até o dia 30)',
        icon: 'arrowUp',
      });
      expect(spendingSeal({ ...SHORTER, result: 'EQUAL', percent: 0 })).toEqual({
        text: 'Igual a setembro (até o dia 31; setembro até o dia 30)',
        icon: null,
      });
    });

    it('NO_BASE mais curto sem dia', () => {
      expect(spendingSeal({ ...SHORTER, result: 'NO_BASE', percent: null })).toEqual({
        text: 'Sem compras em setembro para comparar.',
        icon: null,
      });
    });

    it('fevereiro em 30/03', () => {
      const march: Comparison = {
        ...SHORTER,
        until_day: 30,
        previous_until_day: 28,
        previous_month: 2,
        result: 'LESS',
        percent: 50,
      };
      expect(spendingSeal(march).text).toBe(
        '50% a menos que fevereiro (até o dia 30; fevereiro até o dia 28)',
      );
    });

    it('mesmo dia continua no formato da 005 (CA-14)', () => {
      expect(spendingSeal(UNTIL_DAY).text).toBe('50% a menos que outubro até o dia 10');
    });

    it('sem previous_until_day (API antiga, D-09)', () => {
      const old = { ...SHORTER, previous_until_day: undefined } as unknown as Comparison;
      expect(spendingSeal(old).text).toBe('5% a menos que setembro até o dia 31');
      expect(spendingSeal({ ...SHORTER, previous_until_day: null }).text).toBe(
        '5% a menos que setembro até o dia 31',
      );
    });
  });
});
