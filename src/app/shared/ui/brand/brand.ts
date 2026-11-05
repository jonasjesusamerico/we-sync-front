import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../icon/icon';
import { BRAND_NAME } from '../ui.messages';

/** we-sync mark (.ws-brand of the prototype); with `link`, it goes to the home page. */
@Component({
  selector: 'ws-brand',
  imports: [RouterLink, Icon],
  template: `
    @if (link()) {
      <a class="ws-brand" routerLink="/inicio"
        ><span class="ws-brand-mark"><ws-icon name="sync" /></span>{{ BRAND_NAME }}</a
      >
    } @else {
      <span class="ws-brand"
        ><span class="ws-brand-mark"><ws-icon name="sync" /></span>{{ BRAND_NAME }}</span
      >
    }
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Brand {
  readonly link = input(false);
  protected readonly BRAND_NAME = BRAND_NAME;
}
