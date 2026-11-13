import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, combineLatest, filter, map, of, startWith, Subject, switchMap } from 'rxjs';
import { classifyHttpError, genericErrorMessage } from '../../core/http/http-error';
import { TODAY } from '../../core/navigation/today';
import { CurrentUserStore } from '../../core/user/current-user-store';
import { monthQueryParams, normalizeMonthQuery } from '../../shared/date/month-query';
import { type YearMonth, monthOf, toIsoDate } from '../../shared/date/plain-date';
import { type Loadable, LOADING } from '../../shared/loadable';
import { AreaStatus } from '../../shared/ui/area-status/area-status';
import { MonthSwitcher } from '../../shared/ui/month-switcher/month-switcher';
import type { MonthOverview } from '../purchases/data/purchase.models';
import { PurchasesApi } from '../purchases/data/purchases-api';
import { CategoryDonut } from './category-donut/category-donut';
import { DailyBars } from './daily-bars/daily-bars';
import { greeting, GREETING_FALLBACK, HOME_SUBTITLE } from './home.messages';
import { LatestPurchases } from './latest-purchases/latest-purchases';
import { MonthKpis } from './month-kpis/month-kpis';
import { PaymentMeters } from './payment-meters/payment-meters';
import { SpendingCard } from './spending-card/spending-card';

/**
 * Home page (dashboard.html): greeting, month switcher, the spending card (005) and the month blocks (007: RF-01,
 * RF-07 to RF-09, RN-11 to RN-16). The card and the blocks load in parallel and fail on their own.
 */
@Component({
  selector: 'ws-home-page',
  imports: [
    AreaStatus,
    CategoryDonut,
    DailyBars,
    LatestPurchases,
    MonthKpis,
    MonthSwitcher,
    PaymentMeters,
    SpendingCard,
  ],
  templateUrl: './home-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly store = inject(CurrentUserStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(PurchasesApi);
  private readonly today = inject(TODAY);
  private readonly reload$ = new Subject<void>();

  protected readonly HOME_SUBTITLE = HOME_SUBTITLE;
  protected readonly currentMonth = monthOf(this.today());
  /** The month of the address (ADR-04); null until the address is canonical. */
  readonly month = signal<YearMonth | null>(null);
  /** The month blocks (GET /purchases/overview). */
  readonly overview = signal<Loadable<MonthOverview>>(LOADING);

  protected readonly title = computed(() => {
    const user = this.store.user();
    return user ? greeting(user.name) : GREETING_FALLBACK;
  });
  /** Ready with Paga or Pendente purchases → the blocks; null otherwise. */
  protected readonly blocks = computed(() => {
    const o = this.overview();
    return o.status === 'ready' && o.value.active_count > 0 ? o.value : null;
  });
  /** Ready without Paga or Pendente purchases → only the card, full width (RN-11). */
  protected readonly heroOnly = computed(() => {
    const o = this.overview();
    return o.status === 'ready' && o.value.active_count === 0;
  });
  protected readonly errorMessage = computed(() => {
    const o = this.overview();
    return o.status === 'error' ? o.message : '';
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

    // switchMap cancels the load of the previous month (RN-13); no cache (RN-14, RN-16).
    combineLatest([
      toObservable(this.month).pipe(filter((m): m is YearMonth => m !== null)),
      this.reload$.pipe(startWith(undefined)),
    ])
      .pipe(
        switchMap(([ym]) =>
          this.api.overview(ym.year, ym.month, toIsoDate(this.today())).pipe(
            map((value): Loadable<MonthOverview> => ({ status: 'ready', value })),
            catchError((error: unknown) =>
              of<Loadable<MonthOverview>>({
                status: 'error',
                message: genericErrorMessage(classifyHttpError(error)),
              }),
            ),
            startWith(LOADING),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.overview.set(state));
  }

  protected goMonth(ym: YearMonth): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: monthQueryParams(ym) });
  }

  /** "Tentar novamente" of the blocks reloads only the blocks (RN-12). */
  protected retry(): void {
    this.reload$.next();
  }
}
