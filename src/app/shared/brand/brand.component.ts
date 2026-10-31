import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { APP_NAME } from '../../layout/layout.messages';

/** Marca do app em texto, como o logo do ArchitectUI (RF-03). Sem link, foco ou estado. */
@Component({
  selector: 'app-brand',
  template: `<span class="name">{{ name }}</span>`,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      color: var(--app-on-primary);
    }

    :host(.primary) {
      color: var(--app-logo);
    }

    .name {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
      white-space: nowrap;
    }

    :host(.large) .name {
      font-size: 2.5rem;
      letter-spacing: -1px;
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
