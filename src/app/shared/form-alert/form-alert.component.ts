import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Aviso fixo no formulário, como `.alert` do Bootstrap (RN-04, RN-05, RN-06, RN-08, RN-15). */
@Component({
  selector: 'app-form-alert',
  template: '<ng-content />',
  styles: `
    :host {
      display: block;
      margin-bottom: 0;
      overflow-wrap: anywhere;
    }
  `,
  host: {
    class: 'alert',
    '[attr.role]': "kind() === 'error' ? 'alert' : 'status'",
    '[class.alert-danger]': "kind() === 'error'",
    '[class.alert-info]': "kind() === 'info'",
    '[class.error]': "kind() === 'error'",
    '[class.info]': "kind() === 'info'",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormAlertComponent {
  readonly kind = input<'error' | 'info'>('error');
}
