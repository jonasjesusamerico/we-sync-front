import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { ListQuery } from '../list-query';
import {
  LABEL_ALL_OPTIONS,
  LABEL_ALL_STATUSES,
  LABEL_CATEGORY,
  LABEL_CLEAR_FILTERS,
  LABEL_FILTERS,
  LABEL_PAYMENT_METHOD,
  LABEL_STATUS,
  STATUS_LABELS,
} from '../purchase.messages';
import { Option, PURCHASE_STATUSES, PurchaseStatus } from '../purchase.models';

export type FiltersPatch = Partial<Pick<ListQuery, 'status' | 'categoryId' | 'paymentMethodId'>>;

/** RF-06: filtros de status, categoria e forma de pagamento. Só emite; quem navega é a página. */
@Component({
  selector: 'app-purchase-filters',
  template: `
    <div class="group" role="group" [attr.aria-label]="text.filters">
      <div class="filter">
        <label class="form-label" for="filter-status">{{ text.status }}</label>
        <select id="filter-status" class="form-select" (change)="onStatus($event)">
          <option value="" [selected]="status() === null">{{ text.allStatuses }}</option>
          @for (s of statuses; track s) {
            <option [value]="s" [selected]="status() === s">{{ statusLabels[s] }}</option>
          }
        </select>
      </div>
      <div class="filter">
        <label class="form-label" for="filter-category">{{ text.category }}</label>
        <select id="filter-category" class="form-select" (change)="onCategory($event)">
          <option value="" [selected]="categoryId() === null">{{ text.allOptions }}</option>
          @for (o of categories(); track o.id) {
            <option [value]="o.id" [selected]="categoryId() === o.id">{{ o.name }}</option>
          }
        </select>
      </div>
      <div class="filter">
        <label class="form-label" for="filter-payment-method">{{ text.paymentMethod }}</label>
        <select id="filter-payment-method" class="form-select" (change)="onPaymentMethod($event)">
          <option value="" [selected]="paymentMethodId() === null">{{ text.allOptions }}</option>
          @for (o of paymentMethods(); track o.id) {
            <option [value]="o.id" [selected]="paymentMethodId() === o.id">{{ o.name }}</option>
          }
        </select>
      </div>
      @if (active()) {
        <button type="button" class="btn btn-link clear" (click)="clear.emit()">
          {{ text.clear }}
        </button>
      }
    </div>
  `,
  styles: `
    @use '../../../../styles/breakpoints' as bp;

    .group {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 8px 16px;
    }

    .filter {
      flex: 1 1 100%;
    }

    .form-label {
      margin-bottom: 0.25rem;
      font-size: 0.8rem;
      color: var(--app-muted);
    }

    @media (min-width: bp.$wide) {
      .filter {
        flex: 0 1 200px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseFiltersComponent {
  readonly status = input.required<PurchaseStatus | null>();
  readonly categoryId = input.required<number | null>();
  readonly paymentMethodId = input.required<number | null>();
  readonly categories = input.required<readonly Option[]>();
  readonly paymentMethods = input.required<readonly Option[]>();
  readonly filtersChange = output<FiltersPatch>();
  readonly clear = output<void>();

  protected readonly active = computed(
    () => this.status() !== null || this.categoryId() !== null || this.paymentMethodId() !== null,
  );
  protected readonly statuses = PURCHASE_STATUSES;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly text = {
    filters: LABEL_FILTERS,
    status: LABEL_STATUS,
    category: LABEL_CATEGORY,
    paymentMethod: LABEL_PAYMENT_METHOD,
    allStatuses: LABEL_ALL_STATUSES,
    allOptions: LABEL_ALL_OPTIONS,
    clear: LABEL_CLEAR_FILTERS,
  };

  protected onStatus(event: Event): void {
    const value = selectValue(event);
    this.filtersChange.emit({ status: value === '' ? null : (value as PurchaseStatus) });
  }

  protected onCategory(event: Event): void {
    this.filtersChange.emit({ categoryId: idOf(selectValue(event)) });
  }

  protected onPaymentMethod(event: Event): void {
    this.filtersChange.emit({ paymentMethodId: idOf(selectValue(event)) });
  }
}

function selectValue(event: Event): string {
  return (event.target as HTMLSelectElement).value;
}

/** `''` (Todas) → `null`; o resto é o `id` da opção. */
function idOf(value: string): number | null {
  return value === '' ? null : Number(value);
}
