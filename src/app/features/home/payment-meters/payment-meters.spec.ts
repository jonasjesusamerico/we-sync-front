import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OVERVIEW_EXAMPLE } from '../../../../testing/api-examples';
import { text } from '../../../../testing/dom';
import type { MonthOverview } from '../../purchases/data/purchase.models';
import { PaymentMeters } from './payment-meters';

@Component({
  imports: [PaymentMeters],
  template: `<ws-payment-meters [overview]="overview()" />`,
})
class Host {
  readonly overview = signal<MonthOverview>(OVERVIEW_EXAMPLE);
}

describe('PaymentMeters (formas de pagamento)', () => {
  async function render(overview: MonthOverview = OVERVIEW_EXAMPLE) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.overview.set(overview);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const rows = (root: HTMLElement) =>
    [...root.querySelectorAll('#pay-meters .ws-meter-row')].map((row) => [
      text(row.querySelector('span')),
      text(row.querySelector('strong')),
    ]);

  it('ordem e barras (CA-05)', async () => {
    const root = await render();
    expect(text(root.querySelector('#pay-title'))).toBe('Formas de pagamento');
    expect(rows(root)).toEqual([
      ['Boleto', 'R$ 1.000,00'],
      ['Pix', 'R$ 160,00'],
      ['Cartão de crédito', 'R$ 40,00'],
    ]);
    const bars = [...root.querySelectorAll<HTMLElement>('#pay-meters .progress')];
    expect(bars.map((bar) => bar.getAttribute('role'))).toEqual(Array(3).fill('progressbar'));
    expect(bars.map((bar) => bar.getAttribute('aria-label'))).toEqual([
      'Boleto',
      'Pix',
      'Cartão de crédito',
    ]);
    expect(bars.map((bar) => bar.getAttribute('aria-valuenow'))).toEqual(['83', '13', '3']);
    expect(bars[0].getAttribute('aria-valuemin')).toBe('0');
    expect(bars[0].getAttribute('aria-valuemax')).toBe('100');
    expect(bars.map((bar) => bar.querySelector<HTMLElement>('.progress-bar')!.style.width)).toEqual(
      ['83%', '13%', '3%'],
    );
  });

  it('forma arquivada aparece', async () => {
    const root = await render({
      ...OVERVIEW_EXAMPLE,
      spent: '10',
      payment_methods: [
        {
          payment_method: { id: 41, name: 'Cartão antigo', is_global: false },
          amount: '10',
          percent: 100,
        },
      ],
    });
    expect(rows(root)).toEqual([['Cartão antigo', 'R$ 10,00']]);
  });
});
