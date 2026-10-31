import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ListQuery } from '../list-query';
import {
  LABEL_ACTIONS,
  LABEL_AMOUNT,
  LABEL_CATEGORY,
  LABEL_DATE,
  LABEL_DELETE,
  LABEL_DESCRIPTION,
  LABEL_PAYMENT_METHOD,
  LABEL_STATUS,
  deleteLabel,
} from '../purchase.messages';
import { PurchaseRow, STATUS_BADGE_CLASS } from './purchase-row';

/** RF-07: lista em tabela (modo largo). A linha e a descrição abrem a edição; "Excluir" só emite. */
@Component({
  selector: 'app-purchase-table',
  imports: [RouterLink],
  template: `
    <div class="table-responsive">
      <table class="mb-0 table table-hover">
        <thead>
          <tr>
            <th scope="col">{{ text.date }}</th>
            <th scope="col">{{ text.description }}</th>
            <th scope="col">{{ text.category }}</th>
            <th scope="col">{{ text.paymentMethod }}</th>
            <th scope="col" class="amount">{{ text.amount }}</th>
            <th scope="col">{{ text.status }}</th>
            <th scope="col">
              <span class="visually-hidden">{{ text.actions }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track row.id) {
            <tr [class.canceled]="row.canceled" (click)="open(row)">
              <td class="date">{{ row.date }}</td>
              <td class="description">
                <a
                  class="description-link"
                  [routerLink]="['/lancamentos', row.id]"
                  [state]="{ origin: origin() }"
                  (click)="$event.stopPropagation()"
                  >{{ row.description }}</a
                >
              </td>
              <td class="category">{{ row.category }}</td>
              <td class="payment-method">{{ row.paymentMethod }}</td>
              <td class="amount">{{ row.amount }}</td>
              <td class="status">
                <span class="badge" [class]="badgeClass[row.status]">{{ row.statusLabel }}</span>
              </td>
              <td class="actions">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger"
                  [attr.aria-label]="deleteLabel(row.description)"
                  (click)="$event.stopPropagation(); remove.emit(row)"
                >
                  {{ text.delete }}
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    tbody tr {
      cursor: pointer;
    }

    td,
    th {
      vertical-align: middle;
    }

    .amount {
      text-align: right;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .date {
      white-space: nowrap;
    }

    .description {
      overflow-wrap: anywhere;
    }

    .description-link {
      color: inherit;
      text-decoration: none;
    }

    .description-link:hover {
      text-decoration: underline;
    }

    .actions {
      text-align: right;
    }

    .canceled td {
      color: var(--app-muted);
    }

    .canceled .amount {
      text-decoration: line-through;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseTableComponent {
  private readonly router = inject(Router);

  readonly rows = input.required<readonly PurchaseRow[]>();
  readonly origin = input.required<ListQuery>();
  readonly remove = output<PurchaseRow>();

  protected readonly badgeClass = STATUS_BADGE_CLASS;
  protected readonly deleteLabel = deleteLabel;
  protected readonly text = {
    date: LABEL_DATE,
    description: LABEL_DESCRIPTION,
    category: LABEL_CATEGORY,
    paymentMethod: LABEL_PAYMENT_METHOD,
    amount: LABEL_AMOUNT,
    status: LABEL_STATUS,
    actions: LABEL_ACTIONS,
    delete: LABEL_DELETE,
  };

  /** RF-09: clicar em qualquer ponto da linha abre a edição. */
  protected open(row: PurchaseRow): void {
    void this.router.navigate(['/lancamentos', row.id], { state: { origin: this.origin() } });
  }
}
