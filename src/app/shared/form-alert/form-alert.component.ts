import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Aviso fixo no formulário (RN-04, RN-05, RN-06, RN-08, RN-15). */
@Component({
  selector: 'app-form-alert',
  template: '<ng-content />',
  styles: `
    :host {
      display: block;
      padding: 12px;
      border-radius: 8px;
      overflow-wrap: anywhere;
    }

    :host(.error) {
      background-color: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
    }

    :host(.info) {
      background-color: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }
  `,
  host: {
    '[attr.role]': "kind() === 'error' ? 'alert' : 'status'",
    '[class]': 'kind()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormAlertComponent {
  readonly kind = input<'error' | 'info'>('error');
}
