import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  catchError,
  forkJoin,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  throwError,
} from 'rxjs';
import {
  apiErrorCode,
  classifyHttpError,
  genericErrorMessage,
} from '../../../core/http/http-error';
import { MSG_SERVER } from '../../../core/http/error-messages';
import type { HasUnsavedChanges } from '../../../core/navigation/unsaved-changes.guard';
import { TODAY } from '../../../core/navigation/today';
import { type Loadable, LOADING } from '../../../shared/loadable';
import { apiToCents, centsToApi, formatBrl } from '../../../shared/money/money';
import { formatDate, toIsoDate } from '../../../shared/date/plain-date';
import { AreaStatus } from '../../../shared/ui/area-status/area-status';
import { CategoryBubble } from '../../../shared/ui/category-bubble/category-bubble';
import { ConfirmService } from '../../../shared/ui/confirm/confirm';
import { FormAlert } from '../../../shared/ui/form-alert/form-alert';
import { Icon } from '../../../shared/ui/icon/icon';
import { MoneyInputDirective } from '../../../shared/ui/money-input/money-input';
import { ToastService } from '../../../shared/ui/toast/toast';
import {
  isoDate,
  maxCodePointsTrimmed,
  minCents,
  requiredTrimmed,
} from '../../../shared/validators/purchase-validators';
import { CatalogApi } from '../data/catalog-api';
import type {
  Category,
  PaymentMethod,
  Purchase,
  PurchaseRequest,
  PurchaseStatus,
} from '../data/purchase.models';
import { PurchasesApi } from '../data/purchases-api';
import {
  CatalogStyle,
  categoryStyle,
  findPix,
  NEUTRAL_STYLE,
  sortCategories,
  sortPaymentMethods,
} from '../catalog-style';
import { DESCRIPTION_MAX, DescriptionInputDirective } from '../purchase-description';
import { destinationOf, initialDate, readPurchaseOrigin, savedToast } from '../purchase-links';
import * as t from '../purchases.messages';

interface Options {
  categories: Category[];
  paymentMethods: PaymentMethod[];
}

const VALID_ID = /^[1-9][0-9]{0,18}$/;

const errorState = (error: unknown): Loadable<never> => ({
  status: 'error',
  message: genericErrorMessage(classifyHttpError(error)),
});

const isStatus = (error: unknown, status: number): boolean =>
  error instanceof HttpErrorResponse && error.status === status;

/**
 * New purchase and edit purchase (nova-compra.html; RF-18 to RF-25). Without topic, "De quem é o gasto?" and
 * "Repetir" (features 009, 010 and 018).
 */
