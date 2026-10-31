import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ApplicationRef, LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  CALENDAR_LABELS,
  LABEL_CURRENT_MONTH,
  LABEL_NEXT_MONTH,
  LABEL_PREVIOUS_MONTH,
} from '../purchase.messages';
import { MonthBarComponent, YearMonth } from './month-bar.component';

registerLocaleData(localePt);

describe('MonthBarComponent', () => {
  let fixture: ComponentFixture<MonthBarComponent>;
  let emitted: YearMonth[];

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 22, 12, 0));
    TestBed.configureTestingModule({
      providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => el.remove());
  });

  async function render(year: number, month: number, isCurrent: boolean) {
    fixture = TestBed.createComponent(MonthBarComponent);
    fixture.componentRef.setInput('year', year);
    fixture.componentRef.setInput('month', month);
    fixture.componentRef.setInput('isCurrent', isCurrent);
    emitted = [];
    fixture.componentInstance.monthChange.subscribe((m) => emitted.push(m));
    await fixture.whenStable();
  }

  const host = () => fixture.nativeElement as HTMLElement;
  const button = (name: string) =>
    host().querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`);
  const monthButton = () => host().querySelector<HTMLButtonElement>('button.label')!;
  const buttonByText = (text: string) =>
    Array.from(host().querySelectorAll('button')).find((b) => b.textContent?.trim() === text);
  const settle = () => TestBed.inject(ApplicationRef).whenStable();
  const calendar = () => document.querySelector('app-calendar-panel');
  /** Botão do calendário pelo nome acessível (`aria-label` ou texto). */
  const cell = (name: string) =>
    Array.from(document.querySelectorAll<HTMLButtonElement>('app-calendar-panel button')).find(
      (b) => (b.getAttribute('aria-label') ?? b.textContent?.trim()) === name,
    );

  it('mostra o mês', async () => {
    await render(2026, 10, true);
    expect(monthButton().textContent?.trim()).toBe('outubro de 2026');
    expect(monthButton().getAttribute('aria-label')).toBe('Escolher mês: outubro de 2026');
    expect(buttonByText(LABEL_CURRENT_MONTH)).toBeUndefined();
  });

  it('setas', async () => {
    await render(2026, 10, true);
    button(LABEL_PREVIOUS_MONTH)!.click();
    button(LABEL_NEXT_MONTH)!.click();
    expect(emitted).toEqual([
      { year: 2026, month: 9 },
      { year: 2026, month: 11 },
    ]);
  });

  it('virada de ano', async () => {
    await render(2026, 1, false);
    button(LABEL_PREVIOUS_MONTH)!.click();
    expect(emitted).toEqual([{ year: 2025, month: 12 }]);
  });

  it('limites', async () => {
    await render(1, 1, false);
    expect(button(LABEL_PREVIOUS_MONTH)!.disabled).toBe(true);
    expect(button(LABEL_NEXT_MONTH)!.disabled).toBe(false);
    await render(9999, 12, false);
    expect(button(LABEL_NEXT_MONTH)!.disabled).toBe(true);
    expect(button(LABEL_PREVIOUS_MONTH)!.disabled).toBe(false);
  });

  it('Mês atual', async () => {
    await render(2026, 9, false);
    const current = buttonByText(LABEL_CURRENT_MONTH);
    expect(current).toBeDefined();
    current!.click();
    expect(emitted).toEqual([{ year: 2026, month: 10 }]);
  });

  it('seletor de mês', async () => {
    await render(2026, 10, true);
    monthButton().click();
    await settle();
    expect(calendar()).not.toBeNull();
    cell('2025')!.click();
    await settle();
    cell('março de 2025')!.click();
    await settle();
    expect(emitted).toEqual([{ year: 2025, month: 3 }]);
    expect(calendar()).toBeNull();
  });

  it('calendário em pt-BR', async () => {
    await render(2026, 10, true);
    monthButton().click();
    await settle();
    expect(calendar()?.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe(
      CALENDAR_LABELS.calendar,
    );
    expect(document.querySelector('.calendar-title')?.textContent?.trim()).toBe('2016 a 2039');
    expect(cell(CALENDAR_LABELS.previous.years)).toBeDefined();
    expect(cell(CALENDAR_LABELS.next.years)).toBeDefined();
    cell('2026')!.click();
    await settle();
    expect(cell(CALENDAR_LABELS.previous.months)).toBeDefined();
    expect(cell('outubro de 2026')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('Esc fecha o seletor', async () => {
    await render(2026, 10, true);
    monthButton().click();
    await settle();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle();
    expect(calendar()).toBeNull();
    expect(emitted).toEqual([]);
  });
});
