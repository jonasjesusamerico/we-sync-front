import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ListQuery } from '../list-query';
import { deleteLabel } from '../purchase.messages';
import { PurchaseRow, STATUS_BADGE_CLASS } from './purchase-row';

/** RF-08: lista em itens compactos (`list-group`, modo estreito). O botão de excluir fica fora do link (ADR-09). */
@Component({
  selector: 'app-purchase-items',
  imports: [RouterLink],
  template: `
    <ul class="items list-group list-group-flush">
      @for (row of rows(); track row.id) {
        <li class="list-group-item" [class.canceled]="row.canceled">
          <a class="item" [routerLink]="['/lancamentos', row.id]" [state]="{ origin: origin() }">
            <span class="line">
              <span class="description">{{ row.description }}</span>
              <span class="amount">{{ row.amount }}</span>
            </span>
            <span class="meta">{{ row.date }} · {{ row.category }} · {{ row.paymentMethod }}</span>
            <span class="status"
              ><span class="badge" [class]="badgeClass[row.status]">{{
                row.statusLabel
              }}</span></span
            >
          </a>
          <button
            type="button"
            class="btn btn-sm btn-outline-danger delete"
            [attr.aria-label]="deleteLabel(row.description)"
            (click)="remove.emit(row)"
          >
            <i class="pe-7s-trash" aria-hidden="true"></i>
          </button>
        </li>
      }
    </ul>
  `,
  styles: `
    li {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-left: 0;
      padding-right: 0;
    }

    .item {
      flex: 1 1 auto;
      min-width: 0;
      display: grid;
      gap: 2px;
      color: inherit;
      text-decoration: none;
    }

    .line {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      font-weight: 600;
    }

    .description {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .amount {
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }

    .meta {
      font-size: 0.8rem;
      color: var(--app-muted);
    }

    .delete {
      font-size: 1.3rem;
      line-height: 1;
    }

    .canceled .item {
      color: var(--app-muted);
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
  protected readonly badgeClass = STATUS_BADGE_CLASS;
}
