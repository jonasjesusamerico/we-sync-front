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
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  catchError,
  firstValueFrom,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { CatalogApi } from '../../../core/catalog/catalog-api';
import type {
  CatalogColor,
  CatalogIcon,
  CatalogKind,
  Category,
  Created,
  PaymentMethod,
} from '../../../core/catalog/catalog.models';
import { settingsLists } from '../../../core/catalog/catalog-options';
import {
  catalogStyle,
  CatalogStyle,
  COLOR_CHOICES,
  colorValue,
  DEFAULT_COLOR,
  DEFAULT_ICON,
  ICON_CHOICES,
  iconName,
  PAYMENT_STYLE,
} from '../../../core/catalog/catalog-style';
import { classifyHttpError, genericErrorMessage } from '../../../core/http/http-error';
import { Loadable, LOADING } from '../../../shared/loadable';
import { CodePointLimitDirective } from '../../../shared/text/code-point-limit';
import { AreaStatus } from '../../../shared/ui/area-status/area-status';
import { CategoryBubble } from '../../../shared/ui/category-bubble/category-bubble';
import { ConfirmService } from '../../../shared/ui/confirm/confirm';
import { FormAlert } from '../../../shared/ui/form-alert/form-alert';
import { Icon } from '../../../shared/ui/icon/icon';
import { ToastService } from '../../../shared/ui/toast/toast';
import { fieldError } from '../../../shared/validators/field-error';
import {
  CATALOG_NAME_MAX,
  maxCodePointsTrimmed,
  requiredTrimmed,
} from '../../../shared/validators/purchase-validators';
import * as t from '../settings.messages';
import { CATALOG_NAME_ERRORS, CatalogEditDialog, nameConflictMessage } from './catalog-edit-dialog';

type CatalogItem = Category | PaymentMethod;

const isNotFound = (error: unknown): boolean =>
  error instanceof HttpErrorResponse && error.status === 404;

/**
 * Categorias and Formas de pagamento sections (#tab-categorias without Tópicos and #tab-pagamentos of
 * configuracoes.html, RF-08 to RF-13): create, list (own, defaults and archived), edit, archive and reactivate.
 */
