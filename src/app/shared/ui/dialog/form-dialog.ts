import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  DOCUMENT,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

/**
 * Modal frame of a form (#edit-modal and #delete-modal of configuracoes.html, ADR-15 of feature 006) on a native
 * <dialog>. Open while it exists: the page renders it inside an @if and removes it to close. The form, the buttons
 * and `busy` belong to the page. On open, the browser focuses the projected element with `autofocus`; on close, the
 * focus goes back to where it was.
 */
@Component({
  selector: 'ws-form-dialog',
  template: `<dialog
    #dialog
    class="ws-dialog"
    [class.is-default]="size() === 'default'"
    [attr.aria-labelledby]="labelledBy()"
    (cancel)="onCancel($event)"
  >
    <ng-content />
  </dialog>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormDialog {
  readonly size = input<'default' | 'sm'>('default');
  /** id of the heading inside the projected content. */
  readonly labelledBy = input.required<string>();
  /** RN-21: while true, Esc does nothing (the page also disables × and Cancelar). */
  readonly busy = input(false);
  /** Esc pressed while not busy: the page decides to close (removes the component). */
  readonly dismiss = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    const active = inject(DOCUMENT).activeElement;
    const origin = active instanceof HTMLElement ? active : null;
    afterNextRender(() => {
      const dialog = this.dialog().nativeElement;
      if (!dialog.open) {
        dialog.showModal();
      }
    });
    inject(DestroyRef).onDestroy(() => {
      const dialog = this.dialog().nativeElement;
      if (dialog.open) {
        dialog.close();
      }
      if (origin?.isConnected) {
        origin.focus();
      }
    });
  }

  /** Esc: the browser never closes the dialog by itself. */
  protected onCancel(event: Event): void {
    event.preventDefault();
    if (!this.busy()) {
      this.dismiss.emit();
    }
  }
}
