import { TestBed } from '@angular/core/testing';

import { NOTICE_DURATION_MS, Notifier } from './notifier';
import { ToastHostComponent } from './toast-host.component';

describe('Notifier', () => {
  afterEach(() => vi.useRealTimers());

  it('mostra e some em 5 s', () => {
    vi.useFakeTimers();
    const notifier = TestBed.inject(Notifier);
    notifier.show('Lançamento salvo.');
    expect(notifier.notice()?.text).toBe('Lançamento salvo.');
    vi.advanceTimersByTime(NOTICE_DURATION_MS - 1);
    expect(notifier.notice()).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(notifier.notice()).toBeNull();
    expect(NOTICE_DURATION_MS).toBe(5000);
  });

  it('aviso novo substitui o anterior e reinicia o tempo', () => {
    vi.useFakeTimers();
    const notifier = TestBed.inject(Notifier);
    notifier.show('Primeiro');
    vi.advanceTimersByTime(4_000);
    notifier.show('Segundo');
    vi.advanceTimersByTime(4_000);
    expect(notifier.notice()?.text).toBe('Segundo');
  });

  it('toast na região polite e botão de fechar', async () => {
    const fixture = TestBed.createComponent(ToastHostComponent);
    const el = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
    const region = el.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(region.getAttribute('role')).toBeNull();
    expect(region.textContent?.trim()).toBe('');

    TestBed.inject(Notifier).show('Lançamento excluído.');
    await fixture.whenStable();
    expect(el.querySelector('.toast-body')?.textContent).toBe('Lançamento excluído.');

    (el.querySelector('.btn-close') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(el.querySelector('.toast')).toBeNull();
  });
});
