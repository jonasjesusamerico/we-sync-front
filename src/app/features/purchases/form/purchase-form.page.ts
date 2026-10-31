import { Dialog } from '@angular/cdk/dialog';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

import { genericErrorMessage, MSG_SERVER } from '../../../core/http/error-messages';
import { openConfirm } from '../../../shared/confirm-dialog/confirm-dialog';
import { FormAlertComponent } from '../../../shared/form-alert/form-alert.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { Notifier } from '../../../shared/notifier/notifier';
import { touchedErrorFrom } from '../../../shared/validators/control-error-message';
import { CalendarPanelComponent, plainOf } from '../calendar/calendar-panel.component';
import { classifySaveError, isPurchaseNotFound } from '../api-errors';
import { currentMonthQuery, ListQuery, readOrigin, toRouteParams } from '../list-query';
import { formatBrlCurrency } from '../list/purchase-row';
import { apiToCents } from '../money';
import { OptionsApi } from '../options.api';
import { displayApiDate, PlainDate, todayPlain } from '../plain-date';
import {
  CALENDAR_LABELS,
  DATE_HINT,
  DELETE_DIALOG_TITLE,
  DELETE_DIALOG_WARNING,
  LABEL_AMOUNT,
  LABEL_CANCEL,
  LABEL_CATEGORY,
  LABEL_DATE,
  LABEL_DELETE,
  LABEL_DESCRIPTION,
  LABEL_LOADING,
  LABEL_NEW_PURCHASE,
  LABEL_PAYMENT_METHOD,
  LABEL_RETRY,
  LABEL_SAVE,
  LABEL_SAVE_AND_NEW,
  LABEL_STATUS,
  MSG_DELETED,
  MSG_NOT_FOUND,
  MSG_PURCHASE_GONE,
  STATUS_LABELS,
  TITLE_EDIT_PURCHASE,
} from '../purchase.messages';
import {
  Option,
  Purchase,
  PURCHASE_ID_PATTERN,
  PURCHASE_STATUSES,
  PurchaseStatus,
} from '../purchase.models';
import { PurchasesApi } from '../purchases.api';
import type { PurchaseFormMode } from '../purchases.routes';
import { BrDateInputDirective } from './br-date-input.directive';
import { MoneyInputDirective } from './money-input.directive';
import {
  emptyFormValue,
  fromPurchase,
  PurchaseFormValue,
  savedMessage,
  snapshotOf,
  toRequest,
} from './purchase-form.logic';
import {
  amountValidator,
  descriptionValidator,
  PurchaseField,
  purchaseFieldError,
} from './purchase-form.validators';

type Result<T> = { ok: true; value: T } | { ok: false; error: unknown };

function settle<T>(source: Observable<T>): Observable<Result<T>> {
  return source.pipe(
    map((value): Result<T> => ({ ok: true, value })),
    catchError((error: unknown) => of<Result<T>>({ ok: false, error })),
  );
}

