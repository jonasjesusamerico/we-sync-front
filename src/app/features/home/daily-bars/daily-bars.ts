import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { monthName } from '../../../shared/date/plain-date';
import type { MonthOverview } from '../../purchases/data/purchase.models';
import { axisTicks, dailyBars } from '../home-charts';
import { DAILY_SUBTITLE, DAILY_TITLE, dailyChartLabel, peakDay } from '../home.messages';

/**
 * "Gastos por dia" (#daily-bars of dashboard.html, .ws-bars; RF-02, RN-09). The chart is an image with a name; the
 * days with purchases are also in a hidden list (ADR-08).
 */
@Component({
  selector: 'ws-daily-bars',
  templateUrl: './daily-bars.html',
  host: { class: 'd-block h-100' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyBars {
  readonly overview = input.required<MonthOverview>();

  protected readonly DAILY_TITLE = DAILY_TITLE;
  protected readonly DAILY_SUBTITLE = DAILY_SUBTITLE;
  protected readonly peakDay = peakDay;

  protected readonly bars = computed(() => dailyBars(this.overview()));
  /** Days without purchases stay out of the list (ADR-08). */
  protected readonly filled = computed(() => this.bars().filter((bar) => !bar.empty));
  protected readonly ticks = computed(() => axisTicks(this.overview().days_in_month));
  protected readonly chartLabel = computed(() => dailyChartLabel(monthName(this.overview().month)));
}
