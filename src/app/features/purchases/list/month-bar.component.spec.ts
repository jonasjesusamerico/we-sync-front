import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ApplicationRef, LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MATERIAL_ANIMATIONS,
} from '@angular/material/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';

import { BR_DATE_FORMATS, BrDateAdapter } from '../br-date-adapter';
import { PtBrDatepickerIntl } from '../pt-br-datepicker-intl';
import {
  DATEPICKER_LABELS,
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
      providers: [
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: DateAdapter, useClass: BrDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: BR_DATE_FORMATS },
        { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
        { provide: MatDatepickerIntl, useClass: PtBrDatepickerIntl },
      ],
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
  const calendar = () => document.querySelector('mat-calendar');
  const cell = (label: string) =>
    document.querySelector<HTMLElement>(`.mat-calendar-body-cell[aria-label="${label}"]`);

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
    const switcher = document.querySelector('.mat-calendar-period-button');
    // Em `multi-year`, o botão de troca leva à visão de dias.
    expect(switcher?.getAttribute('aria-label')).toBe(DATEPICKER_LABELS.switchToMonthViewLabel);
    expect(
      document.querySelector('.mat-calendar-previous-button')?.getAttribute('aria-label'),
    ).toBe(DATEPICKER_LABELS.prevMultiYearLabel);
  });
});
