import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatusPillKind = 'paid' | 'pending' | 'canceled';

/** Status pill (RF-13, statusPill of app.js). */
@Component({
  selector: 'ws-status-pill',
  template: `<span
    class="ws-status"
    [class.is-paid]="kind() === 'paid'"
    [class.is-pending]="kind() === 'pending'"
    [class.is-canceled]="kind() === 'canceled'"
    >{{ label() }}</span
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPill {
  readonly kind = input.required<StatusPillKind>();
  readonly label = input.required<string>();
}