@Component({
  selector: 'ws-purchase-form-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Icon,
    AreaStatus,
    CategoryBubble,
    FormAlert,
    MoneyInputDirective,
    DescriptionInputDirective,
  ],
  templateUrl: './purchase-form-page.html',
  styleUrl: './purchase-form-page.scss',
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseFormPage implements HasUnsavedChanges {
  /** From the route data (withComponentInputBinding). */
  readonly mode = input.required<'create' | 'edit'>();
  /** The :id parameter, only when editing. */
  readonly id = input<string>();

  private readonly router = inject(Router);
  private readonly api = inject(PurchasesApi);
  private readonly catalog = inject(CatalogApi);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly today = inject(TODAY);
  private readonly reloadOptions$ = new Subject<void>();
  private readonly reloadPurchase$ = new Subject<void>();

  protected readonly t = t;

  /** Read once (ADR-05): the navigation in progress, or history.state after a reload. */
  readonly origin = readPurchaseOrigin(
    this.router.currentNavigation()?.extras.state ?? inject(Location).getState(),
    this.today(),
  );
  readonly destination = destinationOf(this.origin, this.today());

  readonly options = signal<Loadable<Options>>(LOADING);
  /** Only when editing. */
  readonly purchase = signal<Loadable<Purchase> | null>(null);
  readonly submitting = signal<'save' | 'new' | null>(null);
  /** Field errors only after the first attempt (RN-08). */
  readonly submitted = signal(false);
  /** RN-25. */
  readonly formError = signal<string | null>(null);
  readonly categoryGone = signal(false);
  readonly paymentGone = signal(false);
  /** The form has its initial values (snapshot taken). */
  private readonly ready = signal(false);
  private leaving = false;
  private snapshot = '';
  private focusAfterOptions: 'categories' | 'payments' | null = null;

  private readonly fb = inject(NonNullableFormBuilder);
  readonly form = this.fb.group({
    amount: this.fb.control(0, [minCents(1)]),
    description: this.fb.control('', [requiredTrimmed, maxCodePointsTrimmed(DESCRIPTION_MAX)]),
    date: this.fb.control('', [isoDate]),
    categoryId: this.fb.control<number | null>(null, [
      (c) => (c.value === null ? { required: true } : null),
    ]),
    paymentMethodId: this.fb.control<number | null>(null, [
      (c) => (c.value === null ? { required: true } : null),
    ]),
    status: this.fb.control<PurchaseStatus>('PAID'),
  });
  readonly value = toSignal(this.form.valueChanges.pipe(map(() => this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });

  protected readonly categories = computed(() => {
    const options = this.options();
    return options.status === 'ready' ? options.value.categories : [];
  });
  protected readonly paymentMethods = computed(() => {
    const options = this.options();
    return options.status === 'ready' ? options.value.paymentMethods : [];
  });
  protected readonly optionsError = computed(() => {
    const options = this.options();
    return options.status === 'error' ? options.message : '';
  });
  protected readonly optionsReady = computed(() => this.options().status === 'ready');
  /** Edit mode while the purchase loads or fails: the form is replaced by the area state. */
  protected readonly purchaseState = computed(() => {
    const purchase = this.purchase();
    return purchase && purchase.status !== 'ready' ? purchase : null;
  });

  protected readonly errors = computed(() => {
    this.value();
    const submitted = this.submitted();
    const controls = this.form.controls;
    return {
      amount: submitted && controls.amount.invalid,
      date: submitted && controls.date.invalid,
      description: submitted
        ? controls.description.hasError('required')
          ? t.ERR_DESCRIPTION_REQUIRED
          : controls.description.hasError('maxCodePoints')
            ? t.ERR_DESCRIPTION_MAX
            : null
        : null,
      category: this.categoryGone()
        ? t.ERR_CATEGORY_GONE
        : submitted && controls.categoryId.invalid
          ? t.ERR_CATEGORY
          : null,
      payment: this.paymentGone()
        ? t.ERR_PAYMENT_GONE
        : submitted && controls.paymentMethodId.invalid
          ? t.ERR_PAYMENT
          : null,
    };
  });

  /** Live summary (RF-20). */
  protected readonly preview = computed(() => {
    const v = this.value();
    const category = this.categories().find((c) => c.id === v.categoryId);
    const payment = this.paymentMethods().find((m) => m.id === v.paymentMethodId);
    const style: CatalogStyle = category ? categoryStyle(category) : NEUTRAL_STYLE;
    return {
      style,
      description: v.description.trim() || t.NO_DESCRIPTION,
      meta: [category?.name, v.date ? formatDate(v.date) : null, payment?.name]
        .filter(Boolean)
        .join(' · '),
      amount: formatBrl(v.amount),
    };
  });

  protected readonly saveDisabled = computed(
    () => this.submitting() !== null || !this.optionsReady(),
  );

  constructor() {
    // Options of the category and payment method fields, ordered as in the prototype (ADR-06).
    this.reloadOptions$
      .pipe(
        startWith(undefined),
        switchMap(() =>
          forkJoin({
            categories: this.catalog.categories(),
            paymentMethods: this.catalog.paymentMethods(),
          }).pipe(
            map(({ categories, paymentMethods }): Loadable<Options> => ({
              status: 'ready',
              value: {
                categories: sortCategories(categories),
                paymentMethods: sortPaymentMethods(paymentMethods),
              },
            })),
            catchError((error: unknown) => of(errorState(error))),
            startWith(LOADING),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => {
        this.options.set(state);
        if (state.status === 'ready') {
          this.onOptionsReady(state.value);
        }
      });

    // Edit: the purchase, in parallel with the options (RF-23).
    combineIdAndReload(toObservable(this.id), this.reloadPurchase$)
      .pipe(
        switchMap((id) => {
          if (this.mode() !== 'edit') {
            return of(null);
          }
          if (id === undefined || !VALID_ID.test(id)) {
            this.notFound();
            return of(null);
          }
          return this.api.get(id).pipe(
            map((value): Loadable<Purchase> => ({ status: 'ready', value })),
            catchError((error: unknown) => {
              if (isStatus(error, 404) || isStatus(error, 400)) {
                this.notFound();
                return of(null);
              }
              return of(errorState(error));
            }),
            startWith(LOADING),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((state) => {
        if (state === null) {
          return;
        }
        this.purchase.set(state);
        if (state.status === 'ready') {
          const p = state.value;
          this.form.reset({
            amount: apiToCents(p.amount),
            description: p.description,
            date: p.purchase_date,
            categoryId: p.category.id,
            paymentMethodId: p.payment_method.id,
            status: p.status,
          });
          this.takeSnapshot();
        }
      });

    // Choosing another option clears the "no longer exists" message (RN-24).
    this.form.controls.categoryId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((id) => id !== null && this.categoryGone.set(false));
    this.form.controls.paymentMethodId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((id) => id !== null && this.paymentGone.set(false));
  }

  /** ADR-12: changed and undone by hand does not warn; never while leaving on purpose. */
  hasUnsavedChanges(): boolean {
    return !this.leaving && this.ready() && this.normalized() !== this.snapshot;
  }

  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
    }
  }

  protected style(c: Category): CatalogStyle {
    return categoryStyle(c);
  }

  protected retryOptions(): void {
    this.reloadOptions$.next();
  }

  protected retryPurchase(): void {
    this.reloadPurchase$.next();
  }

  /** RN-08, RN-13, RN-15, RN-16, RN-24, RN-25. */
  protected submit(andNew: boolean): void {
    if (this.submitting() !== null) {
      return;
    }
    this.submitted.set(true);
    if (!this.optionsReady()) {
      return;
    }
    if (this.form.invalid) {
      this.focusFirstInvalid();
      return;
    }
    this.submitting.set(andNew ? 'new' : 'save');
    this.formError.set(null);
    const v = this.form.getRawValue();
    const body: PurchaseRequest = {
      purchase_date: v.date,
      description: v.description.trim(),
      category_id: v.categoryId as number,
      payment_method_id: v.paymentMethodId as number,
      amount: centsToApi(v.amount),
      status: v.status,
    };
    const id = this.id();
    const request =
      this.mode() === 'edit' && id ? this.api.update(id, body) : this.api.create(body);
    request.subscribe({
      next: (saved) => this.onSaved(saved, andNew),
      error: (error: unknown) => this.onSaveError(error),
    });
  }

  /** RF-24, RN-20, RN-21: the saved data of the purchase, not what is in the form. */
  protected async askDelete(): Promise<void> {
    const purchase = this.purchase();
    const id = this.id();
    if (purchase?.status !== 'ready' || !id) {
      return;
    }
    const p = purchase.value;
    const ok = await this.confirm.ask({
      title: t.DELETE_TITLE,
      icon: 'trash',
      confirmLabel: t.DELETE,
      cancelLabel: t.CANCEL,
      lines: [
        p.description,
        `${formatDate(p.purchase_date)} · ${formatBrl(apiToCents(p.amount))}`,
        t.DELETE_WARNING,
      ],
      action: () =>
        this.api
          .remove(id)
          .pipe(
            catchError((error: unknown) =>
              isStatus(error, 404) ? of(null) : throwError(() => error),
            ),
          ),
      errorMessage: (error) => genericErrorMessage(classifyHttpError(error)),
    });
    if (ok) {
      this.leaving = true;
      this.toast.show(t.TOAST_DELETED);
      void this.goToDestination();
    }
  }

  private onOptionsReady(options: Options): void {
    if (this.mode() === 'create' && !this.ready()) {
      this.form.reset({
        amount: 0,
        description: '',
        date: toIsoDate(initialDate(this.origin, this.today())),
        categoryId: null,
        paymentMethodId: findPix(options.paymentMethods)?.id ?? null,
        status: 'PAID',
      });
      this.takeSnapshot();
    }
    const target = this.focusAfterOptions;
    if (target) {
      this.focusAfterOptions = null;
      afterNextRender(() => this.firstRadio(`#${target}`)?.focus(), { injector: this.injector });
    }
  }

  private onSaved(saved: Purchase, andNew: boolean): void {
    const text = savedToast(saved.purchase_date, this.origin, this.today());
    if (andNew) {
      this.toast.show(text);
      this.form.reset({ ...this.form.getRawValue(), amount: 0, description: '' });
      this.submitted.set(false);
      this.takeSnapshot();
      this.submitting.set(null);
      afterNextRender(() => this.field('#amount')?.focus(), { injector: this.injector });
      return;
    }
    this.leaving = true;
    this.toast.show(text);
    void this.goToDestination().then((navigated) => {
      if (!navigated) {
        this.leaving = false;
        this.submitting.set(null);
      }
    });
  }

  private onSaveError(error: unknown): void {
    const code = apiErrorCode(error);
    if (isStatus(error, 404) && code === 'CATEGORY_NOT_FOUND') {
      this.form.controls.categoryId.setValue(null);
      this.categoryGone.set(true);
      this.focusAfterOptions = 'categories';
      this.reloadOptions$.next();
    } else if (isStatus(error, 404) && code === 'PAYMENT_METHOD_NOT_FOUND') {
      this.form.controls.paymentMethodId.setValue(null);
      this.paymentGone.set(true);
      this.focusAfterOptions = 'payments';
      this.reloadOptions$.next();
    } else if (isStatus(error, 404) && code === 'NOT_FOUND' && this.mode() === 'edit') {
      this.leaving = true;
      this.toast.show(t.TOAST_GONE, 'warning');
      void this.goToDestination();
      return;
    } else if (isStatus(error, 404)) {
      this.formError.set(MSG_SERVER);
      this.reloadOptions$.next();
    } else {
      this.formError.set(genericErrorMessage(classifyHttpError(error)));
    }
    this.submitting.set(null);
  }

  /** RN-23: invalid id, not found or another user's purchase. */
  private notFound(): void {
    this.leaving = true;
    this.toast.show(t.TOAST_NOT_FOUND, 'warning');
    void this.goToDestination(true);
  }

  private goToDestination(replaceUrl = false): Promise<boolean> {
    return this.router.navigate([this.destination.path], {
      queryParams: this.destination.queryParams,
      replaceUrl,
    });
  }

  private takeSnapshot(): void {
    this.snapshot = this.normalized();
    this.ready.set(true);
  }

  private normalized(): string {
    const v = this.form.getRawValue();
    return JSON.stringify({ ...v, description: v.description.trim() });
  }

  /** CA-26: the order of the screen. */
  private focusFirstInvalid(): void {
    const c = this.form.controls;
    const target = c.amount.invalid
      ? this.field('#amount')
      : c.description.invalid
        ? this.field('#description')
        : c.date.invalid
          ? this.field('#date')
          : c.categoryId.invalid
            ? this.firstRadio('#categories')
            : c.paymentMethodId.invalid
              ? this.firstRadio('#payments')
              : null;
    target?.focus();
  }

  private field(selector: string): HTMLInputElement | null {
    return this.host.querySelector<HTMLInputElement>(selector);
  }

  /** The checked radio of a group, or the first one. */
  private firstRadio(group: string): HTMLInputElement | null {
    return (
      this.host.querySelector<HTMLInputElement>(`${group} input:checked`) ??
      this.host.querySelector<HTMLInputElement>(`${group} input`)
    );
  }
}

/** The id again on each "Tentar novamente". */
function combineIdAndReload(
  id$: Observable<string | undefined>,
  reload$: Subject<void>,
): Observable<string | undefined> {
  return id$.pipe(
    switchMap((id) =>
      reload$.pipe(
        startWith(undefined),
        map(() => id),
      ),
    ),
  );
}
