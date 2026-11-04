import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MSG_CONNECTION } from '../../../core/http/error-messages';
import { text } from '../../../../testing/dom';
import { AreaStatus } from './area-status';

@Component({
  imports: [AreaStatus],
  template: `<ws-area-status
    [status]="status()"
    [message]="message"
    [onHero]="onHero()"
    (retry)="retries = retries + 1"
  />`,
})
class Host {
  readonly status = signal<'loading' | 'error'>('loading');
  readonly onHero = signal(false);
  readonly message = MSG_CONNECTION;
  retries = 0;
}

async function render(status: 'loading' | 'error', onHero = false) {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.status.set(status);
  fixture.componentInstance.onHero.set(onHero);
  await fixture.whenStable();
  return { fixture, root: fixture.nativeElement as HTMLElement };
}

describe('AreaStatus (estado de área)', () => {
  it('área carregando', async () => {
    const { root } = await render('loading');
    const area = root.querySelector('.ws-empty')!;
    expect(area.getAttribute('role')).toBe('status');
    expect(area.querySelector('.spinner-border')!.getAttribute('aria-hidden')).toBe('true');
    expect(text(area.querySelector('.visually-hidden'))).toBe('Carregando…');
  });

  it('área erro', async () => {
    const { fixture, root } = await render('error');
    const area = root.querySelector('.ws-empty')!;
    expect(area.getAttribute('role')).toBe('alert');
    expect(area.querySelector('.ws-kpi-icon ws-icon')).not.toBeNull();
    expect(text(area.querySelector('.fw-bold'))).toBe(MSG_CONNECTION);
    const button = area.querySelector<HTMLButtonElement>('button')!;
    expect(text(button)).toBe('Tentar novamente');
    expect(button.classList).toContain('btn-ghost');
    button.click();
    expect(fixture.componentInstance.retries).toBe(1);
  });

  it('no cartão azul: sem .ws-empty e botão branco', async () => {
    const loading = await render('loading', true);
    expect(loading.root.querySelector('.ws-empty')).toBeNull();
    expect(loading.root.querySelector('.py-3[role="status"] .spinner-border')).not.toBeNull();
    loading.fixture.componentInstance.status.set('error');
    await loading.fixture.whenStable();
    const area = loading.root.querySelector('.py-2[role="alert"]')!;
    expect(text(area.querySelector('p'))).toBe(MSG_CONNECTION);
    const button = area.querySelector('button')!;
    expect(button.className).toBe('btn');
    button.click();
    expect(loading.fixture.componentInstance.retries).toBe(1);
  });
});
