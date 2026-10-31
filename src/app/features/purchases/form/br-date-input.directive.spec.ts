import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { BrDateInputDirective, DATE_PARSE_ERROR } from './br-date-input.directive';

@Component({
  imports: [ReactiveFormsModule, BrDateInputDirective],
  template: `<input appBrDateInput [formControl]="control" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostComponent {
  readonly control = new FormControl<Date | null>(null, [Validators.required]);
}

describe('BrDateInputDirective', () => {
  async function render() {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const input = (fixture.nativeElement as HTMLElement).querySelector('input') as HTMLInputElement;
    const control = fixture.componentInstance.control;
    const type = (text: string) => {
      input.value = text;
      input.dispatchEvent(new Event('input'));
    };
    return { input, control, type };
  }

  const ymd = (d: Date | null) => d && [d.getFullYear(), d.getMonth() + 1, d.getDate()];

  it('lê dd/mm/aaaa e d/m/aaaa', async () => {
    const { control, type } = await render();
    type('05/10/2026');
    expect(ymd(control.value)).toEqual([2026, 10, 5]);
    expect(control.value?.getHours()).toBe(0);
    type('5/1/2026');
    expect(ymd(control.value)).toEqual([2026, 1, 5]);
    expect(control.valid).toBe(true);
  });

  it('data inválida', async () => {
    const { control, type } = await render();
    for (const text of ['31/02/2026', '05/10/26', 'abc']) {
      type(text);
      expect(control.value).toBeNull();
      expect(control.hasError(DATE_PARSE_ERROR)).toBe(true);
    }
    type('05/10/2026');
    expect(control.hasError(DATE_PARSE_ERROR)).toBe(false);
  });

  it('vazio é só obrigatório', async () => {
    const { control, type } = await render();
    type('abc');
    type('  ');
    expect(control.hasError(DATE_PARSE_ERROR)).toBe(false);
    expect(control.hasError('required')).toBe(true);
  });

  it('escreve o modelo no campo', async () => {
    const { input, control } = await render();
    control.setValue(new Date(2026, 9, 5));
    expect(input.value).toBe('05/10/2026');
    const year50 = new Date(2000, 0, 1);
    year50.setFullYear(50, 0, 2);
    control.setValue(year50);
    expect(input.value).toBe('02/01/0050');
    control.setValue(null);
    expect(input.value).toBe('');
  });

  it('blur reescreve e marca tocado', async () => {
    const { input, control, type } = await render();
    type('5/10/2026');
    input.dispatchEvent(new Event('blur'));
    expect(input.value).toBe('05/10/2026');
    expect(control.touched).toBe(true);
  });
});
