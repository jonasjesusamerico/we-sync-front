import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { CalendarPanelComponent, YearMonth } from '../calendar/calendar-panel.component';
import { canShiftMonth, shiftMonth } from '../list-query';
import { formatMonthLabel, todayPlain } from '../plain-date';
import {
  LABEL_CURRENT_MONTH,
  LABEL_NEXT_MONTH,
  LABEL_PREVIOUS_MONTH,
  pickMonthLabel,
} from '../purchase.messages';

export type { YearMonth };

/**
 * RF-05: mês da lista com ‹ e ›, seletor de mês e ano (grade de anos, depois meses) e "Mês atual". Só emite; quem
 * navega é a página.
 */
@Component({
  selector: 'app-month-bar',
  imports: [CdkOverlayOrigin, CdkConnectedOverlay, CalendarPanelComponent],
  template: `
    <div class="btn-group" role="group">
      <button
        type="button"
        class="btn btn-outline-primary"
        [attr.aria-label]="text.previous"
        [disabled]="!canPrev()"
        (click)="shift(-1)"
      >
        <i class="pe-7s-angle-left" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="btn btn-outline-primary label"
        cdkOverlayOrigin
        #origin="cdkOverlayOrigin"
        [attr.aria-label]="pickLabel()"
        aria-haspopup="dialog"
        [attr.aria-expanded]="pickerOpen()"
        (click)="pickerOpen.set(true)"
      >
        {{ label() }}
      </button>
      <button
        type="button"
        class="btn btn-outline-primary"
        [attr.aria-label]="text.next"
        [disabled]="!canNext()"
        (click)="shift(1)"
      >
        <i class="pe-7s-angle-right" aria-hidden="true"></i>
      </button>
    </div>
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="pickerOpen()"
      (overlayOutsideClick)="pickerOpen.set(false)"
      (overlayKeydown)="onPickerKeydown($event)"
      (detach)="pickerOpen.set(false)"
    >
      <app-calendar-panel
        mode="month"
        [selected]="selected()"
        [startAt]="selected()"
        [today]="today"
        (monthSelected)="pick($event)"
      />
    </ng-template>
    @if (!isCurrent()) {
      <button type="button" class="btn btn-light" (click)="goToCurrent()">
        {{ text.current }}
      </button>
    }
  `,
  styles: `
    @use '../../../../styles/breakpoints' as bp;

    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    .btn-group .btn:not(.label) {
      font-size: 1.3rem;
      line-height: 1;
    }

    .label {
      min-width: 9rem;
    }

    @media (min-width: bp.$wide) {
      .label {
        min-width: 11rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthBarComponent {
  readonly year = input.required<number>();
  readonly month = input.required<number>();
  readonly isCurrent = input.required<boolean>();
  readonly monthChange = output<YearMonth>();

  private readonly current = computed(() => ({ year: this.year(), month: this.month() }));
  protected readonly label = computed(() => formatMonthLabel(this.year(), this.month()));
  protected readonly pickLabel = computed(() => pickMonthLabel(this.label()));
  protected readonly selected = computed(() => ({ ...this.current(), day: 1 }));
  protected readonly canPrev = computed(() => canShiftMonth(this.current(), -1));
  protected readonly canNext = computed(() => canShiftMonth(this.current(), 1));
  protected readonly pickerOpen = signal(false);
  protected readonly today = todayPlain(new Date());
  protected readonly text = {
    previous: LABEL_PREVIOUS_MONTH,
    next: LABEL_NEXT_MONTH,
    current: LABEL_CURRENT_MONTH,
  };

  protected shift(delta: -1 | 1): void {
    const { year, month } = shiftMonth(
      { ...this.current(), status: null, categoryId: null, paymentMethodId: null, page: 1 },
      delta,
    );
    this.monthChange.emit({ year, month });
  }

  protected pick(value: YearMonth): void {
    this.pickerOpen.set(false);
    this.monthChange.emit(value);
  }

  protected onPickerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.pickerOpen.set(false);
    }
  }

  protected goToCurrent(): void {
    const now = new Date();
    this.monthChange.emit({ year: now.getFullYear(), month: now.getMonth() + 1 });
  }
}
