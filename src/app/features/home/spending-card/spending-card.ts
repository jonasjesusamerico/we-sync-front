import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, combineLatest, map, of, startWith, Subject, switchMap } from 'rxjs';
import { classifyHttpError, genericErrorMessage } from '../../../core/http/http-error';
import { TODAY } from '../../../core/navigation/today';
import { type Loadable, LOADING } from '../../../shared/loadable';
import { apiToCents, formatBrl } from '../../../shared/money/money';
import { monthQueryParams } from '../../../shared/date/month-query';
import {
  type YearMonth,
  isFutureMonth,
  monthName,
  monthOf,
  toIsoDate,
} from '../../../shared/date/plain-date';
import { AreaStatus } from '../../../shared/ui/area-status/area-status';
import { Icon } from '../../../shared/ui/icon/icon';
import type { MonthSummary } from '../../purchases/data/purchase.models';
import { PurchasesApi } from '../../purchases/data/purchases-api';
import { NEW_PURCHASE_PATH, PURCHASES_PATH, originState } from '../../purchases/purchase-links';
import { LABEL_NEW_PURCHASE, LABEL_SEE_PURCHASES, noPurchasesIn, spentIn } from '../home.messages';
import { spendingSeal } from '../spending-seal';

/**
 * Spending card of the home page (.ws-hero of dashboard.html; RF-06, RF-07, RN-01 to RN-03 of 005;
 * RN-03 and RN-04 of 007). Its failure stays
 * inside the card (RN-26).
 */
@Component({
  selector: 'ws-spending-card',
  imports: [RouterLink, Icon, AreaStatus],
  templateUrl: './spending-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpendingCard {
  readonly month = input.required<YearMonth>();

  private readonly api = inject(PurchasesApi);
  private readonly today = inject(TODAY);
  private readonly reload$ = new Subject<void>();

  protected readonly PURCHASES_PATH = PURCHASES_PATH;
  protected readonly NEW_PURCHASE_PATH = NEW_PURCHASE_PATH;
  protected readonly LABEL_SEE_PURCHASES = LABEL_SEE_PURCHASES;
  protected readonly LABEL_NEW_PURCHASE = LABEL_NEW_PURCHASE;

  readonly summary = signal<Loadable<MonthSummary>>(LOADING);

  protected readonly label = computed(() => spentIn(monthName(this.month().month)));
  protected readonly value = computed(() => {
    const summary = this.summary();
    return summary.status === 'ready' ? summary.value : null;
  });
  protected readonly errorMessage = computed(() => {
    const summary = this.summary();
    return summary.status === 'error' ? summary.message : '';
  });
  protected readonly spent = computed(() => {
    const value = this.value();
    return value ? formatBrl(apiToCents(value.spent)) : '';
  });
  /** No seal in a month after today's (RN-03 of 007, ADR-04): there is nothing to compare yet. */
  protected readonly seal = computed(() => {
    const value = this.value();
    return value && !isFutureMonth(this.month(), monthOf(this.today()))
      ? spendingSeal(value.comparison)
      : null;
  });
  protected readonly emptyText = computed(() => noPurchasesIn(monthName(this.month().month)));
  protected readonly purchasesQuery = computed(() => monthQueryParams(this.month()));
  /** "Nova compra" of an empty month starts on that month and comes back here (RN-12, RN-14). */
  protected readonly newPurchaseState = computed(() =>
    originState({ screen: 'inicio', year: this.month().year, month: this.month().month }),
  );

  constructor() {
    combineLatest([toObservable(this.month), this.reload$.pipe(startWith(undefined))])
      .pipe(
        switchMap(([ym]) =>
          this.api.summary(ym.year, ym.month, toIsoDate(this.today())).pipe(
            map((value): Loadable<MonthSummary> => ({ status: 'ready', value })),
            catchError((error: unknown) =>
              of<Loadable<MonthSummary>>({
                status: 'error',
                message: genericErrorMessage(classifyHttpError(error)),
              }),
            ),
            startWith(LOADING),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.summary.set(state));
  }

  protected retry(): void {
    this.reload$.next();
  }
}
