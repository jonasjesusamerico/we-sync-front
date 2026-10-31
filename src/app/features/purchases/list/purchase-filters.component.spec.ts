import { ComponentFixture, TestBed } from '@angular/core/testing';

import { nativeSelect } from '../../../../testing/native-select';
import { GLOBAL_CATEGORIES, GLOBAL_PAYMENT_METHODS } from '../../../../testing/purchases-contract';
import { sortOptions } from '../options.api';
import {
  LABEL_CATEGORY,
  LABEL_CLEAR_FILTERS,
  LABEL_FILTERS,
  LABEL_PAYMENT_METHOD,
  LABEL_STATUS,
} from '../purchase.messages';
import { PurchaseStatus } from '../purchase.models';
import { FiltersPatch, PurchaseFiltersComponent } from './purchase-filters.component';

describe('PurchaseFiltersComponent', () => {
  let fixture: ComponentFixture<PurchaseFiltersComponent>;
  let changes: FiltersPatch[];
  let clears: number;

  async function render(
    values: {
      status?: PurchaseStatus | null;
      categoryId?: number | null;
      paymentMethodId?: number | null;
    } = {},
  ) {
    fixture = TestBed.createComponent(PurchaseFiltersComponent);
    fixture.componentRef.setInput('status', values.status ?? null);
    fixture.componentRef.setInput('categoryId', values.categoryId ?? null);
    fixture.componentRef.setInput('paymentMethodId', values.paymentMethodId ?? null);
    fixture.componentRef.setInput('categories', sortOptions(GLOBAL_CATEGORIES));
    fixture.componentRef.setInput('paymentMethods', sortOptions(GLOBAL_PAYMENT_METHODS));
    changes = [];
    clears = 0;
    fixture.componentInstance.filtersChange.subscribe((p) => changes.push(p));
    fixture.componentInstance.clear.subscribe(() => clears++);
    await fixture.whenStable();
  }

  const host = () => fixture.nativeElement as HTMLElement;
  const clearButton = () =>
    Array.from(host().querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === LABEL_CLEAR_FILTERS,
    );
  /** Os três selects estão na ordem Status, Categoria, Forma de pagamento (conferida em `grupo de filtros`). */
  function select(label: string) {
    const all = host().querySelectorAll('select');
    return nativeSelect(all[[LABEL_STATUS, LABEL_CATEGORY, LABEL_PAYMENT_METHOD].indexOf(label)]);
  }

  it('grupo de filtros com nome', async () => {
    await render();
    const group = host().querySelector('[role="group"]');
    expect(group?.getAttribute('aria-label')).toBe(LABEL_FILTERS);
    const labels = Array.from(host().querySelectorAll('label')).map((l) => l.textContent?.trim());
    expect(labels).toEqual([LABEL_STATUS, LABEL_CATEGORY, LABEL_PAYMENT_METHOD]);
  });

  it('filtros mostram o valor atual', async () => {
    await render({ status: 'PENDING', categoryId: 1 });
    expect(await select(LABEL_STATUS).getValueText()).toBe('Pendente');
    expect(await select(LABEL_CATEGORY).getValueText()).toBe('Alimentação');
    expect(await select(LABEL_PAYMENT_METHOD).getValueText()).toBe('Todas');
  });

  it('Todos aparece selecionado', async () => {
    await render();
    expect(await select(LABEL_STATUS).getValueText()).toBe('Todos');
  });

  it('escolher filtro emite', async () => {
    await render();
    const status = select(LABEL_STATUS);
    status.select('Pago');
    expect(changes).toEqual([{ status: 'PAID' }]);
  });

  it('voltar a Todos', async () => {
    await render({ status: 'PENDING' });
    const status = select(LABEL_STATUS);
    status.select('Todos');
    expect(changes).toEqual([{ status: null }]);
  });

  it('categoria e forma emitem o id', async () => {
    await render();
    const category = select(LABEL_CATEGORY);
    category.select('Moradia');
    const payment = select(LABEL_PAYMENT_METHOD);
    payment.select('Pix');
    expect(changes).toEqual([{ categoryId: 3 }, { paymentMethodId: 4 }]);
  });

  it('opções na ordem recebida', async () => {
    await render();
    const category = select(LABEL_CATEGORY);
    const texts = await Promise.all((await category.getOptions()).map((o) => o.getText()));
    expect(texts).toEqual([
      'Todas',
      'Alimentação',
      'Educação',
      'Lazer',
      'Moradia',
      'Saúde',
      'Transporte',
    ]);
  });

  it('Limpar filtros', async () => {
    await render();
    expect(clearButton()).toBeUndefined();
    await render({ categoryId: 1 });
    expect(clearButton()).toBeDefined();
    clearButton()!.click();
    expect(clears).toBe(1);
  });
});
