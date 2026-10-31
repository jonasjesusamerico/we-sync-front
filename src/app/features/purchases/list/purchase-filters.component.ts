import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';

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
  imports: [MatFormField, MatLabel, MatSelect, MatOption, MatButton],
  template: `
    <div class="group" role="group" [attr.aria-label]="text.filters">
      <mat-form-field subscriptSizing="dynamic">
        <mat-label>{{ text.status }}</mat-label>
        <mat-select
          [value]="status()"
          [canSelectNullableOptions]="true"
          (selectionChange)="filtersChange.emit({ status: $event.value })"
        >
          <mat-option [value]="null">{{ text.allStatuses }}</mat-option>
          @for (s of statuses; track s) {
            <mat-option [value]="s">{{ statusLabels[s] }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field subscriptSizing="dynamic">
        <mat-label>{{ text.category }}</mat-label>
        <mat-select
          [value]="categoryId()"
          [canSelectNullableOptions]="true"
          (selectionChange)="filtersChange.emit({ categoryId: $event.value })"
        >
          <mat-option [value]="null">{{ text.allOptions }}</mat-option>
          @for (o of categories(); track o.id) {
            <mat-option [value]="o.id">{{ o.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field subscriptSizing="dynamic">
        <mat-label>{{ text.paymentMethod }}</mat-label>
        <mat-select
          [value]="paymentMethodId()"
          [canSelectNullableOptions]="true"
          (selectionChange)="filtersChange.emit({ paymentMethodId: $event.value })"
        >
          <mat-option [value]="null">{{ text.allOptions }}</mat-option>
          @for (o of paymentMethods(); track o.id) {
            <mat-option [value]="o.id">{{ o.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      @if (active()) {
        <button mat-button type="button" (click)="clear.emit()">{{ text.clear }}</button>
      }
    </div>
  `,
  styles: `
    @use '../../../../styles/breakpoints' as bp;

    .group {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 16px;
    }

    mat-form-field {
      flex: 1 1 100%;
    }

    @media (min-width: bp.$wide) {
      mat-form-field {
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
}
