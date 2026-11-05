import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';

export type FormAlertKind = 'error' | 'success' | 'info';

const ICONS: Record<FormAlertKind, IconName> = { error: 'alert', success: 'check', info: 'clock' };

/** Notice at the top of a form: error with role="alert", success and info with role="status". */
@Component({
  selector: 'ws-form-alert',
  imports: [Icon],
  template: `
    <div
      class="alert d-flex align-items-start gap-2 mb-3"
      [class.alert-danger]="kind() === 'error'"
      [class.alert-success]="kind() === 'success'"
      [class.alert-primary]="kind() === 'info'"
      [attr.role]="kind() === 'error' ? 'alert' : 'status'"
    >
      <ws-icon [name]="icon()" />
      <div><ng-content /></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormAlert {
  readonly kind = input.required<FormAlertKind>();
  protected readonly icon = computed(() => ICONS[this.kind()]);
}
