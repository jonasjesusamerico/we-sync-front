import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LABEL_HOME } from '../../layout/layout.messages';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

export const HOME_TITLE = 'Bem-vindo ao we-sync';

/** RF-09, RF-10, RF-11: Início com o cabeçalho de página e um cartão de boas-vindas (`main-card` do template). */
@Component({
  selector: 'app-home-page',
  imports: [PageHeaderComponent],
  template: `
    <app-page-header [title]="pageTitle" icon="pe-7s-home" />
    <div class="main-card mb-3 card">
      <div class="card-body">
        <h2 class="card-title">{{ title }}</h2>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    .card-title {
      margin: 0;
      font-size: 1.1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly pageTitle = LABEL_HOME;
  protected readonly title = HOME_TITLE;
}
