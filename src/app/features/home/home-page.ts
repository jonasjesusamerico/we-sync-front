import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TODAY } from '../../core/navigation/today';
import { CurrentUserStore } from '../../core/user/current-user-store';
import { monthQueryParams, normalizeMonthQuery } from '../../shared/date/month-query';
import { type YearMonth, monthOf } from '../../shared/date/plain-date';
import { MonthSwitcher } from '../../shared/ui/month-switcher/month-switcher';
import { greeting, GREETING_FALLBACK, HOME_SUBTITLE } from './home.messages';
import { SpendingCard } from './spending-card/spending-card';

/** Home page (dashboard.html; RF-03 to RF-07): greeting, month switcher and the spending card of the month. */
@Component({
  selector: 'ws-home-page',
  imports: [MonthSwitcher, SpendingCard],
  template: `
    <div class="ws-page-head">
      <div>
        <h1>{{ title() }}</h1>
        <p>{{ HOME_SUBTITLE }}</p>
      </div>
      @if (month(); as m) {
        <ws-month-switcher [month]="m" [current]="currentMonth" (monthChange)="goMonth($event)" />
      }
    </div>
    @if (month(); as m) {
      <div class="row g-3 mb-3">
        <div class="col-12 col-xl-5"><ws-spending-card [month]="m" /></div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly store = inject(CurrentUserStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly today = inject(TODAY);

  protected readonly HOME_SUBTITLE = HOME_SUBTITLE;
  protected readonly currentMonth = monthOf(this.today());
  /** The month of the address (ADR-04); null until the address is canonical. */
  readonly month = signal<YearMonth | null>(null);
  protected readonly title = computed(() => {
    const user = this.store.user();
    return user ? greeting(user.name) : GREETING_FALLBACK;
  });

  constructor() {
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe((params) => {
      const normalized = normalizeMonthQuery(params, this.today());
      if (normalized.changed) {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: monthQueryParams(normalized.value),
          replaceUrl: true,
        });
        return;
      }
      this.month.set(normalized.value);
    });
  }

  protected goMonth(ym: YearMonth): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: monthQueryParams(ym) });
  }
}
