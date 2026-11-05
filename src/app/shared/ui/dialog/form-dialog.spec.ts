import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { installDialogStub } from '../../../../testing/dialog';
import { FormDialog } from './form-dialog';

@Component({
  imports: [FormDialog],
  template: `
    <button id="origin" type="button">Abrir</button>
    @if (open()) {
      <ws-form-dialog
        [size]="size()"
        labelledBy="t"
        [busy]="busy()"
        (dismiss)="dismissed = dismissed + 1"
      >
        <h2 id="t">Título</h2>
        <!-- eslint-disable-next-line @angular-eslint/template/no-autofocus -- initial focus of a modal dialog (MDN) -->
        <input id="field" autofocus />
      </ws-form-dialog>
    }
  `,
})
class Host {
  readonly open = signal(true);
  readonly size = signal<'default' | 'sm'>('default');
  readonly busy = signal(false);
  dismissed = 0;
}

describe('FormDialog', () => {
  let stub: ReturnType<typeof installDialogStub>;

  beforeEach(() => {
    stub = installDialogStub();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  afterEach(() => {
    // Destroys the open dialogs while the stub is still installed.
    TestBed.resetTestingModule();
    stub.restore();
  });

  async function render(configure?: (host: Host) => void) {
    const fixture = TestBed.createComponent(Host);
    configure?.(fixture.componentInstance);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      dialog: () => root.querySelector('dialog'),
    };
  }

  function cancelEvent() {
    return new Event('cancel', { cancelable: true });
  }

  it('abre ao nascer', async () => {
    const { dialog } = await render();
    expect(stub.showModal).toHaveBeenCalledTimes(1);
    expect(dialog()!.open).toBe(true);
    expect(dialog()!.getAttribute('aria-labelledby')).toBe('t');
    expect(dialog()!.querySelector('#field')!.hasAttribute('autofocus')).toBe(true);
  });

  it('tamanhos', async () => {
    const big = await render();
    expect(big.dialog()!.classList).toContain('ws-dialog');
    expect(big.dialog()!.classList).toContain('is-default');
    big.fixture.destroy();

    const small = await render((host) => host.size.set('sm'));
    expect(small.dialog()!.classList).toContain('ws-dialog');
    expect(small.dialog()!.classList).not.toContain('is-default');
  });

  it('Esc', async () => {
    const { host, dialog } = await render();
    const event = cancelEvent();
    dialog()!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(host.dismissed).toBe(1);
  });

  it('Esc ocupado', async () => {
    const { host, dialog } = await render((h) => h.busy.set(true));
    const event = cancelEvent();
    dialog()!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(host.dismissed).toBe(0);
  });

  it('fecha e devolve o foco', async () => {
    const { fixture, host, root } = await render((h) => h.open.set(false));
    const origin = root.querySelector<HTMLButtonElement>('#origin')!;
    origin.focus();
    host.open.set(true);
    await fixture.whenStable();
    expect(stub.showModal).toHaveBeenCalledTimes(1);
    root.querySelector<HTMLInputElement>('#field')!.focus();

    host.open.set(false);
    await fixture.whenStable();
    expect(stub.close).toHaveBeenCalledTimes(1);
    expect(root.querySelector('dialog')).toBeNull();
    expect(document.activeElement).toBe(origin);
  });
});
