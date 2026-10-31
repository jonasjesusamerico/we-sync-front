import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDatepicker, MatDatepickerInput } from '@angular/material/datepicker';
import { MatIcon } from '@angular/material/icon';

import { canShiftMonth, shiftMonth } from '../list-query';
import { formatMonthLabel, fromLocalDate, toLocalDate } from '../plain-date';
import {
  LABEL_CURRENT_MONTH,
  LABEL_NEXT_MONTH,
  LABEL_PREVIOUS_MONTH,
  pickMonthLabel,
} from '../purchase.messages';

export interface YearMonth {
  year: number;
  month: number;
}

/**
 * RF-05: mês da lista com ‹ e ›, seletor de mês e ano (calendário em `multi-year`) e "Mês atual". Só emite; quem
 * navega é a página. O calendário se ancora num input invisível, fora da ordem de foco, embaixo do botão do mês.
 */
@Component({
  selector: 'app-month-bar',
  imports: [MatIconButton, MatButton, MatIcon, MatDatepicker, MatDatepickerInput],
  template: `
    <button
      mat-icon-button
      type="button"
      [attr.aria-label]="text.previous"
      [disabled]="!canPrev()"
      (click)="shift(-1)"
    >
      <mat-icon aria-hidden="true">chevron_left</mat-icon>
    </button>
    <span class="picker">
      <button
        mat-button
        type="button"
        class="label"
        [attr.aria-label]="pickLabel()"
        aria-haspopup="dialog"
        (click)="picker.open()"
      >
        {{ label() }}
      </button>
      <input class="picker-anchor" [matDatepicker]="picker" tabindex="-1" aria-hidden="true" />
      <mat-datepicker
        #picker
        startView="multi-year"
        [startAt]="monthDate()"
        (monthSelected)="pick($event, picker)"
      />
    </span>
    <button
      mat-icon-button
      type="button"
      [attr.aria-label]="text.next"
      [disabled]="!canNext()"
      (click)="shift(1)"
    >
      <mat-icon aria-hidden="true">chevron_right</mat-icon>
    </button>
    @if (!isCurrent()) {
      <button mat-stroked-button type="button" (click)="goToCurrent()">{{ text.current }}</button>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px;
    }

    .picker {
      position: relative;
    }

    .picker-anchor {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      height: 0;
      padding: 0;
      border: 0;
      opacity: 0;
      pointer-events: none;
    }

    .label {
      min-width: 11rem;
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
  protected readonly monthDate = computed(() =>
    toLocalDate({ year: this.year(), month: this.month(), day: 1 }),
  );
  protected readonly canPrev = computed(() => canShiftMonth(this.current(), -1));
  protected readonly canNext = computed(() => canShiftMonth(this.current(), 1));
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

  protected pick(date: Date, picker: MatDatepicker<Date>): void {
    const { year, month } = fromLocalDate(date);
    this.monthChange.emit({ year, month });
    picker.close();
  }

  protected goToCurrent(): void {
    const now = new Date();
    this.monthChange.emit({ year: now.getFullYear(), month: now.getMonth() + 1 });
  }
}
