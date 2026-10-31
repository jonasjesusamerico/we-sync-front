import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatSelectHarness } from '@angular/material/select/testing';

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } }],
    });
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => el.remove());
  });

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
    return TestbedHarnessEnvironment.loader(fixture);
  }

  const host = () => fixture.nativeElement as HTMLElement;
  const clearButton = () =>
    Array.from(host().querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === LABEL_CLEAR_FILTERS,
    );
  /** Os três selects estão na ordem Status, Categoria, Forma de pagamento (conferida em `grupo de filtros`). */
  async function select(loader: Awaited<ReturnType<typeof render>>, label: string) {
    const all = await loader.getAllHarnesses(MatSelectHarness);
    return all[[LABEL_STATUS, LABEL_CATEGORY, LABEL_PAYMENT_METHOD].indexOf(label)];
  }

  it('grupo de filtros com nome', async () => {
    await render();
    const group = host().querySelector('[role="group"]');
    expect(group?.getAttribute('aria-label')).toBe(LABEL_FILTERS);
    const labels = Array.from(host().querySelectorAll('mat-label')).map((l) =>
      l.textContent?.trim(),
    );
    expect(labels).toEqual([LABEL_STATUS, LABEL_CATEGORY, LABEL_PAYMENT_METHOD]);
  });

  it('filtros mostram o valor atual', async () => {
    const loader = await render({ status: 'PENDING', categoryId: 1 });
    expect(await (await select(loader, LABEL_STATUS)).getValueText()).toBe('Pendente');
    expect(await (await select(loader, LABEL_CATEGORY)).getValueText()).toBe('Alimentação');
    expect(await (await select(loader, LABEL_PAYMENT_METHOD)).getValueText()).toBe('Todas');
  });

  it('Todos aparece selecionado', async () => {
    const loader = await render();
    expect(await (await select(loader, LABEL_STATUS)).getValueText()).toBe('Todos');
  });

  it('escolher filtro emite', async () => {
    const loader = await render();
    const status = await select(loader, LABEL_STATUS);
    await status.open();
    await status.clickOptions({ text: 'Pago' });
    expect(changes).toEqual([{ status: 'PAID' }]);
  });

  it('voltar a Todos', async () => {
    const loader = await render({ status: 'PENDING' });
    const status = await select(loader, LABEL_STATUS);
    await status.open();
    await status.clickOptions({ text: 'Todos' });
    expect(changes).toEqual([{ status: null }]);
  });

  it('categoria e forma emitem o id', async () => {
    const loader = await render();
    const category = await select(loader, LABEL_CATEGORY);
    await category.open();
    await category.clickOptions({ text: 'Moradia' });
    const payment = await select(loader, LABEL_PAYMENT_METHOD);
    await payment.open();
    await payment.clickOptions({ text: 'Pix' });
    expect(changes).toEqual([{ categoryId: 3 }, { paymentMethodId: 4 }]);
  });

  it('opções na ordem recebida', async () => {
    const loader = await render();
    const category = await select(loader, LABEL_CATEGORY);
    await category.open();
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
