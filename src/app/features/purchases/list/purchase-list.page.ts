import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  catchError,
  combineLatest,
  EMPTY,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

import { genericErrorMessage } from '../../../core/http/error-messages';
import { LABEL_PURCHASES } from '../../../layout/layout.messages';
import { WIDE_LAYOUT_QUERY } from '../../../layout/breakpoints';
import { openConfirm } from '../../../shared/confirm-dialog/confirm-dialog';
import { FormAlertComponent } from '../../../shared/form-alert/form-alert.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import {
  clearFilters,
  hasFilters,
  isCanonical,
  isCurrentMonth,
  ListQuery,
  normalizeListQuery,
  toRouteParams,
  withFilters,
  withMonth,
  withPage,
} from '../list-query';
import { notify } from '../notify';
import { OptionsApi, PurchaseOptions } from '../options.api';
import { formatMonthLabel } from '../plain-date';
import {
  DELETE_DIALOG_TITLE,
  DELETE_DIALOG_WARNING,
  emptyMonthMessage,
  LABEL_CANCEL,
  LABEL_CLEAR_FILTERS,
  LABEL_DELETE,
  LABEL_LOADING,
  LABEL_NEW_PURCHASE,
  LABEL_RETRY,
  MSG_DELETED,
  MSG_EMPTY_FILTERED,
} from '../purchase.messages';
import { PAGE_SIZE, PurchasePage } from '../purchase.models';
import { PurchasesApi } from '../purchases.api';
import { MonthBarComponent, YearMonth } from './month-bar.component';
import { FiltersPatch, PurchaseFiltersComponent } from './purchase-filters.component';
import { PurchaseItemsComponent } from './purchase-items.component';
import { PurchaseRow, toPurchaseRow } from './purchase-row';
import { PurchaseTableComponent } from './purchase-table.component';

/**
 * Lista de lançamentos do mês (RF-03 a RF-15, RF-24 a RF-26). O estado vem só do endereço (ADR-04): toda ação
 * navega, e cada mudança de endereço refaz a carga. Nada fica guardado fora da página (ADR-03).
 */
