import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import {
  LABEL_NEXT_PAGE,
  LABEL_PAGINATION,
  LABEL_PREVIOUS_PAGE,
  rangeLabel,
} from '../purchase.messages';

/** RF-11: paginação do Bootstrap com o intervalo `1–20 de 47` e as setas. Só emite; quem navega é a página. */
@Component({
  selector: 'app-paginator',
  template: `
    <nav class="paginator" [attr.aria-label]="text.pagination">
      <span class="range-label">{{ range() }}</span>
      <ul class="pagination mb-0">
        <li class="page-item" [class.disabled]="!hasPrevious()">
          <button
            type="button"
            class="page-link"
            [attr.aria-label]="text.previous"
            [disabled]="!hasPrevious()"
            (click)="pageChange.emit(page() - 1)"
          >
            <i class="pe-7s-angle-left" aria-hidden="true"></i>
          </button>
        </li>
        <li class="page-item active" aria-current="page">
          <span class="page-link">{{ page() }}</span>
        </li>
        <li class="page-item" [class.disabled]="!hasNext()">
          <button
            type="button"
            class="page-link"
            [attr.aria-label]="text.next"
            [disabled]="!hasNext()"
            (click)="pageChange.emit(page() + 1)"
          >
            <i class="pe-7s-angle-right" aria-hidden="true"></i>
          </button>
        </li>
      </ul>
    </nav>
  `,
  styles: `
    .paginator {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
      gap: 16px;
      padding-top: 1rem;
    }

    .range-label {
      color: var(--app-muted);
      font-variant-numeric: tabular-nums;
    }

    .page-link i {
      font-size: 1.2rem;
      line-height: 1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginatorComponent {
  /** Página atual, a partir de 1. */
  readonly page = input.required<number>();
  readonly total = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly pageChange = output<number>();

  private readonly lastPage = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );
  protected readonly hasPrevious = computed(() => this.page() > 1);
  protected readonly hasNext = computed(() => this.page() < this.lastPage());
  protected readonly range = computed(() => {
    const total = this.total();
    if (total === 0) {
      return rangeLabel(0, 0, 0);
    }
    const start = (this.page() - 1) * this.pageSize() + 1;
    return rangeLabel(start, Math.min(this.page() * this.pageSize(), total), total);
  });
  protected readonly text = {
    pagination: LABEL_PAGINATION,
    previous: LABEL_PREVIOUS_PAGE,
    next: LABEL_NEXT_PAGE,
  };
}
