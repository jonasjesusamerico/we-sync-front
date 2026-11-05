import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  catchError,
  combineLatest,
  debounceTime,
  filter,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  throwError,
} from 'rxjs';
import { classifyHttpError, genericErrorMessage } from '../../../core/http/http-error';
import { TODAY } from '../../../core/navigation/today';
import { type Loadable, LOADING } from '../../../shared/loadable';
import { apiToCents, formatBrl } from '../../../shared/money/money';
import {
  type YearMonth,
  formatDate,
  formatDayMonth,
  monthLongLabel,
  monthOf,
} from '../../../shared/date/plain-date';
import { AreaStatus } from '../../../shared/ui/area-status/area-status';
import { CategoryBubble } from '../../../shared/ui/category-bubble/category-bubble';
import { ConfirmService } from '../../../shared/ui/confirm/confirm';
import { Icon } from '../../../shared/ui/icon/icon';
import { MonthSwitcher } from '../../../shared/ui/month-switcher/month-switcher';
import { Paginator } from '../../../shared/ui/paginator/paginator';
import { StatusPill, StatusPillKind } from '../../../shared/ui/status-pill/status-pill';
import { CatalogApi } from '../../../core/catalog/catalog-api';
import type { Category } from '../../../core/catalog/catalog.models';
import { filterOptions } from '../../../core/catalog/catalog-options';
import { catalogStyle, type CatalogStyle } from '../../../core/catalog/catalog-style';
import type { PaginatedPurchases, Purchase, PurchaseStatus } from '../data/purchase.models';
import { PurchasesApi } from '../data/purchases-api';
import { NEW_PURCHASE_PATH, editPath, originState } from '../purchase-links';
import {
  type PurchaseListQuery,
  type StatusSlug,
  clearFilters,
  hasFilters,
  normalizePurchaseListQuery,
  toApiQuery,
  toQueryParams,
  withCategory,
  withMonth,
  withPage,
  withSearch,
  withStatus,
} from '../purchase-list-query';
import * as t from '../purchases.messages';
import { ToastService } from '../../../shared/ui/toast/toast';

const KIND: Readonly<Record<PurchaseStatus, StatusPillKind>> = {
  PAID: 'paid',
  PENDING: 'pending',
  CANCELED: 'canceled',
};

/** Filter chips, in the prototype order. */
const STATUS_OPTIONS: readonly { slug: StatusSlug | null; label: string }[] = [
  { slug: null, label: t.LABEL_ALL },
  { slug: 'paga', label: t.STATUS_LABELS.PAID },
  { slug: 'pendente', label: t.STATUS_LABELS.PENDING },
  { slug: 'cancelada', label: t.STATUS_LABELS.CANCELED },
];

const errorState = (error: unknown): Loadable<never> => ({
  status: 'error',
  message: genericErrorMessage(classifyHttpError(error)),
});

function loadable<T>(source: Observable<T>): Observable<Loadable<T>> {
  return source.pipe(
    map((value): Loadable<T> => ({ status: 'ready', value })),
    catchError((error: unknown) => of(errorState(error))),
    startWith(LOADING),
  );
}

/**
 * Purchases of the month (compras.html; RF-08 to RF-17, RF-24). The address is the state (ADR-04): every action
 * only navigates, and the page loads what the normalized address asks for.
 */
