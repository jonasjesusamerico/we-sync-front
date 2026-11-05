import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ICON_PATHS, IconName } from './icons';

/** Decorative stroke icon (ADR-03 rule 6). The accessible name always comes from the parent control. */
@Component({
  selector: 'ws-icon',
  template: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path [attr.d]="path()" />
  </svg>`,
  host: { class: 'ws-icon', '[class.ws-icon-lg]': "size() === 'lg'", 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input<'md' | 'lg'>('md');
  protected readonly path = computed(() => ICON_PATHS[this.name()]);
}
