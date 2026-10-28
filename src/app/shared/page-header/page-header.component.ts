import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';

/** Formato da data do cabeçalho: `21/10/2026, quarta-feira` (com `LOCALE_ID` pt-BR). */
export const PAGE_HEADER_DATE_FORMAT = 'dd/MM/yyyy, EEEE';

/** Cabeçalho das telas internas: título e data de hoje (RF-10, RN-03). */
@Component({
  selector: 'app-page-header',
  imports: [MatCard, MatIcon, DatePipe],
  template: `
    <mat-card>
      <div class="row">
        <h1>{{ title() }}</h1>
        <p class="date">
          <mat-icon aria-hidden="true">calendar_today</mat-icon>
          <time [attr.datetime]="today | date: 'yyyy-MM-dd'">{{ today | date: dateFormat }}</time>
        </p>
      </div>
    </mat-card>
  `,
  styles: `
    @use '../../../styles/breakpoints' as bp;

    .row {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      padding: 16px;
    }

    // RF-10: abaixo de $wide a data fica sempre abaixo do título.
    @media (min-width: bp.$wide) {
      .row {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 16px 24px;
      }
    }

    h1 {
      margin: 0;
      font: var(--mat-sys-title-large);
      color: var(--mat-sys-on-surface);
    }

    .date {
      margin: 0;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font: var(--mat-sys-body-large);
      color: var(--mat-sys-on-surface-variant);
    }

    .date mat-icon {
      color: var(--mat-sys-primary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();

  /** RN-03: lida uma vez, na criação. Sem timer: a data não muda sozinha. */
  protected readonly today = new Date();
  protected readonly dateFormat = PAGE_HEADER_DATE_FORMAT;
}
