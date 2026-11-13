import { OVERVIEW_EXAMPLE } from '../../../testing/api-examples';
import type { DayAmount, MonthOverview } from '../purchases/data/purchase.models';
import { axisTicks, dailyBars, donutBackground, donutLabel } from './home-charts';

/** formatBrl puts U+00A0 after "R$". */
const plain = (s: string): string => s.replace(/\u00a0/g, ' ');

const days = (amounts: Readonly<Record<number, string>>, length = 30): DayAmount[] =>
  Array.from({ length }, (_, i) => ({
    day: i + 1,
    amount: amounts[i + 1] ?? '0',
    forecast: false,
  }));

describe('home-charts', () => {
  it('barras do exemplo (CA-02)', () => {
    const bars = dailyBars(OVERVIEW_EXAMPLE);
    expect(bars).toHaveLength(30);
    const day = (n: number) => bars[n - 1];
    expect(day(2)).toMatchObject({ height: 10, empty: false, peak: false, forecast: false });
    expect(day(5)).toMatchObject({ height: 10, empty: false });
    expect({ ...day(25), label: plain(day(25).label) }).toEqual({
      day: 25,
      height: 100,
      peak: true,
      forecast: true,
      empty: false,
      label: 'Dia 25: R$ 1.000,00 (previsto)',
    });
    expect(day(8)).toMatchObject({ empty: true, height: 2 });
    expect(plain(day(8).label)).toBe('Dia 8: R$ 0,00');
    expect(day(30)).toMatchObject({ empty: true, forecast: false });
    expect(plain(day(30).label)).toBe('Dia 30: R$ 0,00');
    expect(bars.filter((b) => b.peak).map((b) => b.day)).toEqual([25]);
  });

  it('só o pico em destaque no empate (CA-03)', () => {
    const o: MonthOverview = {
      ...OVERVIEW_EXAMPLE,
      peak_day: 2,
      daily: days({ 2: '100', 5: '100' }),
    };
    expect(
      dailyBars(o)
        .filter((b) => b.peak)
        .map((b) => b.day),
    ).toEqual([2]);
  });

  it('barra mínima de 4%', () => {
    const o: MonthOverview = {
      ...OVERVIEW_EXAMPLE,
      peak_day: 2,
      daily: days({ 1: '0.01', 2: '1000' }),
    };
    expect(dailyBars(o)[0].height).toBe(4);
    expect(dailyBars(o)[1].height).toBe(100);
  });

  it.each([
    [28, [1, 8, 15, 22, 28]],
    [29, [1, 8, 15, 22, 29]],
    [30, [1, 8, 15, 22, 30]],
    [31, [1, 8, 15, 22, 31]],
  ])('eixo com %i dias', (n, ticks) => {
    expect(axisTicks(n)).toEqual(ticks);
  });

  it('rosca pelos centavos', () => {
    expect(donutBackground(OVERVIEW_EXAMPLE)).toBe(
      'conic-gradient(var(--ws-cat-home) 0.00% 83.33%, var(--ws-cat-food) 83.33% 96.67%, ' +
        'var(--ws-cat-transport) 96.67% 100.00%)',
    );
  });

  it('rosca com categoria arquivada e cor neutra', () => {
    const o: MonthOverview = {
      ...OVERVIEW_EXAMPLE,
      spent: '30',
      categories: [
        {
          category: { id: 30, name: 'Bar', is_global: false, icon: 'TAG', color: 'NEUTRAL' },
          amount: '30',
          percent: 100,
        },
      ],
    };
    expect(donutBackground(o)).toBe('conic-gradient(var(--ws-muted) 0.00% 100.00%)');
  });

  it('rótulo da rosca', () => {
    expect(plain(donutLabel(OVERVIEW_EXAMPLE))).toBe(
      'Gastos por categoria: Moradia R$ 1.000,00, Alimentação R$ 160,00, Transporte R$ 40,00',
    );
  });
});
