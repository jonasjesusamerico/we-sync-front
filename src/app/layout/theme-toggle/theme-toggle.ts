import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ThemeService } from '../../core/theme/theme';
import { Icon } from '../../shared/ui/icon/icon';
import { LABEL_USE_DARK_THEME, LABEL_USE_LIGHT_THEME } from '../../shared/ui/ui.messages';

/** Theme button (RN-15). Lives in layout/ because it uses ThemeService from core/ (see the SDD decisions). */
@Component({
  selector: 'ws-theme-toggle',
  imports: [Icon],
  template: `<button
    type="button"
    [class]="buttonClass()"
    [attr.aria-label]="label()"
    (click)="theme.set(theme.theme() === 'dark' ? 'light' : 'dark')"
  >
    <ws-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" />
  </button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggle {
  readonly extraClass = input('');
  protected readonly theme = inject(ThemeService);
  protected readonly buttonClass = computed(() =>
    `btn btn-ghost btn-icon ${this.extraClass()}`.trim(),
  );
  protected readonly label = computed(() =>
    this.theme.theme() === 'dark' ? LABEL_USE_LIGHT_THEME : LABEL_USE_DARK_THEME,
  );
}
