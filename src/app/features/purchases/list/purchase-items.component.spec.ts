import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { Location } from '@angular/common';
import { Component, LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { purchase } from '../../../../testing/purchases-contract';
import { ListQuery } from '../list-query';
import { PurchaseItemsComponent } from './purchase-items.component';
import { PurchaseRow, toPurchaseRow } from './purchase-row';

registerLocaleData(localePt);

@Component({ template: '' })
class StubPage {}

const ORIGIN: ListQuery = {
  year: 2026,
  month: 10,
  status: null,
  categoryId: null,
  paymentMethodId: null,
  page: 1,
};

describe('PurchaseItemsComponent', () => {
  let fixture: ComponentFixture<PurchaseItemsComponent>;
  let removed: PurchaseRow[];

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'lancamentos/:id', component: StubPage }]),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
      ],
    });
    fixture = TestBed.createComponent(PurchaseItemsComponent);
    fixture.componentRef.setInput('rows', [toPurchaseRow(purchase())]);
    fixture.componentRef.setInput('origin', ORIGIN);
    removed = [];
    fixture.componentInstance.remove.subscribe((r) => removed.push(r));
    await fixture.whenStable();
  });

  const host = () => fixture.nativeElement as HTMLElement;
  const plain = (t: string | null | undefined) => (t ?? '').replace(/\s+/g, ' ').trim();

  it('item compacto', async () => {
    const link = host().querySelector<HTMLAnchorElement>('li a.item')!;
    expect(link.getAttribute('href')).toBe('/lancamentos/42');
    expect(plain(link.querySelector('.description')?.textContent)).toBe('Mercado');
    expect(plain(link.querySelector('.amount')?.textContent)).toBe('R$ 1.234,56');
    expect(plain(link.querySelector('.meta')?.textContent)).toBe('05/10/2026 · Alimentação · Pix');
    expect(plain(link.querySelector('.status')?.textContent)).toBe('Pago');
    link.click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/lancamentos/42');
    expect(TestBed.inject(Location).getState()).toMatchObject({ origin: ORIGIN });
  });

  it('Excluir fora do link', () => {
    const button = host().querySelector<HTMLButtonElement>('button[aria-label="Excluir Mercado"]')!;
    expect(button).not.toBeNull();
    expect(button.closest('a')).toBeNull();
    button.click();
    expect(removed.map((r) => r.id)).toEqual([42]);
  });
});