@Component({
  selector: 'ws-catalog-section',
  imports: [
    ReactiveFormsModule,
    AreaStatus,
    CatalogEditDialog,
    CategoryBubble,
    CodePointLimitDirective,
    FormAlert,
    Icon,
  ],
  templateUrl: './catalog-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogSection {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(CatalogApi);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly injector = inject(Injector);

  /** From the route's `data` (withComponentInputBinding). */
  readonly kind = input.required<CatalogKind>();

  protected readonly t = t;
  protected readonly texts = computed(() => t.CATALOG_TEXTS[this.kind()]);
  protected readonly ICON_CHOICES = ICON_CHOICES;
  protected readonly COLOR_CHOICES = COLOR_CHOICES;
  protected readonly NAME_MAX = CATALOG_NAME_MAX;
  protected readonly iconName = iconName;
  protected readonly colorValue = colorValue;
  protected readonly iconLabel = t.iconLabel;
  protected readonly colorLabel = t.colorLabel;

  readonly list = signal<Loadable<readonly CatalogItem[]>>(LOADING);
  protected readonly errorMessage = computed(() => {
    const list = this.list();
    return list.status === 'error' ? list.message : '';
  });
  readonly lists = computed(() => {
    const list = this.list();
    return list.status === 'ready' ? settingsLists(list.value, this.kind()) : null;
  });

  protected readonly createForm = this.fb.group({
    name: ['', [requiredTrimmed, maxCodePointsTrimmed(CATALOG_NAME_MAX)]],
    icon: this.fb.control<CatalogIcon>(DEFAULT_ICON),
    color: this.fb.control<CatalogColor>(DEFAULT_COLOR),
  });

  readonly creating = signal(false);
  readonly createSubmitted = signal(false);
  /** Name error from the API (409); cleared when the name changes. */
  readonly createNameError = signal<string | null>(null);
  /** RN-25. */
  readonly createError = signal<string | null>(null);
  readonly editing = signal<CatalogItem | null>(null);
  readonly reactivating = signal<ReadonlySet<number>>(new Set());

  private readonly createEvents = toSignal(this.createForm.events);
  protected readonly nameError = computed(() => {
    this.createEvents();
    if (!this.createSubmitted()) {
      return null;
    }
    return (
      fieldError(this.createForm.controls.name.errors, CATALOG_NAME_ERRORS) ??
      this.createNameError()
    );
  });

  private readonly nameInput = viewChild.required<ElementRef<HTMLInputElement>>('nameInput');
  private readonly listTitle = viewChild.required<ElementRef<HTMLElement>>('listTitle');
  private readonly reload$ = new Subject<void>();

  constructor() {
    // First load shows "loading"; the reloads after saving keep the current list until the answer (no flicker).
    toObservable(this.kind)
      .pipe(
        switchMap((kind) => {
          this.list.set(LOADING);
          return this.reload$.pipe(
            startWith(undefined),
            switchMap(() => this.fetch(kind)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.list.set(state));
    this.createForm.controls.name.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.createNameError.set(null));
  }

  protected bubble(item: CatalogItem): CatalogStyle {
    return 'icon' in item ? catalogStyle(item) : PAYMENT_STYLE;
  }

  protected retry(): void {
    this.list.set(LOADING);
    this.reload$.next();
  }

  async create(): Promise<void> {
    if (this.creating() || this.list().status !== 'ready') {
      return;
    }
    this.createSubmitted.set(true);
    this.createError.set(null);
    this.createNameError.set(null);
    const { name, icon, color } = this.createForm.controls;
    if (name.invalid) {
      this.nameInput().nativeElement.focus();
      return;
    }

    this.creating.set(true);
    const texts = this.texts();
    const request: Observable<Created<CatalogItem>> =
      this.kind() === 'category'
        ? this.api.createCategory({ name: name.value.trim(), icon: icon.value, color: color.value })
        : this.api.createPaymentMethod({ name: name.value.trim() });
    try {
      const created = await firstValueFrom(request);
      this.toast.show(created.reactivated ? texts.toastReactivated : texts.toastAdded);
      this.createForm.reset({ name: '', icon: DEFAULT_ICON, color: DEFAULT_COLOR });
      this.createSubmitted.set(false);
      this.reload$.next();
    } catch (error) {
      const conflict = nameConflictMessage(error, texts);
      if (conflict) {
        this.createNameError.set(conflict);
        this.nameInput().nativeElement.focus();
      } else {
        this.createError.set(genericErrorMessage(classifyHttpError(error)));
      }
    } finally {
      this.creating.set(false);
    }
  }

  protected onSaved(): void {
    this.editing.set(null);
    this.toast.show(this.texts().toastUpdated);
    this.reload$.next();
  }

  protected onGone(): void {
    this.editing.set(null);
    this.toast.show(this.texts().toastGone, 'warning');
    this.reload$.next();
  }

  async archive(item: CatalogItem): Promise<void> {
    const kind = this.kind();
    const texts = this.texts();
    const result: { outcome: 'archived' | 'gone' } = { outcome: 'archived' };
    const confirmed = await this.confirm.ask({
      icon: 'archive',
      title: texts.archiveTitle,
      lines: [texts.archiveText(item.name)],
      confirmLabel: t.ARCHIVE,
      cancelLabel: t.CANCEL,
      action: () =>
        this.api.archive(kind, item.id).pipe(
          map(() => 'archived' as const),
          catchError((error: unknown) =>
            isNotFound(error) ? of('gone' as const) : throwError(() => error),
          ),
          tap((outcome) => (result.outcome = outcome)),
        ),
      errorMessage: (error) => genericErrorMessage(classifyHttpError(error)),
    });
    if (!confirmed) {
      return;
    }
    if (result.outcome === 'gone') {
      this.toast.show(texts.toastGone, 'warning');
    } else {
      this.toast.show(texts.toastArchived);
    }
    this.afterListChange();
  }

  async reactivate(item: CatalogItem): Promise<void> {
    if (this.reactivating().has(item.id)) {
      return;
    }
    const texts = this.texts();
    this.reactivating.update((ids) => new Set(ids).add(item.id));
    try {
      await firstValueFrom(this.api.unarchive(this.kind(), item.id));
      this.toast.show(texts.toastReactivated);
    } catch (error) {
      if (isNotFound(error)) {
        this.toast.show(texts.toastGone, 'warning');
      } else {
        this.toast.show(genericErrorMessage(classifyHttpError(error)), 'warning');
      }
    } finally {
      this.reactivating.update((ids) => {
        const next = new Set(ids);
        next.delete(item.id);
        return next;
      });
    }
    this.afterListChange();
  }

  /** Reload and focus the list title: the button that had the focus is gone (D-06). */
  private afterListChange(): void {
    this.reload$.next();
    afterNextRender(() => this.listTitle().nativeElement.focus(), { injector: this.injector });
  }

  private fetch(kind: CatalogKind): Observable<Loadable<readonly CatalogItem[]>> {
    const request: Observable<readonly CatalogItem[]> =
      kind === 'category' ? this.api.categories() : this.api.paymentMethods();
    return request.pipe(
      map((value): Loadable<readonly CatalogItem[]> => ({ status: 'ready', value })),
      catchError((error: unknown) =>
        of<Loadable<readonly CatalogItem[]>>({
          status: 'error',
          message: genericErrorMessage(classifyHttpError(error)),
        }),
      ),
    );
  }
}
