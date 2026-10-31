import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { ListQuery } from '../list-query';
import { deleteLabel } from '../purchase.messages';
import { PurchaseRow } from './purchase-row';

/** RF-08: lista em itens compactos (modo estreito). O botão de excluir fica fora do link (ADR-09). */
@Component({
  selector: 'app-purchase-items',
  imports: [RouterLink, MatIconButton, MatIcon],
  template: `
    <ul class="items">
      @for (row of rows(); track row.id) {
        <li [class.canceled]="row.canceled">
          <a class="item" [routerLink]="['/lancamentos', row.id]" [state]="{ origin: origin() }">
            <span class="line">
              <span class="description">{{ row.description }}</span>
              <span class="amount">{{ row.amount }}</span>
            </span>
            <span class="meta">{{ row.date }} · {{ row.category }} · {{ row.paymentMethod }}</span>
            <span class="status">{{ row.statusLabel }}</span>
          </a>
          <button
            mat-icon-button
            type="button"
            [attr.aria-label]="deleteLabel(row.description)"
            (click)="remove.emit(row)"
          >
            <mat-icon aria-hidden="true">delete</mat-icon>
          </button>
        </li>
      }
    </ul>
  `,
  styles: `
    .items {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    li {
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .item {
      flex: 1 1 auto;
      min-width: 0;
      display: grid;
      gap: 2px;
      padding: 12px 0;
      color: inherit;
      text-decoration: none;
    }

    .line {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      font: var(--mat-sys-title-small);
    }

    .description {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .amount {
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }

    .meta,
    .status {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }

    .canceled .item {
      color: var(--mat-sys-on-surface-variant);
    }

    .canceled .amount {
      text-decoration: line-through;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseItemsComponent {
  readonly rows = input.required<readonly PurchaseRow[]>();
  readonly origin = input.required<ListQuery>();
  readonly remove = output<PurchaseRow>();

  protected readonly deleteLabel = deleteLabel;
}