@Component({
  selector: 'ws-purchases-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Icon,
    MonthSwitcher,
    Paginator,
    CategoryBubble,
    StatusPill,
    AreaStatus,
  ],
  templateUrl: './purchases-page.html',
  styleUrl: './purchases-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchasesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(PurchasesApi);
  private readonly catalog = inject(CatalogApi);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly today = inject(TODAY);
  private readonly reload$ = new Subject<void>();
  private readonly reloadCategories$ = new Subject<void>();

  protected readonly t = t;
  protected readonly STATUS_OPTIONS = STATUS_OPTIONS;
  protected readonly NEW_PURCHASE_PATH = NEW_PURCHASE_PATH;
  protected readonly editPath = editPath;
  protected readonly formatDate = formatDate;
  protected readonly formatDayMonth = formatDayMonth;

  /** Only the normalized address. */
  readonly query = signal<PurchaseListQuery | null>(null);
  readonly categories = signal<Loadable<Category[]>>(LOADING);
  readonly list = signal<Loadable<PaginatedPurchases>>(LOADING);
  readonly searchControl = inject(NonNullableFormBuilder).control('');

  protected readonly currentMonth = monthOf(this.today());
  protected readonly month = computed<YearMonth>(() => {
    const q = this.query();
    return q ? { year: q.year, month: q.month } : this.currentMonth;
  });
  protected readonly filtersActive = computed(() => {
    const q = this.query();
    return q !== null && hasFilters(q);
  });
  protected readonly page = computed(() => {
    const list = this.list();
    return list.status === 'ready' ? list.value : null;
  });
  protected readonly listError = computed(() => {
    const list = this.list();
    return list.status === 'error' ? list.message : '';
  });
  protected readonly categoriesError = computed(() => {
    const categories = this.categories();
    return categories.status === 'error' ? categories.message : '';
  });
  protected readonly summaryText = computed(() => {
    const page = this.page();
    return page ? t.purchasesSummary(page.total, formatBrl(apiToCents(page.total_amount))) : '';
  });
  /** Globals, active own items and, at the end, the archived ones with "(arquivada)" (RN-16). */
  protected readonly categoryOptions = computed(() => {
    const categories = this.categories();
    return categories.status === 'ready' ? filterOptions(categories.value, 'category') : [];
  });
  protected readonly emptyText = computed(() => t.emptyMonth(monthLongLabel(this.month())));
  /** The links to the form carry this screen as their origin (ADR-05). */
  protected readonly linkState = computed(() => {
    const q = this.query();
    return q ? originState({ screen: 'compras', query: q }) : undefined;
  });

  constructor() {
    // 1. Address → normalized query (RN-22). A non-canonical address is rewritten in place.
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe((params) => {
      const normalized = normalizePurchaseListQuery(params, this.today());
      if (normalized.changed) {
        this.go(normalized.value, true);
        return;
      }
      this.query.set(normalized.value);
      this.searchControl.setValue(normalized.value.search, { emitEvent: false });
    });

    // 2. Query → list; switchMap drops an older answer (ADR-10).
    combineLatest([
      toObservable(this.query).pipe(filter((q): q is PurchaseListQuery => q !== null)),
      this.reload$.pipe(startWith(undefined)),
    ])
      .pipe(
        switchMap(([q]) =>
          loadable(this.api.list(toApiQuery(q))).pipe(map((state) => ({ q, state }))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ q, state }) => {
        this.list.set(state);
        if (state.status === 'ready') {
          this.fixPage(q, state.value);
        }
      });

    // 4. Categories of the filter: their failure only affects the filter card.
    this.reloadCategories$
      .pipe(
        startWith(undefined),
        switchMap(() => loadable(this.catalog.categories())),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.categories.set(state));

    // A category that is not the user's (or no longer exists) leaves the address (RN-22).
    effect(() => {
      const categories = this.categories();
      const q = this.query();
      if (
        categories.status === 'ready' &&
        q?.categoryId != null &&
        !categories.value.some((c) => c.id === q.categoryId)
      ) {
        untracked(() => this.go(withCategory(q, null), true));
      }
    });

    // 5. Search: 300 ms after typing, only if the text is still the field's and differs from the address.
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        map((text) => text.trim()),
        filter((text) => text === this.searchControl.value.trim() && text !== this.query()?.search),
        takeUntilDestroyed(),
      )
      .subscribe((text) => {
        const q = this.query();
        if (q) {
          this.go(withSearch(q, text), true);
        }
      });
  }

  protected loadCategories(): void {
    this.reloadCategories$.next();
  }

  protected retryList(): void {
    this.reload$.next();
  }

  protected goMonth(ym: YearMonth): void {
    this.update((q) => withMonth(q, ym));
  }

  protected goCategory(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.update((q) => withCategory(q, value === '' ? null : Number(value)));
  }

  protected goStatus(slug: StatusSlug | null): void {
    this.update((q) => withStatus(q, slug));
  }

  protected goPage(page: number): void {
    this.update((q) => withPage(q, page));
  }

  protected clear(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.update(clearFilters);
  }

  protected style(p: Purchase): CatalogStyle {
    return catalogStyle(p.category);
  }

  protected kind(p: Purchase): StatusPillKind {
    return KIND[p.status];
  }

  protected brl(amount: string): string {
    return formatBrl(apiToCents(amount));
  }

  /** RF-12: the whole row opens the purchase; links and buttons inside it handle their own click. */
  protected openRow(event: Event, p: Purchase): void {
    const target = event.target as Element | null;
    if (target?.closest('a, button')) {
      return;
    }
    void this.router.navigate([editPath(p.id)], { state: this.linkState() });
  }

  /** RF-24, RN-20, RN-21: 404 counts as deleted; other failures stay inside the dialog. */
  protected async askDelete(event: Event, p: Purchase): Promise<void> {
    event.stopPropagation();
    const ok = await this.confirm.ask({
      title: t.DELETE_TITLE,
      icon: 'trash',
      confirmLabel: t.DELETE,
      cancelLabel: t.CANCEL,
      lines: [
        p.description,
        `${formatDate(p.purchase_date)} · ${this.brl(p.amount)}`,
        t.DELETE_WARNING,
      ],
      action: () =>
        this.api
          .remove(String(p.id))
          .pipe(
            catchError((error: unknown) =>
              error instanceof HttpErrorResponse && error.status === 404
                ? of(null)
                : throwError(() => error),
            ),
          ),
      errorMessage: (error) => genericErrorMessage(classifyHttpError(error)),
    });
    if (ok) {
      this.toast.show(t.TOAST_DELETED);
      this.reload$.next();
    }
  }

  /** 3. Page past the last one (also after deleting the only purchase of the page): RN-20, RN-22. */
  private fixPage(q: PurchaseListQuery, page: PaginatedPurchases): void {
    if (page.items.length === 0 && page.total > 0) {
      this.go(withPage(q, page.total_pages), true);
    } else if (page.total === 0 && q.page > 1) {
      this.go(withPage(q, 1), true);
    }
  }

  private update(change: (q: PurchaseListQuery) => PurchaseListQuery): void {
    const q = this.query();
    if (q) {
      this.go(change(q));
    }
  }

  private go(q: PurchaseListQuery, replaceUrl = false): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: toQueryParams(q),
      replaceUrl,
    });
  }
}
