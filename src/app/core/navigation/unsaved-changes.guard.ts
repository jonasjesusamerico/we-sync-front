import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { SessionStore } from '../auth/session-store';
import { ConfirmService } from '../../shared/ui/confirm/confirm';
import { DISCARD_CONFIRM, DISCARD_KEEP, DISCARD_TITLE } from './navigation.messages';

/** A page with a form that warns before leaving (RN-17). False while it is leaving on purpose. */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/** "Descartar alterações?" (ADR-12). Without a session (logout, expired) it lets the page go (RN-19). */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (inject(SessionStore).read() === null) {
    return true;
  }
  if (!component.hasUnsavedChanges()) {
    return true;
  }
  return inject(ConfirmService).ask({
    title: DISCARD_TITLE,
    icon: 'alert',
    confirmLabel: DISCARD_CONFIRM,
    cancelLabel: DISCARD_KEEP,
  });
};
