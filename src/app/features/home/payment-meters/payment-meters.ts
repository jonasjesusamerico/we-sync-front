import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { apiToCents, formatBrl } from '../../../shared/money/money';
import type { MonthOverview } from '../../purchases/data/purchase.models';
import { PAYMENT_TITLE } from '../home.messages';

/** "Formas de pagamento" (#pay-meters of dashboard.html, .ws-meter; RF-05, RN-10). API order. */
@Component({
  selector: 'ws-payment-meters',
  templateUrl: './payment-meters.html',
  host: { class: 'd-block h-100' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentMeters {
  readonly overview = input.required<MonthOverview>();

  protected readonly PAYMENT_TITLE = PAYMENT_TITLE;

  protected brl(amount: string): string {
    return formatBrl(apiToCents(amount));
  }
}
