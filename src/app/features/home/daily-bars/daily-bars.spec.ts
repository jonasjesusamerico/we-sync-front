import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OVERVIEW_EXAMPLE } from '../../../../testing/api-examples';
import { text } from '../../../../testing/dom';
import type { DayAmount, MonthOverview } from '../../purchases/data/purchase.models';
import { DailyBars } from './daily-bars';

@Component({
  imports: [DailyBars],
  template: `<ws-daily-bars [overview]="overview()" />`,
})
class Host {
  readonly overview = signal<MonthOverview>(OVERVIEW_EXAMPLE);
}

/** formatBrl puts U+00A0 after "R$". */
const plain = (s: string | null): string => (s ?? '').replace(/\u00a0/g, ' ');

const days = (length: number, amounts: Readonly<Record<number, string>> = {}): DayAmount[] =>
  Array.from({ length }, (_, i) => ({
    day: i + 1,
    amount: amounts[i + 1] ?? '0',
    forecast: false,
  }));

describe('DailyBars (gastos por dia)', () => {
  async function render(overview: MonthOverview = OVERVIEW_EXAMPLE) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.overview.set(overview);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('barras e pico (CA-02)', async () => {
    const root = await render();
    const bars = [...root.querySelectorAll<HTMLElement>('.ws-bar')];
    expect(bars).toHaveLength(30);
    const peak = bars[24];
    expect(peak.classList).toContain('is-peak');
    expect(peak.classList).toContain('is-forecast');
    expect(peak.querySelector('span')!.style.height).toBe('100%');
    expect(plain(peak.getAttribute('title'))).toBe('Dia 25: R$ 1.000,00 (previsto)');
    expect(bars[7].classList).toContain('is-empty');
    expect(root.querySelectorAll('.is-peak')).toHaveLength(1);
    expect(text(root.querySelector('#daily-peak'))).toBe('Pico dia 25');
    expect(text(root.querySelector('#daily-title'))).toBe('Gastos por dia');
    expect(text(root.querySelector('.ws-card-sub'))).toBe(
      'Passe o mouse sobre a barra para ver o valor',
    );
  });

  it('rótulo e lista acessíveis', async () => {
    const root = await render();
    const chart = root.querySelector('#daily-bars')!;
    expect(chart.getAttribute('role')).toBe('img');
    expect(chart.getAttribute('aria-label')).toBe('Gráfico de gastos por dia de novembro');
    const items = [...root.querySelectorAll('#daily-values li')].map((li) => plain(text(li)));
    expect(items).toEqual([
      'Dia 2: R$ 100,00',
      'Dia 5: R$ 100,00',
      'Dia 25: R$ 1.000,00 (previsto)',
    ]);
    expect(root.querySelector('#daily-values')!.classList).toContain('visually-hidden');
  });

  it.each([
    [29, '1 8 15 22 29'],
    [28, '1 8 15 22 28'],
  ])('eixo pelo mês (CA-15): %i dias', async (n, axis) => {
    // The template has no spaces between the ticks; the axis is a flex row.
    const root = await render({
      ...OVERVIEW_EXAMPLE,
      days_in_month: n,
      peak_day: 3,
      daily: days(n, { 3: '10' }),
    });
    expect(root.querySelectorAll('.ws-bar')).toHaveLength(n);
    const axisEl = root.querySelector('.ws-bars-axis')!;
    expect([...axisEl.querySelectorAll('span')].map((span) => text(span)).join(' ')).toBe(axis);
    expect(axisEl.getAttribute('aria-hidden')).toBe('true');
  });

  it('mês passado sem previsto (CA-09)', async () => {
    const root = await render({
      ...OVERVIEW_EXAMPLE,
      peak_day: 4,
      daily: days(30, { 4: '30', 12: '20', 28: '10' }),
    });
    expect(root.querySelectorAll('.is-forecast')).toHaveLength(0);
    expect(text(root.querySelector('#daily-values'))).not.toContain('(previsto)');
  });

  it('empate: só o primeiro (CA-03)', async () => {
    const root = await render({
      ...OVERVIEW_EXAMPLE,
      peak_day: 2,
      daily: days(30, { 2: '100', 5: '100' }),
    });
    expect(text(root.querySelector('#daily-peak'))).toBe('Pico dia 2');
    const peaks = [...root.querySelectorAll('.ws-bar.is-peak')];
    expect(peaks).toHaveLength(1);
    expect(plain(peaks[0].getAttribute('title'))).toBe('Dia 2: R$ 100,00');
  });

  it('sem pico quando nada foi gasto', async () => {
    const root = await render({ ...OVERVIEW_EXAMPLE, peak_day: null, daily: days(30) });
    expect(root.querySelector('#daily-peak')).toBeNull();
  });
});