@Component({
  selector: 'app-purchase-list-page',
  imports: [
    RouterLink,
    MatCard,
    MatCardContent,
    MatButton,
    MatPaginator,
    MatProgressSpinner,
    PageHeaderComponent,
    FormAlertComponent,
    MonthBarComponent,
    PurchaseFiltersComponent,
    PurchaseTableComponent,
    PurchaseItemsComponent,
  ],
  templateUrl: './purchase-list.page.html',
  styleUrl: './purchase-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseListPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(PurchasesApi);
  private readonly optionsApi = inject(OptionsApi);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly breakpoints = inject(BreakpointObserver);

  /** O endereço canônico em uso. */
  protected readonly query = signal<ListQuery | null>(null);
  protected readonly options = signal<PurchaseOptions | null>(null);
  protected readonly page = signal<PurchasePage | null>(null);
  protected readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly rows = computed(() => (this.page()?.items ?? []).map(toPurchaseRow));
  protected readonly isWide = toSignal(
    this.breakpoints.observe(WIDE_LAYOUT_QUERY).pipe(map((s) => s.matches)),
    { initialValue: this.breakpoints.isMatched(WIDE_LAYOUT_QUERY) },
  );
  protected readonly isCurrent = computed(() => {
    const q = this.query();
    return q !== null && isCurrentMonth(q, new Date());
  });
  protected readonly filtered = computed(() => {
    const q = this.query();
    return q !== null && hasFilters(q);
  });
  protected readonly monthLabel = computed(() => {
    const q = this.query();
    return q === null ? '' : formatMonthLabel(q.year, q.month);
  });

  protected readonly pageSize = PAGE_SIZE;
  protected readonly emptyMonthMessage = emptyMonthMessage;
  protected readonly text = {
    title: LABEL_PURCHASES,
    newPurchase: LABEL_NEW_PURCHASE,
    loading: LABEL_LOADING,
    retry: LABEL_RETRY,
    clearFilters: LABEL_CLEAR_FILTERS,
    emptyFiltered: MSG_EMPTY_FILTERED,
  };

  private readonly reload$ = new Subject<void>();

  constructor() {
    const canonical$ = this.route.queryParams.pipe(
      map((raw) => ({ raw, q: normalizeListQuery(raw, new Date()) })),
      // RN-15: endereço fora do canônico é trocado (sem nova entrada no histórico); a nova URL dispara de novo.
      tap(({ raw, q }) => {
        if (!isCanonical(raw, q)) {
          this.navigateTo(q, true);
        }
      }),
      filter(({ raw, q }) => isCanonical(raw, q)),
      map(({ q }) => q),
    );

    combineLatest([canonical$, this.reload$.pipe(startWith(undefined))])
      .pipe(
        tap(([q]) => {
          this.query.set(q);
          this.status.set('loading');
          this.page.set(null);
        }),
        // Uma carga por vez: a resposta de um endereço antigo é descartada (DAS "Desempenho").
        switchMap(([q]) => this.load(q)),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  private load(q: ListQuery): Observable<unknown> {
    const current = this.options();
    const options$ = current ? of(current) : this.optionsApi.both();
    return forkJoin({ opts: options$, page: this.api.list(q) }).pipe(
      tap(({ opts, page }) => {
        this.options.set(opts);
        const badCategory =
          q.categoryId !== null && !opts.categories.some((o) => o.id === q.categoryId);
        const badPaymentMethod =
          q.paymentMethodId !== null &&
          !opts.paymentMethods.some((o) => o.id === q.paymentMethodId);
        // RN-15, depois da carga: filtro com id que não é do usuário.
        if (badCategory || badPaymentMethod) {
          this.navigateTo(
            withFilters(q, {
              ...(badCategory ? { categoryId: null } : {}),
              ...(badPaymentMethod ? { paymentMethodId: null } : {}),
            }),
            true,
          );
          return;
        }
        // RN-15: página além da última.
        if (page.items.length === 0 && page.total > 0 && q.page > page.total_pages) {
          this.navigateTo(withPage(q, page.total_pages), true);
          return;
        }
        this.page.set(page);
        this.status.set('ready');
      }),
      catchError((error: unknown) => {
        this.status.set('error');
        this.errorMessage.set(genericErrorMessage(error));
        return EMPTY;
      }),
    );
  }

  private navigateTo(q: ListQuery, replaceUrl: boolean): void {
    void this.router.navigate(['/lancamentos'], { queryParams: toRouteParams(q), replaceUrl });
  }

  /** RN-19: refaz o que falhou (as opções só se ainda não chegaram). */
  protected retry(): void {
    this.reload$.next();
  }

  protected onMonthChange({ year, month }: YearMonth): void {
    this.navigateTo(withMonth(this.query()!, year, month), false);
  }

  protected onFiltersChange(patch: FiltersPatch): void {
    this.navigateTo(withFilters(this.query()!, patch), false);
  }

  protected onClearFilters(): void {
    this.navigateTo(clearFilters(this.query()!), false);
  }

  protected onPage(event: PageEvent): void {
    this.navigateTo(withPage(this.query()!, event.pageIndex + 1), false);
  }

  /** RF-24, RN-13, RN-14: confirma e exclui; o `404` também é sucesso (tratado no `PurchasesApi`). */
  protected confirmDelete(row: PurchaseRow): void {
    openConfirm(this.dialog, {
      title: DELETE_DIALOG_TITLE,
      lines: [row.description, row.date, row.amount],
      warning: DELETE_DIALOG_WARNING,
      cancelLabel: LABEL_CANCEL,
      confirmLabel: LABEL_DELETE,
      action: () => this.api.remove(String(row.id)),
    }).subscribe((deleted) => {
      if (!deleted) {
        return;
      }
      notify(this.snackBar, MSG_DELETED);
      const q = this.query();
      if (q && this.page()?.items.length === 1 && q.page > 1) {
        this.navigateTo(withPage(q, q.page - 1), true);
      } else {
        this.reload$.next();
      }
    });
  }
}
