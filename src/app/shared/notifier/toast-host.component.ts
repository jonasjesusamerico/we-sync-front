import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { Notifier } from './notifier';

export const LABEL_CLOSE_NOTICE = 'Fechar aviso';

/**
 * Mostra o aviso do `Notifier` como `.toast` do Bootstrap. A região `aria-live="polite"` existe sempre, para o aviso
 * ser anunciado; sem `role="status"`, para não contar como aviso na tela quando está vazia.
 */
@Component({
  selector: 'app-toast-host',
  template: `
    <div class="app-toast-region" aria-live="polite">
      @if (notifier.notice(); as notice) {
        <div class="toast show align-items-center text-bg-dark border-0">
          <div class="d-flex">
            <div class="toast-body">{{ notice.text }}</div>
            <button
              type="button"
              class="btn-close btn-close-white me-2 m-auto"
              [attr.aria-label]="closeLabel"
              (click)="notifier.dismiss()"
            ></button>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastHostComponent {
  protected readonly notifier = inject(Notifier);
  protected readonly closeLabel = LABEL_CLOSE_NOTICE;
}
