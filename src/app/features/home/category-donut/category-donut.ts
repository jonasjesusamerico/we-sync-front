import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { catalogStyle } from '../../../core/catalog/catalog-style';
import { apiToCents, formatBrl } from '../../../shared/money/money';
import type { MonthOverview } from '../../purchases/data/purchase.models';
import { donutBackground, donutLabel } from '../home-charts';
import { CATEGORY_TITLE, CATEGORY_TOP_CAPTION } from '../home.messages';

/** "Por categoria" (#cat-donut of dashboard.html, .ws-donut + .ws-legend; RF-03, RN-10). API order. */
@Component({
  selector: 'ws-category-donut',
  templateUrl: './category-donut.html',
  host: { class: 'd-block h-100' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryDonut {
  readonly overview = input.required<MonthOverview>();

  protected readonly CATEGORY_TITLE = CATEGORY_TITLE;
  protected readonly CATEGORY_TOP_CAPTION = CATEGORY_TOP_CAPTION;

  protected readonly background = computed(() => donutBackground(this.overview()));
  protected readonly label = computed(() => donutLabel(this.overview()));
  /** The first one is the largest (RN-10); "—" as in the prototype when the list is empty. */
  protected readonly top = computed(() => this.overview().categories[0]?.category.name ?? '—');
  protected readonly rows = computed(() =>
    this.overview().categories.map((c) => ({
      id: c.category.id,
      name: c.category.name,
      color: catalogStyle(c.category).color,
      percent: c.percent,
      brl: formatBrl(apiToCents(c.amount)),
    })),
  );
}
