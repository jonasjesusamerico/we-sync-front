import { HttpTestingController } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ERROR_INTERNAL, ERROR_INVALID_PASSWORD } from '../../../../testing/api-examples';
import { installDialogStub } from '../../../../testing/dialog';
import { text, typeInto } from '../../../../testing/dom';
import { API, httpTestingProviders } from '../../../../testing/http';
import { settle } from '../../../../testing/session';
import { SessionEnd } from '../../../core/auth/session-end';
import * as t from '../settings.messages';
import { DeleteAccountDialog } from './delete-account-dialog';

const ME = `${API}/users/me`;

@Component({
  imports: [DeleteAccountDialog],
  template: `
    @if (open()) {
      <ws-delete-account-dialog (closed)="closed = closed + 1; open.set(false)" />
    }
  `,
})
class Host {
  readonly open = signal(true);
  closed = 0;
}

describe('DeleteAccountDialog', () => {
  let http: HttpTestingController;
  let stub: ReturnType<typeof installDialogStub>;
  let accountDeleted: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    stub = installDialogStub();
    accountDeleted = vi.fn();
    TestBed.configureTestingModule({
      providers: [...httpTestingProviders(), { provide: SessionEnd, useValue: { accountDeleted } }],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    stub.restore();
    http.verify();
  });

  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      dialog: () => root.querySelector('dialog'),
      password: () => root.querySelector<HTMLInputElement>('#delete-pass')!,
      submit: () => root.querySelector<HTMLButtonElement>('button[type=submit]')!,
      cancel: () => root.querySelector<HTMLButtonElement>('button.btn-ghost')!,
      error: () => text(root.querySelector('#delete-pass-error')),
      alert: () => root.querySelector('.alert'),
      stable: async () => {
        await settle();
        await fixture.whenStable();
      },
    };
  }

  it('estrutura', async () => {
    const view = await render();
    expect(stub.showModal).toHaveBeenCalledTimes(1);
    expect(view.dialog()!.classList).not.toContain('is-default');
    expect(text(view.root.querySelector('#delete-title'))).toBe(t.DELETE_DIALOG_TITLE);
    expect(text(view.root.querySelector('p.text-muted'))).toBe(t.DELETE_DIALOG_TEXT);
    expect(text(view.root.querySelector('label[for=delete-pass]'))).toBe(t.LABEL_YOUR_PASSWORD);
    expect(view.password().getAttribute('autocomplete')).toBe('current-password');
    expect(view.password().hasAttribute('autofocus')).toBe(true);
    expect(text(view.submit())).toBe(t.DELETE_CONFIRM);
    expect(text(view.cancel())).toBe(t.CANCEL);
  });

  it('excluir vazio', async () => {
    const view = await render();
    view.submit().click();
    await view.stable();
    expect(view.error()).toBe(t.ERR_PASSWORD_REQUIRED);
    expect(view.password().getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(view.password());
    http.expectNone(ME);
  });

  it('excluir certo', async () => {
    const view = await render();
    typeInto(view.password(), 'Nova-senha-2026');
    view.submit().click();
    const req = http.expectOne(ME);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual({ password: 'Nova-senha-2026' });
    req.flush(null, { status: 204, statusText: 'No Content' });
    await view.stable();
    expect(accountDeleted).toHaveBeenCalledTimes(1);
  });

  it('excluir errado', async () => {
    const view = await render();
    typeInto(view.password(), 'errada-1');
    view.submit().click();
    http.expectOne(ME).flush(ERROR_INVALID_PASSWORD, { status: 403, statusText: 'Forbidden' });
    await view.stable();
    expect(view.error()).toBe(t.ERR_PASSWORD_WRONG);
    expect(view.password().value).toBe('');
    expect(document.activeElement).toBe(view.password());
    expect(view.dialog()!.open).toBe(true);
    expect(view.host.closed).toBe(0);
    expect(accountDeleted).not.toHaveBeenCalled();

    typeInto(view.password(), 'x');
    await view.stable();
    expect(view.root.querySelector('#delete-pass-error')).toBeNull();
  });

  it('excluir cancelar', async () => {
    const view = await render();
    typeInto(view.password(), 'segredo-1');
    view.cancel().click();
    await view.stable();
    expect(view.host.closed).toBe(1);
    expect(view.dialog()).toBeNull();

    view.host.open.set(true);
    await view.stable();
    const event = new Event('cancel', { cancelable: true });
    view.dialog()!.dispatchEvent(event);
    await view.stable();
    expect(event.defaultPrevented).toBe(true);
    expect(view.host.closed).toBe(2);
    http.expectNone(ME);
  });

  it('excluir erro', async () => {
    const view = await render();
    typeInto(view.password(), 'segredo-1');
    view.submit().click();
    http.expectOne(ME).flush(ERROR_INTERNAL, { status: 500, statusText: 'Error' });
    await view.stable();
    expect(text(view.alert())).toBe(t.MSG_SERVER);
    expect(view.alert()!.getAttribute('role')).toBe('alert');
    expect(view.password().value).toBe('segredo-1');
    expect(view.dialog()!.open).toBe(true);
    expect(accountDeleted).not.toHaveBeenCalled();
  });

  it('envio único e Esc ocupado', async () => {
    const view = await render();
    typeInto(view.password(), 'segredo-1');
    view.submit().click();
    await view.stable();
    view.root.querySelector('form')!.dispatchEvent(new Event('submit'));
    expect(view.submit().disabled).toBe(true);
    expect(view.submit().getAttribute('aria-busy')).toBe('true');
    expect(view.cancel().disabled).toBe(true);
    const event = new Event('cancel', { cancelable: true });
    view.dialog()!.dispatchEvent(event);
    expect(view.host.closed).toBe(0);
    http.expectOne(ME).flush(null, { status: 204, statusText: 'No Content' });
    await view.stable();
    expect(accountDeleted).toHaveBeenCalledTimes(1);
  });
});
