import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { apiToCents, formatBrl } from '../../../shared/money/money';
import { Icon } from '../../../shared/ui/icon/icon';
import type { MonthOverview } from '../../purchases/data/purchase.models';
import {
  KPI_AVERAGE,
  KPI_COUNT,
  KPI_COUNT_FOOT,
  KPI_PAID,
  KPI_PENDING,
  inDays,
  purchaseCount,
} from '../home.messages';

const brl = (amount: string): string => formatBrl(apiToCents(amount));

/** Month indicators (#kpi-cards of dashboard.html, .ws-kpi; RF-01, RN-06, RN-08). Only shows what the API sends. */
@Component({
  selector: 'ws-month-kpis',
  imports: [Icon],
  templateUrl: './month-kpis.html',
  host: { class: 'd-block h-100' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthKpis {
  readonly overview = input.required<MonthOverview>();

  protected readonly KPI_PAID = KPI_PAID;
  protected readonly KPI_PENDING = KPI_PENDING;
  protected readonly KPI_COUNT = KPI_COUNT;
  protected readonly KPI_COUNT_FOOT = KPI_COUNT_FOOT;
  protected readonly KPI_AVERAGE = KPI_AVERAGE;

  protected readonly paid = computed(() => brl(this.overview().paid.amount));
  protected readonly paidCount = computed(() => purchaseCount(this.overview().paid.count));
  protected readonly pending = computed(() => brl(this.overview().pending.amount));
  protected readonly pendingCount = computed(() => purchaseCount(this.overview().pending.count));
  protected readonly average = computed(() => brl(this.overview().daily_average.amount));
  protected readonly averageDays = computed(() => inDays(this.overview().daily_average.days));
}
