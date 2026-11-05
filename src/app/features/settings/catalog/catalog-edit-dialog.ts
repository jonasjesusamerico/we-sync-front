import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom, Observable } from 'rxjs';
import { CatalogApi } from '../../../core/catalog/catalog-api';
import type {
  CatalogColor,
  CatalogIcon,
  CatalogKind,
  Category,
  PaymentMethod,
} from '../../../core/catalog/catalog.models';
import {
  COLOR_CHOICES,
  colorValue,
  DEFAULT_COLOR,
  DEFAULT_ICON,
  editableColor,
  editableIcon,
  ICON_CHOICES,
  iconName,
} from '../../../core/catalog/catalog-style';
import {
  apiErrorCode,
  classifyHttpError,
  genericErrorMessage,
} from '../../../core/http/http-error';
import { CodePointLimitDirective } from '../../../shared/text/code-point-limit';
import { FormDialog } from '../../../shared/ui/dialog/form-dialog';
import { FormAlert } from '../../../shared/ui/form-alert/form-alert';
import { Icon } from '../../../shared/ui/icon/icon';
import { fieldError } from '../../../shared/validators/field-error';
import {
  CATALOG_NAME_MAX,
  maxCodePointsTrimmed,
  requiredTrimmed,
} from '../../../shared/validators/purchase-validators';
import * as t from '../settings.messages';

export const CATALOG_NAME_ERRORS = {
  required: t.ERR_CATALOG_NAME_REQUIRED,
  maxCodePoints: t.ERR_CATALOG_NAME_MAX,
};

/** The 409 of POST/PUT shown under the name (ADR-10, RN-13); null for any other error. */
export function nameConflictMessage(error: unknown, texts: t.CatalogTexts): string | null {
  if (!(error instanceof HttpErrorResponse) || error.status !== 409) {
    return null;
  }
  switch (apiErrorCode(error)) {
    case 'DEFAULT_NAME_CONFLICT':
      return texts.errDefaultName;
    case 'NAME_CONFLICT':
      return texts.errOwnName;
    case 'ARCHIVED_NAME_CONFLICT':
      return texts.errArchivedName;
    default:
      return null;
  }
}

/**
 * Edit an own category or payment method (#edit-modal of configuracoes.html, RF-10, RN-17, RN-24). Open while it
 * exists (ws-form-dialog); the page reloads the list on `saved` and `gone`.
 */
@Component({
  selector: 'ws-catalog-edit-dialog',
  imports: [ReactiveFormsModule, CodePointLimitDirective, FormDialog, FormAlert, Icon],
  templateUrl: './catalog-edit-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogEditDialog implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(CatalogApi);

  readonly kind = input.required<CatalogKind>();
  readonly item = input.required<Category | PaymentMethod>();
  /** 200: the page closes, shows the toast and reloads. */
  readonly saved = output<void>();
  /** 404: the item does not exist anymore (RN-24). */
  readonly gone = output<void>();
  /** Cancelar, × or Esc (RN-23). */
  readonly closed = output<void>();

  protected readonly t = t;
  protected readonly texts = computed(() => t.CATALOG_TEXTS[this.kind()]);
  protected readonly ICON_CHOICES = ICON_CHOICES;
  protected readonly COLOR_CHOICES = COLOR_CHOICES;
  protected readonly NAME_MAX = CATALOG_NAME_MAX;
  protected readonly iconName = iconName;
  protected readonly colorValue = colorValue;
  protected readonly iconLabel = t.iconLabel;
  protected readonly colorLabel = t.colorLabel;

  protected readonly form = this.fb.group({
    name: ['', [requiredTrimmed, maxCodePointsTrimmed(CATALOG_NAME_MAX)]],
    icon: this.fb.control<CatalogIcon>(DEFAULT_ICON),
    color: this.fb.control<CatalogColor>(DEFAULT_COLOR),
  });

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  /** 409 under the name; cleared when the name changes. */
  readonly nameConflict = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  private readonly formEvents = toSignal(this.form.events);
  protected readonly nameError = computed(() => {
    this.formEvents();
    if (!this.submitted()) {
      return null;
    }
    return fieldError(this.form.controls.name.errors, CATALOG_NAME_ERRORS) ?? this.nameConflict();
  });

  private readonly nameInput = viewChild.required<ElementRef<HTMLInputElement>>('nameInput');

  constructor() {
    this.form.controls.name.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.nameConflict.set(null));
  }

  ngOnInit(): void {
    const item = this.item();
    // The whole name, even above 40 (RN-12); a neutral color becomes the first one (ADR-06).
    this.form.reset({
      name: item.name,
      icon: 'icon' in item ? editableIcon(item.icon) : DEFAULT_ICON,
      color: 'color' in item ? editableColor(item.color) : DEFAULT_COLOR,
    });
  }

  protected cancel(): void {
    if (!this.submitting()) {
      this.closed.emit();
    }
  }

  async submit(): Promise<void> {
    if (this.submitting()) {
      return;
    }
    this.submitted.set(true);
    this.error.set(null);
    this.nameConflict.set(null);
    const { name, icon, color } = this.form.controls;
    if (name.invalid) {
      this.nameInput().nativeElement.focus();
      return;
    }

    this.submitting.set(true);
    const id = this.item().id;
    const request: Observable<unknown> =
      this.kind() === 'category'
        ? this.api.updateCategory(id, {
            name: name.value.trim(),
            icon: icon.value,
            color: color.value,
          })
        : this.api.updatePaymentMethod(id, { name: name.value.trim() });
    try {
      await firstValueFrom(request);
    } catch (error) {
      this.submitting.set(false);
      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.gone.emit();
        return;
      }
      const conflict = nameConflictMessage(error, this.texts());
      if (conflict) {
        this.nameConflict.set(conflict);
        this.nameInput().nativeElement.focus();
      } else {
        this.error.set(genericErrorMessage(classifyHttpError(error)));
      }
      return;
    }
    this.submitting.set(false);
    this.saved.emit();
  }
}
