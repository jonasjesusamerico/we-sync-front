import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';

import { LABEL_HOME } from '../../layout/layout.messages';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

export const HOME_TITLE = 'Bem-vindo ao we-sync';

/** RF-09, RF-10, RF-11: Início com o cabeçalho de página e um cartão de boas-vindas. */
@Component({
  selector: 'app-home-page',
  imports: [PageHeaderComponent, MatCard, MatCardContent],
  template: `
    <app-page-header [title]="pageTitle" />
    <mat-card>
      <mat-card-content>
        <h2>{{ title }}</h2>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 24px;
      min-width: 0;
    }

    mat-card {
      min-width: 0;
    }

    h2 {
      margin: 0;
      font: var(--mat-sys-title-large);
      color: var(--mat-sys-on-surface);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly pageTitle = LABEL_HOME;
  protected readonly title = HOME_TITLE;
}
