import { InteractivityChecker } from '@angular/cdk/a11y';
import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { Observable, Subject } from 'rxjs';

import { RefreshError } from '../../core/auth/refresh-error';
import { MSG_CONNECTION, MSG_SERVER } from '../../core/http/error-messages';
import { openConfirm } from './confirm-dialog';
import { ConfirmDialogData } from './confirm-dialog.component';

const BASE: ConfirmDialogData = {
  title: 'Excluir lançamento?',
  lines: ['Mercado', '05/10/2026', 'R$ 1.234,56'],
  warning: 'Esta ação não pode ser desfeita.',
  cancelLabel: 'Cancelar',
  confirmLabel: 'Excluir',
};

describe('ConfirmDialogComponent', () => {
  let dialog: Dialog;

  beforeEach(() => {
    // O jsdom não tem layout: sem isto, nenhum botão é "visível" e o foco inicial fica no contêiner.
    vi.spyOn(TestBed.inject(InteractivityChecker), 'isVisible').mockReturnValue(true);
    dialog = TestBed.inject(Dialog);
  });

  afterEach(() => {
    dialog.closeAll();
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => el.remove());
  });

  const settle = () => TestBed.inject(ApplicationRef).whenStable();
  const container = () => document.querySelector('cdk-dialog-container') as HTMLElement | null;
  const buttons = () =>
    Array.from(container()?.querySelectorAll<HTMLButtonElement>('.modal-footer button') ?? []);
  const cancelButton = () => buttons()[0];
  const confirmButton = () => buttons()[1];

  async function open(data: Partial<ConfirmDialogData> = {}) {
    const result = vi.fn();
    openConfirm(dialog, { ...BASE, ...data }).subscribe(result);
    await settle();
    return result;
  }

  function escape() {
    // O overlay confere o `keyCode` (27), que o construtor do KeyboardEvent não preenche.
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    Object.defineProperty(event, 'keyCode', { get: () => 27 });
    container()!.dispatchEvent(event);
  }

  it('mostra título, linhas e aviso', async () => {
    await open();
    expect(container()!.getAttribute('role')).toBe('alertdialog');
    expect(container()!.querySelector('h2')?.textContent?.trim()).toBe('Excluir lançamento?');
    const texts = Array.from(container()!.querySelectorAll('p')).map((p) => p.textContent?.trim());
    expect(texts).toEqual([
      'Mercado',
      '05/10/2026',
      'R$ 1.234,56',
      'Esta ação não pode ser desfeita.',
    ]);
    expect(buttons().map((b) => b.textContent?.trim())).toEqual(['Cancelar', 'Excluir']);
  });

  it('foco no cancelar', async () => {
    await open();
    await settle();
    expect(document.activeElement).toBe(cancelButton());
  });

  it('cancelar devolve false', async () => {
    const result = await open();
    cancelButton().click();
    await settle();
    expect(result).toHaveBeenCalledWith(false);
  });

  it('Esc devolve false', async () => {
    const result = await open();
    escape();
    await settle();
    expect(result).toHaveBeenCalledWith(false);
  });

  it('confirmar sem ação', async () => {
    const result = await open();
    confirmButton().click();
    await settle();
    expect(result).toHaveBeenCalledWith(true);
  });

  async function openWithAction() {
    let subject = new Subject<void>();
    const action = vi.fn((): Observable<unknown> => {
      subject = new Subject<void>();
      return subject;
    });
    const result = await open({ action });
    return { result, action, subject: () => subject };
  }

  it('ação em andamento', async () => {
    const { result, action } = await openWithAction();
    confirmButton().click();
    await settle();
    expect(cancelButton().disabled).toBe(true);
    expect(confirmButton().disabled).toBe(true);
    expect(container()!.querySelector('.spinner-border')).not.toBeNull();
    escape();
    await settle();
    expect(container()).not.toBeNull();
    expect(result).not.toHaveBeenCalled();
    confirmButton().click();
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('ação termina', async () => {
    const { result, subject } = await openWithAction();
    confirmButton().click();
    await settle();
    subject().complete();
    await settle();
    expect(result).toHaveBeenCalledWith(true);
  });

  it('ação falha', async () => {
    const { result, action, subject } = await openWithAction();
    confirmButton().click();
    await settle();
    subject().error(new HttpErrorResponse({ status: 500 }));
    await settle();
    expect(result).not.toHaveBeenCalled();
    expect(container()!.querySelector('app-form-alert')?.textContent?.trim()).toBe(MSG_SERVER);
    expect(cancelButton().disabled).toBe(false);
    expect(confirmButton().disabled).toBe(false);
    confirmButton().click();
    expect(action).toHaveBeenCalledTimes(2);
  });

  it('ação sem rede', async () => {
    const { subject } = await openWithAction();
    confirmButton().click();
    await settle();
    subject().error(new HttpErrorResponse({ status: 0 }));
    await settle();
    expect(container()!.querySelector('app-form-alert')?.textContent?.trim()).toBe(MSG_CONNECTION);
  });

  it('sessão acabou', async () => {
    const { result, subject } = await openWithAction();
    confirmButton().click();
    await settle();
    subject().error(new RefreshError('expired'));
    await settle();
    expect(result).toHaveBeenCalledWith(false);
    expect(document.querySelector('app-form-alert')).toBeNull();
  });
});
