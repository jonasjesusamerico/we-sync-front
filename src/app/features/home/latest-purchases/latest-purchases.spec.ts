import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { OVERVIEW_EXAMPLE } from '../../../../testing/api-examples';
import { text } from '../../../../testing/dom';
import type { MonthOverview } from '../../purchases/data/purchase.models';
import { LatestPurchases } from './latest-purchases';

@Component({
  imports: [LatestPurchases],
  template: `<ws-latest-purchases [overview]="overview()" />`,
})
class Host {
  readonly overview = signal<MonthOverview>(OVERVIEW_EXAMPLE);
}

@Component({ template: '<h1>Compras</h1>' })
class Blank {}

describe('LatestPurchases (últimas compras)', () => {
  async function render(overview: MonthOverview = OVERVIEW_EXAMPLE) {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'compras', component: Blank }])],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.overview.set(overview);
    await fixture.whenStable();
    return { fixture, root: fixture.nativeElement as HTMLElement };
  }

  it('ordem e linhas (CA-06)', async () => {
    const { root } = await render();
    const rows = [...root.querySelectorAll('#last-list li.ws-tx')];
    expect(rows.map((row) => text(row.querySelector('.ws-tx-title')))).toEqual([
      'Aluguel',
      'Cinema',
      'Padaria',
      'Uber',
      'Mercado',
    ]);
    const [aluguel, cinema] = rows;
    expect(text(aluguel.querySelector('.ws-tx-meta'))).toBe('25 nov · Boleto');
    expect(text(aluguel.querySelector('.ws-tx-amount'))).toBe('R$ 1.000,00');
    const pill = aluguel.querySelector('.ws-status')!;
    expect(text(pill)).toBe('Pendente');
    expect(pill.classList).toContain('is-pending');
    expect(aluguel.classList).not.toContain('is-canceled');
    expect(cinema.classList).toContain('is-canceled');
    expect(text(cinema.querySelector('.ws-status'))).toBe('Cancelada');
    expect(cinema.querySelector('.ws-status')!.classList).toContain('is-canceled');
    expect(text(rows[2].querySelector('.ws-status'))).toBe('Paga');
    expect(aluguel.querySelector('ws-category-bubble')!.getAttribute('style')).toContain(
      'var(--ws-cat-home)',
    );
  });

  it('Ver todas sem filtros (CA-06)', async () => {
    const { root, fixture } = await render();
    const link = root.querySelector<HTMLAnchorElement>('a#last-all')!;
    expect(text(link)).toBe('Ver todas');
    expect(link.getAttribute('href')).toBe('/compras?ano=2026&mes=11');
    link.click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/compras?ano=2026&mes=11');
  });

  it('descrição longa com dica', async () => {
    const description = 'x'.repeat(120);
    const { root } = await render({
      ...OVERVIEW_EXAMPLE,
      latest: [{ ...OVERVIEW_EXAMPLE.latest[0], description }],
    });
    const title = root.querySelector('.ws-tx-title')!;
    expect(text(title)).toBe(description);
    expect(title.getAttribute('title')).toBe(description);
  });

  it('linhas não são links', async () => {
    const { root } = await render();
    expect(root.querySelectorAll('#last-list a')).toHaveLength(0);
  });
});
