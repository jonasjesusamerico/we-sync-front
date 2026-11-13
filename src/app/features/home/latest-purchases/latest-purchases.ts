import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catalogStyle, type CatalogStyle } from '../../../core/catalog/catalog-style';
import { monthQueryParams } from '../../../shared/date/month-query';
import { formatDayMonth } from '../../../shared/date/plain-date';
import { apiToCents, formatBrl } from '../../../shared/money/money';
import { CategoryBubble } from '../../../shared/ui/category-bubble/category-bubble';
import { StatusPill, type StatusPillKind } from '../../../shared/ui/status-pill/status-pill';
import type { MonthOverview, Purchase } from '../../purchases/data/purchase.models';
import { STATUS_LABELS, statusPillKind } from '../../purchases/data/purchase-status';
import { PURCHASES_PATH } from '../../purchases/purchase-links';
import { LATEST_SEE_ALL, LATEST_TITLE, purchaseMeta } from '../home.messages';

/**
 * "Últimas compras" (#last-list of dashboard.html, .ws-tx-list; RF-04, RN-07): the API's 6 latest, any status, in
 * the API order. The rows are not links (prototype); "Ver todas" opens Compras on the same month, without filters.
 */
@Component({
  selector: 'ws-latest-purchases',
  imports: [RouterLink, CategoryBubble, StatusPill],
  templateUrl: './latest-purchases.html',
  host: { class: 'd-block h-100' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LatestPurchases {
  readonly overview = input.required<MonthOverview>();

  protected readonly LATEST_TITLE = LATEST_TITLE;
  protected readonly LATEST_SEE_ALL = LATEST_SEE_ALL;
  protected readonly PURCHASES_PATH = PURCHASES_PATH;
  protected readonly STATUS_LABELS = STATUS_LABELS;

  protected readonly query = computed(() => {
    const o = this.overview();
    return monthQueryParams({ year: o.year, month: o.month });
  });

  protected style(p: Purchase): CatalogStyle {
    return catalogStyle(p.category);
  }

  protected meta(p: Purchase): string {
    return purchaseMeta(formatDayMonth(p.purchase_date), p.payment_method.name);
  }

  protected kind(p: Purchase): StatusPillKind {
    return statusPillKind(p.status);
  }

  protected brl(amount: string): string {
    return formatBrl(apiToCents(amount));
  }
}
