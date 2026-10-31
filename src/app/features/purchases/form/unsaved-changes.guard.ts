import { Dialog } from '@angular/cdk/dialog';
import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';

import { SessionStore } from '../../../core/auth/session.store';
import { openConfirm } from '../../../shared/confirm-dialog/confirm-dialog';
import { ConfirmDialogData } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { DISCARD_DIALOG_TITLE, LABEL_DISCARD, LABEL_KEEP_EDITING } from '../purchase.messages';

/** Tela que sabe dizer se há alteração não salva (RN-09 a RN-11). */
export interface UnsavedChangesAware {
  hasUnsavedChanges(): boolean;
}

export const DISCARD_DIALOG: ConfirmDialogData = {
  title: DISCARD_DIALOG_TITLE,
  cancelLabel: LABEL_KEEP_EDITING,
  confirmLabel: LABEL_DISCARD,
};

/**
 * RN-09: sair com alteração pergunta antes. Sem sessão, libera (RN-12: todo fim de sessão da 001 limpa o storage
 * antes de navegar, inclusive o logout em outra aba, porque `hasSession()` relê o `localStorage`).
 */
export const unsavedChangesGuard: CanDeactivateFn<UnsavedChangesAware> = (component) => {
  if (!inject(SessionStore).hasSession()) {
    return true;
  }
  if (!component.hasUnsavedChanges()) {
    return true;
  }
  // "Descartar" = true; "Continuar editando", Esc ou fundo = false.
  return openConfirm(inject(Dialog), DISCARD_DIALOG);
};
