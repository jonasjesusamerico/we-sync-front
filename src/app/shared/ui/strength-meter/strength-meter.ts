import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { passwordStrength } from '../../validators/password-strength';
import { STRENGTH_HINT_EMPTY, STRENGTH_HINT_STRONG, STRENGTH_HINT_WEAK } from '../ui.messages';

/** Password strength bar and hint (RN-04). The bar is decorative; the hint is what screen readers hear. */
@Component({
  selector: 'ws-strength-meter',
  template: `
    <div class="progress ws-strength" aria-hidden="true">
      <div
        class="progress-bar"
        [class.is-weak]="strength().level === 'weak'"
        [class.is-fair]="strength().level === 'fair'"
        [class.is-strong]="strength().level === 'strong'"
        [style.width.%]="strength().percent"
      ></div>
    </div>
    <div class="form-text" [id]="hintId()" aria-live="polite">{{ hint() }}</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StrengthMeter {
  readonly password = input.required<string>();
  readonly hintId = input.required<string>();
  protected readonly strength = computed(() => passwordStrength(this.password()));
  protected readonly hint = computed(() => {
    switch (this.strength().level) {
      case 'empty':
        return STRENGTH_HINT_EMPTY;
      case 'strong':
        return STRENGTH_HINT_STRONG;
      default:
        return STRENGTH_HINT_WEAK;
    }
  });
}
