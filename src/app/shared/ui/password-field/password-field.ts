import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Icon } from '../icon/icon';
import { LABEL_HIDE_PASSWORD, LABEL_SHOW_PASSWORD } from '../ui.messages';

/** Password input with the show/hide button (CA-09). The <label for> stays in the page. */
@Component({
  selector: 'ws-password-field',
  imports: [ReactiveFormsModule, Icon],
  template: `
    <div class="input-icon position-relative">
      <ws-icon name="lock" />
      <!-- eslint-disable @angular-eslint/template/no-autofocus -- only inside a modal dialog (D-12, MDN) -->
      <input
        #field
        [id]="inputId()"
        [type]="visible() ? 'text' : 'password'"
        class="form-control pe-5"
        [class.is-invalid]="invalid()"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
        [attr.autocomplete]="autocomplete()"
        [attr.autofocus]="autofocus() ? '' : null"
        [formControl]="control()"
      />
      <!-- eslint-enable @angular-eslint/template/no-autofocus -->
      <button
        type="button"
        class="btn btn-icon position-absolute top-50 end-0 translate-middle-y border-0"
        [attr.aria-controls]="inputId()"
        [attr.aria-label]="toggleLabel()"
        (click)="visible.set(!visible())"
      >
        <ws-icon [name]="visible() ? 'eyeOff' : 'eye'" />
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordField {
  readonly control = input.required<FormControl<string>>();
  readonly inputId = input.required<string>();
  readonly autocomplete = input.required<'current-password' | 'new-password'>();
  readonly invalid = input(false);
  readonly describedBy = input<string | null>(null);
  /** Initial focus inside a modal <dialog> (showModal focuses the element with `autofocus`, D-12 of feature 006). */
  readonly autofocus = input(false);
  readonly visible = signal(false);
  protected readonly toggleLabel = computed(() =>
    this.visible() ? LABEL_HIDE_PASSWORD : LABEL_SHOW_PASSWORD,
  );
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  focus(): void {
    this.field().nativeElement.focus();
  }
}
