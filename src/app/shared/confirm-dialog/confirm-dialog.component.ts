import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
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

/**
 * Confirmação com título, linhas, aviso e dois botões (cancelar primeiro, para receber o foco). Com `action`, executa,
 * mostra carregando e o erro dentro do diálogo (ADR-10).
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatProgressSpinner,
    FormAlertComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      @if (error(); as message) {
        <app-form-alert>{{ message }}</app-form-alert>
      }
      @for (line of data.lines ?? []; track $index) {
        <p>{{ line }}</p>
      }
      @if (data.warning) {
        <p class="warning">{{ data.warning }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [disabled]="running()" (click)="cancel()">
        {{ data.cancelLabel }}
      </button>
      <button mat-flat-button type="button" [disabled]="running()" (click)="confirm()">
        @if (running()) {
          <mat-progress-spinner diameter="20" mode="indeterminate" />
        }
        {{ data.confirmLabel }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    p {
      margin: 0 0 8px;
      overflow-wrap: anywhere;
    }

    app-form-alert {
      margin-bottom: 12px;
    }

    .warning {
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject<MatDialogRef<ConfirmDialogComponent, boolean>>(MatDialogRef);

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
