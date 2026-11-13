import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OVERVIEW_EXAMPLE } from '../../../../testing/api-examples';
import { text } from '../../../../testing/dom';
import { ICON_PATHS } from '../../../shared/ui/icon/icons';
import type { MonthOverview } from '../../purchases/data/purchase.models';
import { MonthKpis } from './month-kpis';

@Component({
  imports: [MonthKpis],
  template: `<ws-month-kpis [overview]="overview()" />`,
})
class Host {
  readonly overview = signal<MonthOverview>(OVERVIEW_EXAMPLE);
}

describe('MonthKpis (indicadores)', () => {
  async function render(overview: MonthOverview = OVERVIEW_EXAMPLE) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.overview.set(overview);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('indicadores do exemplo (CA-01)', async () => {
    const root = await render();
    const tiles = [...root.querySelectorAll('.ws-kpi')];
    expect(
      tiles.map((tile) => [...tile.querySelectorAll('.min-w-0 > div')].map((div) => text(div))),
    ).toEqual([
      ['Já pago', 'R$ 200,00', '3 compras'],
      ['A pagar', 'R$ 1.000,00', '1 compra'],
      ['Compras', '4', 'neste mês'],
      ['Média por dia', 'R$ 20,00', 'em 10 dias'],
    ]);
    const icons = tiles.map((tile) => tile.querySelector('.ws-kpi-icon')!);
    expect(icons.map((icon) => icon.querySelector('path')!.getAttribute('d'))).toEqual([
      ICON_PATHS.check,
      ICON_PATHS.clock,
      ICON_PATHS.receipt,
      ICON_PATHS.calendar,
    ]);
    expect(icons[0].classList).toContain('is-success');
    expect(icons[1].classList).toContain('is-warning');
    expect(text(root.querySelector('#kpi-paid'))).toBe('R$ 200,00');
    expect(text(root.querySelector('#kpi-count'))).toBe('4');
    expect(text(root.querySelector('#kpi-avg-foot'))).toBe('em 10 dias');
    expect(root.querySelector('ws-month-kpis')!.classList).toContain('h-100');
  });

  it('um dia e zero compras (CA-16)', async () => {
    const root = await render({
      ...OVERVIEW_EXAMPLE,
      paid: { amount: '50', count: 1 },
      pending: { amount: '0', count: 0 },
      active_count: 1,
      daily_average: { amount: '50', days: 1 },
    });
    expect(text(root.querySelector('#kpi-paid-n'))).toBe('1 compra');
    expect(text(root.querySelector('#kpi-pending-n'))).toBe('0 compras');
    expect(text(root.querySelector('#kpi-avg'))).toBe('R$ 50,00');
    expect(text(root.querySelector('#kpi-avg-foot'))).toBe('em 1 dia');
  });

  it('mês passado divide pelo mês (CA-09)', async () => {
    const root = await render({ ...OVERVIEW_EXAMPLE, daily_average: { amount: '30', days: 30 } });
    expect(text(root.querySelector('#kpi-avg'))).toBe('R$ 30,00');
    expect(text(root.querySelector('#kpi-avg-foot'))).toBe('em 30 dias');
  });
});
