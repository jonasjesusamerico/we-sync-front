import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';

import { genericErrorMessage } from '../../core/http/error-messages';
import { FormAlertComponent } from '../form-alert/form-alert.component';

export interface ConfirmDialogData {
  title: string;
  /** Ex.: descrição, data e valor, um por linha. */
  lines?: readonly string[];
  /** Ex.: "Esta ação não pode ser desfeita." */
  warning?: string;
  cancelLabel: string;
  confirmLabel: string;
  /** Opcional. Com ação, "confirmar" executa e só fecha no sucesso. */
  action?: () => Observable<unknown>;
}

/** `id` do título, para o `aria-labelledby` do diálogo (só um diálogo aberto por vez). */
export const CONFIRM_DIALOG_TITLE_ID = 'app-confirm-dialog-title';

/**
 * Confirmação com título, linhas, aviso e dois botões (cancelar primeiro, para receber o foco). Com `action`, executa,
 * mostra carregando e o erro dentro do diálogo (ADR-10). Miolo `.modal-content` do Bootstrap.
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [FormAlertComponent],
  template: `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title h5" [id]="titleId">{{ data.title }}</h2>
      </div>
      <div class="modal-body">
        @if (error(); as message) {
          <app-form-alert>{{ message }}</app-form-alert>
        }
        @for (line of data.lines ?? []; track $index) {
          <p>{{ line }}</p>
        }
        @if (data.warning) {
          <p class="warning">{{ data.warning }}</p>
        }
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" [disabled]="running()" (click)="cancel()">
          {{ data.cancelLabel }}
        </button>
        <button type="button" class="btn btn-primary" [disabled]="running()" (click)="confirm()">
          @if (running()) {
            <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          }
          {{ data.confirmLabel }}
        </button>
      </div>
    </div>
  `,
  styles: `
    p {
      margin: 0 0 8px;
      overflow-wrap: anywhere;
    }

    p:last-child {
      margin-bottom: 0;
    }

    app-form-alert {
      margin-bottom: 12px;
    }

    .warning {
      color: var(--app-muted);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  protected readonly data = inject<ConfirmDialogData>(DIALOG_DATA);
  private readonly ref = inject<DialogRef<boolean, ConfirmDialogComponent>>(DialogRef);
  protected readonly titleId = CONFIRM_DIALOG_TITLE_ID;

  protected readonly running = signal(false);
  protected readonly error = signal<string | null>(null);

  protected cancel(): void {
    this.ref.close(false);
  }

  protected confirm(): void {
    const action = this.data.action;
    if (!action) {
      this.ref.close(true);
      return;
    }
    if (this.running()) {
      return;
    }
    this.running.set(true);
    this.error.set(null);
    this.ref.disableClose = true;
    action().subscribe({
      complete: () => this.ref.close(true),
      error: (e: unknown) => {
        this.running.set(false);
        this.ref.disableClose = false;
        const message = genericErrorMessage(e);
        if (message === null) {
          // RefreshError: a sessão acabou e o interceptor já está levando ao login.
          this.ref.close(false);
        } else {
          this.error.set(message);
        }
      },
    });
  }
}
