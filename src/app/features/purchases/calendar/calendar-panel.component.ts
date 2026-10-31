import { CdkTrapFocus } from '@angular/cdk/a11y';
import { formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';

import { formatMonthLabel, fromLocalDate, PlainDate, toLocalDate } from '../plain-date';
import { CALENDAR_LABELS, yearRangeLabel } from '../purchase.messages';

export interface YearMonth {
  year: number;
  /** 1–12 */
  month: number;
}

type View = 'days' | 'months' | 'years';

/** Quantos anos a grade de anos mostra (como o `multi-year` do Material). */
export const YEARS_PER_PAGE = 24;
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const;
const MIN_YEAR = 1;
const MAX_YEAR = 9999;

/**
 * Calendário em painel (estilo dropdown do Bootstrap), aberto num overlay do CDK. `mode="day"` escolhe um dia;
 * `mode="month"` começa na grade de anos e escolhe um mês. Os botões têm o nome completo (`15 de outubro de 2026`,
 * `março de 2025`). O foco entra no painel ao abrir e volta ao botão de origem ao fechar (`cdkTrapFocus`).
 */
@Component({
  selector: 'app-calendar-panel',
  imports: [CdkTrapFocus],
  template: `
    <div
      class="calendar dropdown-menu"
      role="dialog"
      [attr.aria-label]="text.calendar"
      cdkTrapFocus
      cdkTrapFocusAutoCapture
    >
      <div class="calendar-header">
        <button
          type="button"
          class="btn btn-sm btn-light"
          [attr.aria-label]="prevLabel()"
          [disabled]="!canPrev()"
          (click)="move(-1)"
        >
          <i class="pe-7s-angle-left" aria-hidden="true"></i>
        </button>
        <span class="calendar-title" aria-live="polite">{{ title() }}</span>
        <button
          type="button"
          class="btn btn-sm btn-light"
          [attr.aria-label]="nextLabel()"
          [disabled]="!canNext()"
          (click)="move(1)"
        >
          <i class="pe-7s-angle-right" aria-hidden="true"></i>
        </button>
      </div>

      @switch (view()) {
        @case ('days') {
          <div class="grid days">
            @for (w of weekdays; track $index) {
              <span class="weekday" aria-hidden="true">{{ w }}</span>
            }
            @for (cell of dayCells(); track $index) {
              @if (cell) {
                <button
                  type="button"
                  class="btn btn-sm"
                  [class.btn-primary]="cell.selected"
                  [class.cell]="!cell.selected"
                  [class.today]="cell.today"
                  [attr.aria-label]="cell.label"
                  [attr.aria-pressed]="cell.selected"
                  [attr.aria-current]="cell.today ? 'date' : null"
                  (click)="daySelected.emit(cell.date)"
                >
                  {{ cell.day }}
                </button>
              } @else {
                <span></span>
              }
            }
          </div>
        }
        @case ('months') {
          <div class="grid months">
            @for (m of monthCells(); track m.month) {
              <button
                type="button"
                class="btn btn-sm"
                [class.btn-primary]="m.selected"
                [class.cell]="!m.selected"
                [attr.aria-label]="m.label"
                [attr.aria-pressed]="m.selected"
                (click)="pickMonth(m.month)"
              >
                {{ m.short }}
              </button>
            }
          </div>
        }
        @case ('years') {
          <div class="grid years">
            @for (y of yearCells(); track y.year) {
              <button
                type="button"
                class="btn btn-sm"
                [class.btn-primary]="y.selected"
                [class.cell]="!y.selected"
                [attr.aria-pressed]="y.selected"
                (click)="pickYear(y.year)"
              >
                {{ y.year }}
              </button>
            }
          </div>
        }
      }
    </div>
  `,
  styles: `
    .calendar {
      position: static;
      display: block;
      width: 296px;
      padding: 0.75rem;
    }

    .calendar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 0.5rem;
    }

    .calendar-header .btn {
      font-size: 1.3rem;
      line-height: 1;
    }

    .calendar-title {
      font-weight: 600;
    }

    .grid {
      display: grid;
      gap: 4px;
    }

    .days {
      grid-template-columns: repeat(7, 1fr);
    }

    .months,
    .years {
      grid-template-columns: repeat(4, 1fr);
    }

    .weekday {
      text-align: center;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--app-muted);
    }

    .grid .btn {
      padding: 0.3rem 0;
    }

    .months .btn {
      text-transform: capitalize;
    }

    .cell {
      background: transparent;
      border-color: transparent;
    }

    .cell:hover {
      background: var(--bs-light);
    }

    .today:not(.btn-primary) {
      border-color: var(--bs-primary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPanelComponent {
  readonly mode = input<'day' | 'month'>('day');
  /** Dia escolhido (modo `day`) ou mês escolhido (modo `month`, `day` ignorado). */
  readonly selected = input<PlainDate | null>(null);
  /** Onde o calendário abre quando não há escolha. */
  readonly startAt = input.required<PlainDate>();
  readonly today = input.required<PlainDate>();
  readonly daySelected = output<Date>();
  readonly monthSelected = output<YearMonth>();

  protected readonly view = linkedSignal<View>(() => (this.mode() === 'day' ? 'days' : 'years'));
  /** Ano e mês em exibição. */
  protected readonly cursor = linkedSignal<YearMonth>(() => {
    const d = this.selected() ?? this.startAt();
    return { year: d.year, month: d.month };
  });

  protected readonly weekdays = WEEKDAYS;
  protected readonly text = { calendar: CALENDAR_LABELS.calendar };

  protected readonly title = computed(() => {
    const { year, month } = this.cursor();
    switch (this.view()) {
      case 'days':
        return formatMonthLabel(year, month);
      case 'months':
        return String(year);
      case 'years': {
        const start = this.yearPageStart();
        return yearRangeLabel(
          String(Math.max(MIN_YEAR, start)),
          String(Math.min(MAX_YEAR, start + YEARS_PER_PAGE - 1)),
        );
      }
    }
  });

  protected readonly prevLabel = computed(() => CALENDAR_LABELS.previous[this.view()]);
  protected readonly nextLabel = computed(() => CALENDAR_LABELS.next[this.view()]);

  private readonly yearPageStart = computed(() => {
    // Mesmas páginas do `multi-year` do Material: 2016–2039 contém 2026.
    const year = this.cursor().year;
    return year - (year % YEARS_PER_PAGE);
  });

  protected readonly canPrev = computed(() => {
    const { year, month } = this.cursor();
    switch (this.view()) {
      case 'days':
        return !(year === MIN_YEAR && month === 1);
      case 'months':
        return year > MIN_YEAR;
      case 'years':
        return this.yearPageStart() > MIN_YEAR;
    }
  });

  protected readonly canNext = computed(() => {
    const { year, month } = this.cursor();
    switch (this.view()) {
      case 'days':
        return !(year === MAX_YEAR && month === 12);
      case 'months':
        return year < MAX_YEAR;
      case 'years':
        return this.yearPageStart() + YEARS_PER_PAGE <= MAX_YEAR;
    }
  });

  protected readonly dayCells = computed(() => {
    const { year, month } = this.cursor();
    const first = toLocalDate({ year, month, day: 1 });
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const selected = this.selected();
    const today = this.today();
    const cells: ({
      day: number;
      date: Date;
      label: string;
      selected: boolean;
      today: boolean;
    } | null)[] = Array.from({ length: first.getDay() }, () => null);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = toLocalDate({ year, month, day });
      cells.push({
        day,
        date,
        label: formatDate(date, "d 'de' MMMM 'de' y", 'pt-BR'),
        selected: !!selected && samePlain(selected, { year, month, day }),
        today: samePlain(today, { year, month, day }),
      });
    }
    return cells;
  });

  protected readonly monthCells = computed(() => {
    const year = this.cursor().year;
    const selected = this.selected();
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return {
        month,
        label: formatMonthLabel(year, month),
        short: formatDate(toLocalDate({ year, month, day: 1 }), 'MMM', 'pt-BR'),
        selected: !!selected && selected.year === year && selected.month === month,
      };
    });
  });

  protected readonly yearCells = computed(() => {
    const start = this.yearPageStart();
    const selectedYear = this.selected()?.year;
    return Array.from({ length: YEARS_PER_PAGE }, (_, i) => start + i)
      .filter((year) => year >= MIN_YEAR && year <= MAX_YEAR)
      .map((year) => ({ year, selected: year === selectedYear }));
  });

  protected move(delta: -1 | 1): void {
    const { year, month } = this.cursor();
    switch (this.view()) {
      case 'days': {
        const index = year * 12 + (month - 1) + delta;
        this.cursor.set({ year: Math.floor(index / 12), month: (index % 12) + 1 });
        return;
      }
      case 'months':
        this.cursor.set({ year: year + delta, month });
        return;
      case 'years':
        this.cursor.set({
          year: clampYear(this.yearPageStart() + delta * YEARS_PER_PAGE),
          month,
        });
    }
  }

  protected pickYear(year: number): void {
    this.cursor.update((c) => ({ ...c, year }));
    this.view.set('months');
  }

  protected pickMonth(month: number): void {
    this.monthSelected.emit({ year: this.cursor().year, month });
  }
}

function samePlain(a: PlainDate, b: PlainDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

function clampYear(year: number): number {
  return Math.min(MAX_YEAR, Math.max(MIN_YEAR, year));
}

/** `Date` → `PlainDate`, para quem tem um `Date` do formulário. */
export function plainOf(date: Date | null): PlainDate | null {
  return date && !Number.isNaN(date.getTime()) ? fromLocalDate(date) : null;
}
