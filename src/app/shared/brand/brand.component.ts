import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

import { APP_NAME } from '../../layout/layout.messages';

/** Marca do app: ícone `sync` + nome (RF-03). Sem link, foco ou estado. */
@Component({
  selector: 'app-brand',
  imports: [MatIcon],
  template: `<mat-icon aria-hidden="true">sync</mat-icon><span class="name">{{ name }}</span>`,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--mat-sys-on-primary);
    }

    :host(.primary) {
      color: var(--mat-sys-primary);
    }

    mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .name {
      font: var(--mat-sys-title-large);
    }

    :host(.large) {
      flex-direction: column;
      gap: 16px;
    }

    :host(.large) mat-icon {
      font-size: 96px;
      width: 96px;
      height: 96px;
    }

    :host(.large) .name {
      font: var(--mat-sys-display-large);
    }
  `,
  host: {
    '[class.large]': "size() === 'large'",
    '[class.primary]': "tone() === 'primary'",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandComponent {
  readonly size = input<'small' | 'large'>('small');
  readonly tone = input<'on-primary' | 'primary'>('on-primary');

  protected readonly name = APP_NAME;
}
