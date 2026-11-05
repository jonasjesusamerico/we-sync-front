import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';

/** Colored category bubble (RN-10, catBubble of app.js). Decorative: the name is always shown next to it. */
@Component({
  selector: 'ws-category-bubble',
  imports: [Icon],
  template: `<ws-icon [name]="icon()" />`,
  host: { class: 'ws-cat', 'aria-hidden': 'true', '[style.--cat]': 'color()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryBubble {
  readonly icon = input.required<IconName>();
  /** Always a token, e.g. 'var(--ws-cat-food)'. */
  readonly color = input.required<string>();
}
