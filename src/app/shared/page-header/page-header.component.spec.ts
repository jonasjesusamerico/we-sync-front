import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ChangeDetectionStrategy, Component, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { PageHeaderComponent } from './page-header.component';

@Component({
  imports: [PageHeaderComponent],
  template: `<app-page-header title="Início" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostComponent {}

describe('PageHeaderComponent', () => {
  beforeAll(() => registerLocaleData(localePt));

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }] });
  });

  afterEach(() => vi.useRealTimers());

  async function render() {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('título do cabeçalho', async () => {
    const { el } = await render();
    expect(el.querySelector('mat-card h1')?.textContent).toBe('Início');
  });

  it('data de hoje', async () => {
    // Só o Date é falso: o agendamento do Angular continua com timers reais.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 21, 10, 0));
    const { el } = await render();
    const time = el.querySelector('time');
    expect(time?.textContent).toBe('21/10/2026, quarta-feira');
    expect(time?.getAttribute('datetime')).toBe('2026-10-21');
    const icon = el.querySelector('.date mat-icon');
    expect(icon?.textContent?.trim()).toBe('calendar_today');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('data não muda sozinha', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 21, 23, 59, 50));
    const { fixture, el } = await render();
    vi.setSystemTime(new Date(2026, 9, 22, 0, 0, 10));
    await fixture.whenStable();
    expect(el.querySelector('time')?.textContent).toBe('21/10/2026, quarta-feira');
  });
});
