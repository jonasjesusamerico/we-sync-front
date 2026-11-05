import { ApplicationRef, Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, throwError } from 'rxjs';
import { MSG_SERVER } from '../../../core/http/error-messages';
import { installDialogStub } from '../../../../testing/dialog';
import { text } from '../../../../testing/dom';
import { ConfirmHost, ConfirmRequest, ConfirmService } from './confirm';

@Component({
  imports: [ConfirmHost],
  template: `<button type="button" id="origin">Lixeira</button>
    @if (shown()) {
      <ws-confirm-host />
    }`,
})
class Host {
  readonly shown = signal(true);
}

const REQUEST: ConfirmRequest = {
  title: 'Excluir compra?',
  lines: ['Uber', '30/09/2026 · R$ 23,90', 'Esta ação não pode ser desfeita.'],
  icon: 'trash',
  confirmLabel: 'Excluir',
  cancelLabel: 'Cancelar',
};

describe('Confirm (confirmação)', () => {
  let stub: ReturnType<typeof installDialogStub>;

  beforeEach(() => (stub = installDialogStub()));
  afterEach(() => stub.restore());

  async function render() {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    document.body.append(fixture.nativeElement);
    await fixture.whenStable();
    const service = TestBed.inject(ConfirmService);
    const root = fixture.nativeElement as HTMLElement;
    const dialog = root.querySelector('dialog')!;
    const buttons = () => Array.from(dialog.querySelectorAll<HTMLButtonElement>('.d-grid button'));
    const stable = async () => {
      TestBed.inject(ApplicationRef).tick();
      await fixture.whenStable();
    };
    return { fixture, service, root, dialog, buttons, stable };
  }

  it('confirm sem action', async () => {
    const { service, dialog, buttons, stable } = await render();
    const answer = service.ask(REQUEST);
    await stable();
    expect(stub.showModal).toHaveBeenCalledTimes(1);
    expect(dialog.classList).toContain('ws-dialog');
    expect(text(dialog.querySelector('#ws-confirm-title'))).toBe('Excluir compra?');
    expect(dialog.querySelectorAll('#ws-confirm-text p')).toHaveLength(3);
    expect(dialog.querySelector('.ws-kpi-icon.is-danger')).not.toBeNull();
    const [confirm, cancel] = buttons();
    expect(confirm.classList).toContain('btn-danger');
    expect(text(confirm)).toBe('Excluir');
    expect(cancel.classList).toContain('btn-ghost');
    confirm.click();
    expect(await answer).toBe(true);
    await stable();
    expect(stub.close).toHaveBeenCalledTimes(1);
    expect(dialog.hasAttribute('open')).toBe(false);
  });

  it('confirm cancelar e Esc', async () => {
    const { service, dialog, buttons, stable } = await render();
    const first = service.ask(REQUEST);
    await stable();
    buttons()[1].click();
    expect(await first).toBe(false);
    await stable();
    const second = service.ask(REQUEST);
    await stable();
    const esc = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(esc);
    expect(esc.defaultPrevented).toBe(true);
    expect(await second).toBe(false);
  });

  it('um pedido por vez', async () => {
    const { service } = await render();
    const first = service.ask(REQUEST);
    expect(await service.ask(REQUEST)).toBe(false);
    service.cancel();
    expect(await first).toBe(false);
  });

  it('foco no cancelar e volta à origem', async () => {
    const { service, root, buttons, stable } = await render();
    const origin = root.querySelector<HTMLButtonElement>('#origin')!;
    origin.focus();
    const answer = service.ask(REQUEST);
    await stable();
    expect(document.activeElement).toBe(buttons()[1]);
    buttons()[1].click();
    await answer;
    await stable();
    expect(document.activeElement).toBe(origin);
  });

  it('action ok: uma assinatura, botões travados', async () => {
    const { service, dialog, buttons, stable } = await render();
    const result = new Subject<void>();
    const action = vi.fn(() => result);
    const answer = service.ask({ ...REQUEST, action });
    await stable();
    buttons()[0].click();
    buttons()[0].click();
    await stable();
    expect(action).toHaveBeenCalledTimes(1);
    const [confirm, cancel] = buttons();
    expect(confirm.disabled).toBe(true);
    expect(cancel.disabled).toBe(true);
    expect(confirm.getAttribute('aria-busy')).toBe('true');
    expect(confirm.querySelector('.spinner-border')).not.toBeNull();
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(service.active()).not.toBeNull();
    result.complete();
    expect(await answer).toBe(true);
  });

  it('action erro: mensagem dentro do modal', async () => {
    const { service, dialog, buttons, stable } = await render();
    const answer = vi.fn();
    void service
      .ask({
        ...REQUEST,
        action: () => throwError(() => new Error('x')),
        errorMessage: () => MSG_SERVER,
      })
      .then(answer);
    await stable();
    buttons()[0].click();
    await stable();
    expect(text(dialog.querySelector('[role="alert"]'))).toBe(MSG_SERVER);
    expect(buttons()[0].disabled).toBe(false);
    expect(buttons()[1].disabled).toBe(false);
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(answer).not.toHaveBeenCalled();
  });

  it('host destruído responde false', async () => {
    const { fixture, service } = await render();
    const answer = service.ask(REQUEST);
    fixture.componentInstance.shown.set(false);
    await fixture.whenStable();
    expect(await answer).toBe(false);
    expect(service.active()).toBeNull();
  });
});
