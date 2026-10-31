import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Formato da data do cabeçalho: `21/10/2026, quarta-feira` (com `LOCALE_ID` pt-BR). */
export const PAGE_HEADER_DATE_FORMAT = 'dd/MM/yyyy, EEEE';

/**
 * Cabeçalho das telas internas no estilo `app-page-title` do ArchitectUI: ícone, título e a data de hoje embaixo
 * (RF-10, RN-03). O conteúdo projetado vai para as ações, à direita.
 */
@Component({
  selector: 'app-page-header',
  imports: [DatePipe],
  template: `
    <div class="app-page-title">
      <div class="page-title-wrapper">
        <div class="page-title-heading">
          <div class="page-title-icon">
            <i class="icon" [class]="icon()" aria-hidden="true"></i>
          </div>
          <div>
            <h1>{{ title() }}</h1>
            <p class="page-title-subheading date">
              <time [attr.datetime]="today | date: 'yyyy-MM-dd'">{{
                today | date: dateFormat
              }}</time>
            </p>
          </div>
        </div>
        <div class="page-title-actions"><ng-content /></div>
      </div>
    </div>
  `,
  styles: `
    @use '../../../styles/breakpoints' as bp;

    :host {
      display: block;
    }

    h1 {
      margin: 0;
      font-size: inherit;
      font-weight: inherit;
      line-height: inherit;
    }

    .page-title-icon .icon {
      color: var(--app-logo);
      opacity: 0.8;
    }

    .page-title-actions:empty {
      display: none;
    }

    // RF-10: abaixo de $wide o cabeçalho fica centralizado, como no responsivo do template.
    @media (max-width: calc(bp.$wide - 0.02px)) {
      .page-title-wrapper,
      .page-title-heading {
        display: block;
        text-align: center;
      }

      .page-title-icon {
        margin: 0 auto 12px;
      }

      .page-title-actions {
        margin: 12px auto 0;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  /** Classe do ícone Pe-icon-7-stroke. */
  readonly icon = input('pe-7s-home');

  /** RN-03: lida uma vez, na criação. Sem timer: a data não muda sozinha. */
  protected readonly today = new Date();
  protected readonly dateFormat = PAGE_HEADER_DATE_FORMAT;
}
