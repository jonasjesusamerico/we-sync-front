import { Dialog } from '@angular/cdk/dialog';
import { map, Observable } from 'rxjs';

import {
  CONFIRM_DIALOG_TITLE_ID,
  ConfirmDialogComponent,
  ConfirmDialogData,
} from './confirm-dialog.component';

/** Abre o diálogo e devolve `true` só quando confirmado (e, com ação, só quando a ação terminou bem). */
export function openConfirm(dialog: Dialog, data: ConfirmDialogData): Observable<boolean> {
  return dialog
    .open<boolean, ConfirmDialogData, ConfirmDialogComponent>(ConfirmDialogComponent, {
      data,
      role: 'alertdialog',
      ariaLabelledBy: CONFIRM_DIALOG_TITLE_ID,
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      width: '400px',
      maxWidth: 'calc(100vw - 32px)',
      panelClass: 'app-modal-pane',
      backdropClass: 'cdk-overlay-dark-backdrop',
    })
    .closed.pipe(map((result) => result === true));
}
