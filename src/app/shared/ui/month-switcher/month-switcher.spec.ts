import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { YearMonth } from '../../date/plain-date';
import { text } from '../../../../testing/dom';
import {
  LABEL_CURRENT_MONTH,
  LABEL_MONTH,
  LABEL_NEXT_MONTH,
  LABEL_PREVIOUS_MONTH,
} from '../ui.messages';
import { MonthSwitcher } from './month-switcher';

@Component({
  imports: [MonthSwitcher],
  template: `<ws-month-switcher
    [month]="month()"
    [current]="current"
    (monthChange)="emitted.push($event)"
  />`,
})
class Host {
  readonly month = signal<YearMonth>({ year: 2026, month: 11 });
  readonly current: YearMonth = { year: 2026, month: 11 };
  readonly emitted: YearMonth[] = [];
}

async function render(month: YearMonth) {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.month.set(month);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const button = (label: string) =>
    root.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
  const current = () =>
    Array.from(root.querySelectorAll('button')).find((b) => text(b) === LABEL_CURRENT_MONTH);
  return { fixture, root, button, current, emitted: fixture.componentInstance.emitted };
}

describe('MonthSwitcher (seletor de mês)', () => {
  it('seletor no mês atual', async () => {
    const { root, button, current } = await render({ year: 2026, month: 11 });
    expect(root.querySelector('.ws-month')!.getAttribute('role')).toBe('group');
    expect(root.querySelector('.ws-month')!.getAttribute('aria-label')).toBe(LABEL_MONTH);
    expect(text(root.querySelector('.ws-month-label'))).toBe('novembro 2026');
    expect(root.querySelector('.ws-month-label')!.getAttribute('aria-live')).toBe('polite');
    expect(button(LABEL_PREVIOUS_MONTH)).not.toBeNull();
    expect(button(LABEL_NEXT_MONTH)).not.toBeNull();
    expect(current()).toBeUndefined();
  });

  it('seletor fora do mês', async () => {
    const { current, emitted } = await render({ year: 2026, month: 9 });
    expect(current()!.classList).toContain('btn-soft');
    current()!.click();
    expect(emitted).toEqual([{ year: 2026, month: 11 }]);
  });

  it('setas', async () => {
    const { button, emitted } = await render({ year: 2026, month: 1 });
    button(LABEL_PREVIOUS_MONTH)!.click();
    button(LABEL_NEXT_MONTH)!.click();
    expect(emitted).toEqual([
      { year: 2025, month: 12 },
      { year: 2026, month: 2 },
    ]);
  });

  it('limites', async () => {
    const first = await render({ year: 1, month: 1 });
    first.button(LABEL_PREVIOUS_MONTH)!.click();
    expect(first.emitted).toEqual([]);
    first.fixture.componentInstance.month.set({ year: 9999, month: 12 });
    await first.fixture.whenStable();
    first.button(LABEL_NEXT_MONTH)!.click();
    expect(first.emitted).toEqual([]);
    expect(first.button(LABEL_NEXT_MONTH)!.disabled).toBe(false);
  });
});
