import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OVERVIEW_EXAMPLE } from '../../../../testing/api-examples';
import { text } from '../../../../testing/dom';
import type { MonthOverview } from '../../purchases/data/purchase.models';
import { CategoryDonut } from './category-donut';

@Component({
  imports: [CategoryDonut],
  template: `<ws-category-donut [overview]="overview()" />`,
})
class Host {
  readonly overview = signal<MonthOverview>(OVERVIEW_EXAMPLE);
}

const plain = (s: string | null): string => (s ?? '').replace(/\u00a0/g, ' ');

const only = (name: string): MonthOverview => ({
  ...OVERVIEW_EXAMPLE,
  spent: '40',
  categories: [
    {
      category: { id: 31, name, is_global: false, icon: 'HEART', color: 'LEISURE' },
      amount: '40',
      percent: 100,
    },
  ],
});

describe('CategoryDonut (por categoria)', () => {
  async function render(overview: MonthOverview = OVERVIEW_EXAMPLE) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.overview.set(overview);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const legend = (root: HTMLElement) =>
    [...root.querySelectorAll('#cat-legend li')].map((li) =>
      [...li.children].map((child) => text(child)).filter(Boolean),
    );

  it('ordem, percentuais e destaque (CA-04)', async () => {
    const root = await render();
    expect(legend(root)).toEqual([
      ['Moradia83%', 'R$ 1.000,00'],
      ['Alimentação13%', 'R$ 160,00'],
      ['Transporte3%', 'R$ 40,00'],
    ]);
    expect(
      [...root.querySelectorAll('#cat-legend .ws-legend-pct')].map((pct) => text(pct)),
    ).toEqual(['83%', '13%', '3%']);
    expect(text(root.querySelector('#cat-legend'))).not.toContain('Lazer');
    const top = root.querySelector('#cat-top')!;
    expect(text(top)).toBe('Moradia');
    expect(top.getAttribute('title')).toBe('Moradia');
    expect(text(root.querySelector('.ws-donut-center small'))).toBe('maior gasto');
    expect(text(root.querySelector('#cat-title'))).toBe('Por categoria');
  });

  it('cores e rosca (D-17: o conic-gradient chega ao DOM)', async () => {
    const root = await render();
    const dots = [...root.querySelectorAll<HTMLElement>('#cat-legend .ws-dot')];
    expect(dots.map((dot) => dot.style.background)).toEqual([
      'var(--ws-cat-home)',
      'var(--ws-cat-food)',
      'var(--ws-cat-transport)',
    ]);
    const donut = root.querySelector<HTMLElement>('#cat-donut')!;
    expect(donut.style.background).toContain('conic-gradient(');
    expect(donut.style.background).toContain('var(--ws-cat-home) 0.00% 83.33%');
    expect(donut.getAttribute('role')).toBe('img');
    expect(plain(donut.getAttribute('aria-label'))).toBe(
      'Gastos por categoria: Moradia R$ 1.000,00, Alimentação R$ 160,00, Transporte R$ 40,00',
    );
  });

  it('arquivada com nome, ícone e cor (CA-08)', async () => {
    const root = await render(only('Pets'));
    expect(legend(root)).toEqual([['Pets100%', 'R$ 40,00']]);
    expect(root.querySelector<HTMLElement>('#cat-legend .ws-dot')!.style.background).toBe(
      'var(--ws-cat-leisure)',
    );
    expect(text(root.querySelector('#cat-top'))).toBe('Pets');
  });

  it('nome longo no centro', async () => {
    const name = 'Categoria com um nome bem comprido demais';
    expect(name.length).toBeGreaterThanOrEqual(40);
    const root = await render(only(name));
    expect(root.querySelector('#cat-top')!.getAttribute('title')).toBe(name);
  });
});
