import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrentUserStore } from '../../core/user/current-user-store';
import { Icon } from '../../shared/ui/icon/icon';
import { greeting, GREETING_FALLBACK, HOME_SOON, HOME_SUBTITLE } from './home.messages';

/** Frame of the home page (RF-11, DAS 5.6): greeting and the "coming soon" summary notice. */
@Component({
  selector: 'ws-home-page',
  imports: [Icon],
  template: `
    <div class="ws-page-head">
      <div>
        <h1>{{ title() }}</h1>
        <p>{{ HOME_SUBTITLE }}</p>
      </div>
    </div>
    <div class="ws-callout">
      <ws-icon name="clock" />
      <div>{{ HOME_SOON }}</div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly store = inject(CurrentUserStore);
  protected readonly HOME_SUBTITLE = HOME_SUBTITLE;
  protected readonly HOME_SOON = HOME_SOON;
  protected readonly title = computed(() => {
    const user = this.store.user();
    return user ? greeting(user.name) : GREETING_FALLBACK;
  });
}
