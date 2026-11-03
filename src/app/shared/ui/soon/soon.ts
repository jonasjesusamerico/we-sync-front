import { computed, Directive, input } from '@angular/core';
import { SOON_TITLE, soonLabel } from '../ui.messages';

/**
 * Item that is not available yet (RN-16, DAS 2.5). Only on <button type="button">: it stays focusable,
 * announces "em breve" and does nothing when clicked or activated by the keyboard.
 */
@Directive({
  selector: '[wsSoon]',
  host: {
    'aria-disabled': 'true',
    title: SOON_TITLE,
    class: 'is-soon',
    '[attr.aria-label]': 'ariaLabel()',
    '(click)': 'block($event)',
    '(keydown.enter)': 'block($event)',
    '(keydown.space)': 'block($event)',
  },
})
export class SoonDirective {
  /** With a value, aria-label = "<value>, em breve"; without, the visible text already has the "em breve" tag. */
  readonly wsSoonLabel = input<string>();
  protected readonly ariaLabel = computed(() => {
    const label = this.wsSoonLabel();
    return label ? soonLabel(label) : null;
  });

  protected block(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }
}
