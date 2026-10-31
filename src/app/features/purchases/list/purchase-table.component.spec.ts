import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { Location } from '@angular/common';
import { Component, LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { purchase } from '../../../../testing/purchases-contract';
import { ListQuery } from '../list-query';
import { PurchaseRow, toPurchaseRow } from './purchase-row';
import { PurchaseTableComponent } from './purchase-table.component';

registerLocaleData(localePt);

@Component({ template: '' })
class StubPage {}

const ORIGIN: ListQuery = {
  year: 2026,
  month: 9,
  status: 'PENDING',
  categoryId: null,
  paymentMethodId: null,
  page: 2,
};

describe('PurchaseTableComponent', () => {
  let fixture: ComponentFixture<PurchaseTableComponent>;
  let removed: PurchaseRow[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'lancamentos/:id', component: StubPage }]),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
      ],
    });
  });

  async function render(rows: PurchaseRow[]) {
    fixture = TestBed.createComponent(PurchaseTableComponent);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('origin', ORIGIN);
    removed = [];
    fixture.componentInstance.remove.subscribe((r) => removed.push(r));
    await fixture.whenStable();
  }

  const host = () => fixture.nativeElement as HTMLElement;
  const dataRows = () => Array.from(host().querySelectorAll<HTMLTableRowElement>('tbody tr'));
  const two = () => [
    toPurchaseRow(purchase()),
    toPurchaseRow(purchase({ id: 41, description: 'Padaria' })),
  ];

  it('colunas da tabela', async () => {
    await render(two());
    const headers = Array.from(host().querySelectorAll('th')).map((th) => th.textContent?.trim());
    expect(headers).toEqual([
      'Data',
      'Descrição',
      'Categoria',
      'Forma de pagamento',
      'Valor',
      'Status',
      'Ações',
    ]);
    expect(host().querySelectorAll('th')[6].querySelector('.visually-hidden')).not.toBeNull();
    expect(dataRows()).toHaveLength(2);
  });

  it('ordem recebida', async () => {
    await render(
      [42, 41, 40].map((id) => toPurchaseRow(purchase({ id, description: `Item ${id}` }))),
    );
    expect(dataRows().map((tr) => tr.querySelector('.description')?.textContent?.trim())).toEqual([
      'Item 42',
      'Item 41',
      'Item 40',
    ]);
  });

  it('link da descrição', async () => {
    await render(two());
    const link = dataRows()[0].querySelector<HTMLAnchorElement>('a.description-link')!;
    expect(link.getAttribute('href')).toBe('/lancamentos/42');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    link.click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/lancamentos/42');
    expect(TestBed.inject(Location).getState()).toMatchObject({ origin: ORIGIN });
    // O clique no link não dispara também o clique da linha.
    expect(navigate).not.toHaveBeenCalled();
  });

  it('clique na linha', async () => {
    await render(two());
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    dataRows()[0].querySelector<HTMLElement>('.category')!.click();
    expect(navigate).toHaveBeenCalledWith(['/lancamentos', 42], { state: { origin: ORIGIN } });
  });

  it('Excluir não abre', async () => {
    await render(two());
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    host().querySelector<HTMLButtonElement>('button[aria-label="Excluir Mercado"]')!.click();
    expect(removed.map((r) => r.id)).toEqual([42]);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('cancelado riscado', async () => {
    await render([toPurchaseRow(purchase({ status: 'CANCELED' }))]);
    const tr = dataRows()[0];
    expect(tr.classList.contains('canceled')).toBe(true);
    const amount = tr.querySelector<HTMLElement>('td.amount')!;
    expect(getComputedStyle(amount).textDecoration).toContain('line-through');
  });
});