/** Novo lançamento e edição (RF-16 a RF-24). Volta sempre à lista de origem (RN-05). */
@Component({
  selector: 'app-purchase-form-page',
  imports: [
    ReactiveFormsModule,
    CdkOverlayOrigin,
    CdkConnectedOverlay,
    PageHeaderComponent,
    FormAlertComponent,
    CalendarPanelComponent,
    BrDateInputDirective,
    MoneyInputDirective,
  ],
  templateUrl: './purchase-form.page.html',
  styleUrl: './purchase-form.page.scss',
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseFormPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(PurchasesApi);
  private readonly optionsApi = inject(OptionsApi);
  private readonly dialog = inject(Dialog);
  private readonly notifier = inject(Notifier);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly mode: PurchaseFormMode = this.route.snapshot.data['mode'];
  private readonly id: string | null = this.route.snapshot.paramMap.get('id');
  private readonly origin = readOrigin(inject(Location).getState(), new Date());
  /** RN-05: a lista de onde veio, ou a do mês atual. */
  private readonly backTarget: ListQuery = this.origin ?? currentMonthQuery(new Date());

  protected readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly loadError = signal<string | null>(null);
  protected readonly categories = signal<Option[]>([]);
  protected readonly paymentMethods = signal<Option[]>([]);
  protected readonly submitting = signal<'save' | 'save-new' | null>(null);
  protected readonly formAlert = signal<string | null>(null);
  protected readonly calendarOpen = signal(false);
  protected readonly calendarSelection = signal<PlainDate | null>(null);
  protected readonly today = todayPlain(new Date());
  private readonly loaded = signal<Purchase | null>(null);
  /** RN-11: salvou, excluiu ou saiu por RN-16/RN-17; o guard não pergunta. */
  private leaving = false;
  private snapshot = '';

  private readonly descriptionInput = viewChild<ElementRef<HTMLInputElement>>('description');

  protected readonly form = inject(NonNullableFormBuilder).group({
    date: [null as Date | null, [Validators.required]],
    description: ['', [descriptionValidator]],
    amount: ['', [amountValidator]],
    categoryId: [null as number | null, [Validators.required]],
    paymentMethodId: [null as number | null, [Validators.required]],
    status: ['PAID' as PurchaseStatus],
  });

  protected readonly dateError = this.errorOf('date');
  protected readonly descriptionError = this.errorOf('description');
  protected readonly amountError = this.errorOf('amount');
  protected readonly categoryError = this.errorOf('categoryId');
  protected readonly paymentMethodError = this.errorOf('paymentMethodId');

  protected readonly statuses = PURCHASE_STATUSES;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly text = {
    title: this.mode === 'create' ? LABEL_NEW_PURCHASE : TITLE_EDIT_PURCHASE,
    date: LABEL_DATE,
    dateHint: DATE_HINT,
    openCalendar: CALENDAR_LABELS.open,
    description: LABEL_DESCRIPTION,
    amount: LABEL_AMOUNT,
    category: LABEL_CATEGORY,
    paymentMethod: LABEL_PAYMENT_METHOD,
    status: LABEL_STATUS,
    save: LABEL_SAVE,
    saveAndNew: LABEL_SAVE_AND_NEW,
    delete: LABEL_DELETE,
    cancel: LABEL_CANCEL,
    retry: LABEL_RETRY,
    loading: LABEL_LOADING,
  };

  constructor() {
    this.load();
  }

  /**
   * Erro visível só com o campo tocado, como no login (001): depois de "Salvar e criar outro", a Descrição e o Valor
   * vazios não aparecem em vermelho. Um envio inválido mostra tudo, porque o `submit` chama `markAllAsTouched()`.
   */
  private errorOf(field: PurchaseField) {
    return touchedErrorFrom(this.form.controls[field], (errors) =>
      purchaseFieldError(field, errors),
    );
  }

  /** RN-09 a RN-11: há algo digitado que ainda não foi salvo? */
  hasUnsavedChanges(): boolean {
    return (
      !this.leaving &&
      this.status() === 'ready' &&
      snapshotOf(this.form.getRawValue()) !== this.snapshot
    );
  }

  /** RF-25, RN-16, RN-19: carrega as opções (e o lançamento, na edição). */
  protected load(): void {
    if (this.mode === 'edit' && !PURCHASE_ID_PATTERN.test(this.id ?? '')) {
      this.leaveWith(MSG_NOT_FOUND);
      return;
    }
    this.status.set('loading');
    this.loadError.set(null);
    forkJoin({
      purchase: this.mode === 'edit' ? settle(this.api.get(this.id!)) : of(null),
      categories: settle(this.optionsApi.categories()),
      paymentMethods: settle(this.optionsApi.paymentMethods()),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ purchase, categories, paymentMethods }) => {
        // O 404/400 do lançamento vale mesmo que as opções falhem (DAS).
        if (purchase && !purchase.ok && isPurchaseNotFound(purchase.error)) {
          this.leaveWith(MSG_NOT_FOUND);
          return;
        }
        const failed = [purchase, categories, paymentMethods].find((r) => r && !r.ok);
        if (failed && !failed.ok) {
          this.status.set('error');
          this.loadError.set(genericErrorMessage(failed.error));
          return;
        }
        if (!categories.ok || !paymentMethods.ok) {
          return;
        }
        this.categories.set(categories.value);
        this.paymentMethods.set(paymentMethods.value);
        let value: PurchaseFormValue;
        if (purchase?.ok) {
          this.loaded.set(purchase.value);
          value = fromPurchase(purchase.value);
        } else {
          value = emptyFormValue(this.origin, new Date());
        }
        this.form.reset(value);
        this.snapshot = snapshotOf(this.form.getRawValue());
        this.status.set('ready');
      });
  }

  protected submit(kind: 'save' | 'save-new'): void {
    if (this.submitting() !== null || this.status() !== 'ready') {
      return;
    }
    this.formAlert.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const body = toRequest(this.form.getRawValue());
    this.submitting.set(kind);
    const request =
      this.mode === 'create' ? this.api.create(body) : this.api.update(this.id!, body);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => this.onSaved(kind, saved),
      error: (error: unknown) => this.onSaveError(error),
    });
  }

  private onSaved(kind: 'save' | 'save-new', saved: Purchase): void {
    const message = savedMessage(saved.purchase_date, this.backTarget);
    if (kind === 'save-new' && this.mode === 'create') {
      // RN-07: fica no formulário, com data, opções e status; a origem continua a mesma.
      this.notifier.show(message);
      this.form.reset({ ...this.form.getRawValue(), description: '', amount: '' });
      this.snapshot = snapshotOf(this.form.getRawValue());
      this.submitting.set(null);
      this.descriptionInput()?.nativeElement.focus();
      return;
    }
    // `submitting` fica preenchido até a página sumir (DAS).
    this.leaving = true;
    this.notifier.show(message);
    this.goBack();
  }

  /** RN-17, RN-18. */
  private onSaveError(error: unknown): void {
    switch (classifySaveError(error, this.mode)) {
      case 'category-gone':
        this.submitting.set(null);
        this.markGone(this.form.controls.categoryId);
        this.reloadOptions(false);
        return;
      case 'payment-gone':
        this.submitting.set(null);
        this.markGone(this.form.controls.paymentMethodId);
        this.reloadOptions(false);
        return;
      case 'purchase-gone':
        this.leaveWith(MSG_PURCHASE_GONE);
        return;
      case 'unknown-404':
        this.submitting.set(null);
        this.formAlert.set(MSG_SERVER);
        this.reloadOptions(true);
        return;
      default: {
        this.submitting.set(null);
        const message = genericErrorMessage(error);
        if (message !== null) {
          this.formAlert.set(message);
        }
      }
    }
  }

  private markGone(control: AbstractControl<number | null>): void {
    control.setValue(null);
    control.setErrors({ gone: true });
    control.markAsTouched();
  }

  /** Recarrega as opções depois de RN-17. Falha: mensagem genérica (ou nada, se `silent`) e listas antigas. */
  private reloadOptions(silent: boolean): void {
    this.optionsApi
      .both()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ categories, paymentMethods }) => {
          this.categories.set(categories);
          this.paymentMethods.set(paymentMethods);
        },
        error: (error: unknown) => {
          if (!silent) {
            this.formAlert.set(genericErrorMessage(error));
          }
        },
      });
  }

  /** Abre o calendário no dia do campo (ou hoje). */
  protected openCalendar(): void {
    this.calendarSelection.set(plainOf(this.form.controls.date.value));
    this.calendarOpen.set(true);
  }

  protected pickDate(date: Date): void {
    const control = this.form.controls.date;
    control.setValue(date);
    control.markAsDirty();
    control.markAsTouched();
    this.calendarOpen.set(false);
  }

  protected onCalendarKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.calendarOpen.set(false);
    }
  }

  protected cancel(): void {
    this.goBack();
  }

  /** RF-24: exclusão pela edição; o `404` também é sucesso (RN-14). */
  protected confirmDelete(): void {
    const p = this.loaded();
    if (this.mode !== 'edit' || !p) {
      return;
    }
    openConfirm(this.dialog, {
      title: DELETE_DIALOG_TITLE,
      lines: [
        p.description,
        displayApiDate(p.purchase_date),
        formatBrlCurrency(apiToCents(p.amount)),
      ],
      warning: DELETE_DIALOG_WARNING,
      cancelLabel: LABEL_CANCEL,
      confirmLabel: LABEL_DELETE,
      action: () => this.api.remove(this.id!),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((deleted) => {
        if (deleted) {
          this.leaveWith(MSG_DELETED);
        }
      });
  }

  /** RN-10: o navegador mostra o aviso padrão ao fechar ou recarregar com alteração. */
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
    }
  }

  private leaveWith(message: string): void {
    this.leaving = true;
    this.goBack();
    this.notifier.show(message);
  }

  private goBack(): void {
    void this.router.navigate(['/lancamentos'], {
      queryParams: toRouteParams(this.backTarget),
      replaceUrl: true,
    });
  }
}
