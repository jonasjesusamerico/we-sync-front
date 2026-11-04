import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from '../icon/icon';
import { LABEL_NEXT_PAGE, LABEL_PREVIOUS_PAGE, pagerInfo } from '../ui.messages';

/** Paginator (RF-15, #pager of compras.html). The parent hides it when there is a single page. */
@Component({
  selector: 'ws-paginator',
  imports: [Icon],
  template: `
    <div class="ws-pager">
      <span>{{ info() }}</span>
      <div class="d-flex gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          [disabled]="page() <= 1"
          (click)="pageChange.emit(page() - 1)"
        >
          <ws-icon name="chevL" />{{ LABEL_PREVIOUS_PAGE }}
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          [disabled]="page() >= totalPages()"
          (click)="pageChange.emit(page() + 1)"
        >
          {{ LABEL_NEXT_PAGE }}<ws-icon name="chevR" />
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Paginator {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();

  protected readonly LABEL_PREVIOUS_PAGE = LABEL_PREVIOUS_PAGE;
  protected readonly LABEL_NEXT_PAGE = LABEL_NEXT_PAGE;
  protected readonly info = computed(() => pagerInfo(this.page(), this.totalPages()));
}
