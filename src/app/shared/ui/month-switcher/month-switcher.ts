import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { type YearMonth, addMonths, monthLabel, sameMonth } from '../../date/plain-date';
import { Icon } from '../icon/icon';
import {
  LABEL_CURRENT_MONTH,
  LABEL_MONTH,
  LABEL_NEXT_MONTH,
  LABEL_PREVIOUS_MONTH,
} from '../ui.messages';

// Range of the address (ano 1–9999): the arrows stay enabled and simply do not emit past it.
const FIRST: YearMonth = { year: 1, month: 1 };
const LAST: YearMonth = { year: 9999, month: 12 };
const index = (ym: YearMonth): number => ym.year * 12 + ym.month;

/** Month switcher (RF-03): "‹ novembro 2026 ›" and, away from the current month, "Mês atual" (D-05). */
@Component({
  selector: 'ws-month-switcher',
  imports: [Icon],
  template: `
    <div class="d-flex flex-wrap align-items-center gap-2">
      <div class="ws-month" role="group" [attr.aria-label]="LABEL_MONTH">
        <button
          type="button"
          class="btn btn-icon"
          [attr.aria-label]="LABEL_PREVIOUS_MONTH"
          (click)="go(-1)"
        >
          <ws-icon name="chevL" />
        </button>
        <span class="ws-month-label" aria-live="polite">{{ label() }}</span>
        <button
          type="button"
          class="btn btn-icon"
          [attr.aria-label]="LABEL_NEXT_MONTH"
          (click)="go(1)"
        >
          <ws-icon name="chevR" />
        </button>
      </div>
      @if (!isCurrent()) {
        <button type="button" class="btn btn-soft" (click)="monthChange.emit(current())">
          {{ LABEL_CURRENT_MONTH }}
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthSwitcher {
  readonly month = input.required<YearMonth>();
  readonly current = input.required<YearMonth>();
  readonly monthChange = output<YearMonth>();

  protected readonly LABEL_MONTH = LABEL_MONTH;
  protected readonly LABEL_PREVIOUS_MONTH = LABEL_PREVIOUS_MONTH;
  protected readonly LABEL_NEXT_MONTH = LABEL_NEXT_MONTH;
  protected readonly LABEL_CURRENT_MONTH = LABEL_CURRENT_MONTH;
  protected readonly label = computed(() => monthLabel(this.month()));
  protected readonly isCurrent = computed(() => sameMonth(this.month(), this.current()));

  protected go(n: number): void {
    const next = addMonths(this.month(), n);
    if (index(next) >= index(FIRST) && index(next) <= index(LAST)) {
      this.monthChange.emit(next);
    }
  }
}
