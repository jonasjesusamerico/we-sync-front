import { MatSnackBar } from '@angular/material/snack-bar';

export const NOTICE_DURATION_MS = 5_000;

/** ADR-10: aviso que sobrevive à navegação (`MatSnackBar` é root). Um aviso novo substitui o anterior. */
export function notify(snackBar: MatSnackBar, message: string): void {
  snackBar.open(message, undefined, { duration: NOTICE_DURATION_MS, politeness: 'polite' });
}
