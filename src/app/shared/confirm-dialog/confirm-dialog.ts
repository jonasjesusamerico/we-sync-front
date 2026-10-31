import { MatDialog } from '@angular/material/dialog';
import { map, Observable } from 'rxjs';

import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

/** Abre o diálogo e devolve `true` só quando confirmado (e, com ação, só quando a ação terminou bem). */
export function openConfirm(dialog: MatDialog, data: ConfirmDialogData): Observable<boolean> {
  return dialog
    .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
      data,
      role: 'alertdialog',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      width: '400px',
      maxWidth: 'calc(100vw - 32px)',
    })
    .afterClosed()
    .pipe(map((result) => result === true));
}
