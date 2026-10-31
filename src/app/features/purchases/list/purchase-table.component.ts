import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
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
import { PurchaseRow } from './purchase-row';

/** RF-07: lista em tabela (modo largo). A linha e a descrição abrem a edição; "Excluir" só emite. */
@Component({
  selector: 'app-purchase-table',
  imports: [
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatCell,
    MatCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatButton,
    RouterLink,
  ],
  template: `
    <table mat-table [dataSource]="rows()" [trackBy]="trackById">
      <ng-container matColumnDef="date">
        <th mat-header-cell *matHeaderCellDef>{{ text.date }}</th>
        <td mat-cell *matCellDef="let row" class="date">{{ row.date }}</td>
      </ng-container>
      <ng-container matColumnDef="description">
        <th mat-header-cell *matHeaderCellDef>{{ text.description }}</th>
        <td mat-cell *matCellDef="let row" class="description">
          <a
            class="description-link"
            [routerLink]="['/lancamentos', row.id]"
            [state]="{ origin: origin() }"
            (click)="$event.stopPropagation()"
            >{{ row.description }}</a
          >
        </td>
      </ng-container>
      <ng-container matColumnDef="category">
        <th mat-header-cell *matHeaderCellDef>{{ text.category }}</th>
        <td mat-cell *matCellDef="let row" class="category">{{ row.category }}</td>
      </ng-container>
      <ng-container matColumnDef="paymentMethod">
        <th mat-header-cell *matHeaderCellDef>{{ text.paymentMethod }}</th>
        <td mat-cell *matCellDef="let row" class="payment-method">{{ row.paymentMethod }}</td>
      </ng-container>
      <ng-container matColumnDef="amount">
        <th mat-header-cell *matHeaderCellDef class="amount">{{ text.amount }}</th>
        <td mat-cell *matCellDef="let row" class="amount">{{ row.amount }}</td>
      </ng-container>
      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>{{ text.status }}</th>
        <td mat-cell *matCellDef="let row" class="status">{{ row.statusLabel }}</td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>
          <span class="cdk-visually-hidden">{{ text.actions }}</span>
        </th>
        <td mat-cell *matCellDef="let row" class="actions">
          <button
            mat-button
            type="button"
            [attr.aria-label]="deleteLabel(row.description)"
            (click)="$event.stopPropagation(); remove.emit(row)"
          >
            {{ text.delete }}
          </button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr
        mat-row
        *matRowDef="let row; columns: columns"
        [class.canceled]="row.canceled"
        (click)="open(row)"
      ></tr>
    </table>
  `,
  styles: `
    table {
      width: 100%;
    }

    tr.mat-mdc-row {
      cursor: pointer;
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
    }

    .actions {
      text-align: right;
    }

    .canceled td {
      color: var(--mat-sys-on-surface-variant);
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

  protected readonly columns = [
    'date',
    'description',
    'category',
    'paymentMethod',
    'amount',
    'status',
    'actions',
  ];
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

  protected readonly trackById = (_: number, row: PurchaseRow) => row.id;

  /** RF-09: clicar em qualquer ponto da linha abre a edição. */
  protected open(row: PurchaseRow): void {
    void this.router.navigate(['/lancamentos', row.id], { state: { origin: this.origin() } });
  }
}
