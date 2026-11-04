import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { text } from '../../../../testing/dom';
import { ICON_PATHS } from '../icon/icons';
import { LABEL_CLOSE_TOAST } from '../ui.messages';
import { TOAST_DURATION_MS, ToastHost, ToastService } from './toast';

@Component({
  imports: [ToastHost],
  template: `@if (shown()) {
    <ws-toast-host />
  }`,
})
class Host {
  readonly shown = signal(true);
}

async function render() {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const service = TestBed.inject(ToastService);
  const root = fixture.nativeElement as HTMLElement;
  return { fixture, service, root, toast: () => root.querySelector('.ws-toast') };
}

describe('Toast (aviso)', () => {
  afterEach(() => vi.useRealTimers());

  it('toast mostra e some', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { fixture, service, toast } = await render();
    service.show('Compra salva com sucesso');
    await fixture.whenStable();
    expect(text(toast()!.querySelector('span'))).toBe('Compra salva com sucesso');
    expect(toast()!.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS.check);
    vi.advanceTimersByTime(TOAST_DURATION_MS - 1);
    expect(service.current()).not.toBeNull();
    vi.advanceTimersByTime(1);
    await fixture.whenStable();
    expect(toast()).toBeNull();
  });

  it('um por vez, e o tempo recomeça', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { fixture, service, root } = await render();
    service.show('A');
    vi.advanceTimersByTime(4000);
    service.show('B');
    await fixture.whenStable();
    expect(root.querySelectorAll('.ws-toast')).toHaveLength(1);
    expect(text(root.querySelector('.ws-toast span'))).toBe('B');
    vi.advanceTimersByTime(4000);
    expect(service.current()?.text).toBe('B');
    vi.advanceTimersByTime(1000);
    expect(service.current()).toBeNull();
  });

  it('toast de aviso', async () => {
    const { fixture, service, toast } = await render();
    service.show('Compra não encontrada', 'warning');
    await fixture.whenStable();
    expect(toast()!.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS.alert);
  });

  it('fechar', async () => {
    const { fixture, service, toast } = await render();
    service.show('Compra excluída');
    await fixture.whenStable();
    toast()!.querySelector<HTMLButtonElement>(`button[aria-label="${LABEL_CLOSE_TOAST}"]`)!.click();
    await fixture.whenStable();
    expect(toast()).toBeNull();
  });

  it('região viva sempre presente', async () => {
    const { root } = await render();
    const region = root.querySelector('[role="status"]')!;
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(text(region)).toBe('');
  });

  it('host destruído limpa o aviso', async () => {
    const { fixture, service } = await render();
    service.show('Compra salva com sucesso');
    fixture.componentInstance.shown.set(false);
    await fixture.whenStable();
    expect(service.current()).toBeNull();
  });
});
