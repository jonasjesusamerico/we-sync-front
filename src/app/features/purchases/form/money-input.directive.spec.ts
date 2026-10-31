import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MoneyInputDirective } from './money-input.directive';

@Component({
  imports: [ReactiveFormsModule, MoneyInputDirective],
  template: `<input appMoneyInput [formControl]="control" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostComponent {
  readonly control = new FormControl('', { nonNullable: true });
}

describe('MoneyInputDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let input: HTMLInputElement;
  let control: FormControl<string>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    control = fixture.componentInstance.control;
    input.dispatchEvent(new Event('focus'));
  });

  /** Um `input` por caractere, com o cursor no fim (como a digitação). */
  function typeChars(chars: string) {
    for (const c of chars) {
      input.value += c;
      input.setSelectionRange(input.value.length, input.value.length);
      input.dispatchEvent(new Event('input'));
    }
  }

  it('atributos do campo', () => {
    expect(input.getAttribute('inputmode')).toBe('decimal');
    expect(input.getAttribute('autocomplete')).toBe('off');
  });

  it('diretiva aceita a digitação', () => {
    typeChars('10,55');
    expect(control.value).toBe('10,55');
    expect(input.value).toBe('10,55');
  });

  it('terceira casa recusada', () => {
    typeChars('10,55');
    typeChars('5');
    expect(control.value).toBe('10,55');
    expect(input.value).toBe('10,55');
  });

  it('colagem recusada', () => {
    typeChars('12');
    input.value = '10,555';
    input.dispatchEvent(new Event('input'));
    expect(control.value).toBe('12');
    expect(input.value).toBe('12');
  });

  it('letra recusada', () => {
    typeChars('12a');
    expect(control.value).toBe('12');
    expect(input.value).toBe('12');
  });

  it('blur formata', () => {
    typeChars('1234,5');
    input.dispatchEvent(new Event('blur'));
    expect(control.value).toBe('1.234,50');
    expect(input.value).toBe('1.234,50');
  });

  it('blur não mexe no inválido', () => {
    typeChars(',');
    input.dispatchEvent(new Event('blur'));
    expect(control.value).toBe(',');
  });

  it('limite de 15', () => {
    expect(input.getAttribute('maxlength')).toBe('15');
    typeChars('100.000.000,00');
    expect(control.value).toBe('100.000.000,00');
  });

  it('valor carregado', () => {
    input.dispatchEvent(new Event('blur'));
    control.setValue('1.234,56');
    input.dispatchEvent(new Event('focus'));
    typeChars('7');
    expect(control.value).toBe('1.234,56');
    expect(input.value).toBe('1.234,56');
  });
});
