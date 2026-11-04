import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { typeInto } from '../../../../testing/dom';
import { MAX_CENTS } from '../../money/money';
import { MoneyInputDirective } from './money-input';

@Component({
  imports: [ReactiveFormsModule, MoneyInputDirective],
  template: `<input wsMoneyInput [formControl]="control" />`,
})
class Host {
  readonly control = new FormControl(0, { nonNullable: true });
}

async function render(initial = 0) {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.control.setValue(initial);
  await fixture.whenStable();
  const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
  return { input, control: fixture.componentInstance.control };
}

/** Types one character at the end, as the caret is always moved to the end. */
const typeChar = (input: HTMLInputElement, char: string) => typeInto(input, input.value + char);

describe('MoneyInputDirective (campo de valor)', () => {
  it('atributos e valor inicial', async () => {
    const { input } = await render();
    expect(input.getAttribute('inputmode')).toBe('numeric');
    expect(input.getAttribute('autocomplete')).toBe('off');
    expect(input.value).toBe('0,00');
  });

  it('valor: dígitos', async () => {
    const { input, control } = await render();
    for (const digit of ['1', '2', '3']) {
      typeChar(input, digit);
    }
    expect(input.value).toBe('1,23');
    expect(control.value).toBe(123);
    expect(input.selectionStart).toBe(4);
  });

  it('valor: máximo', async () => {
    const { input, control } = await render(MAX_CENTS);
    expect(input.value).toBe('99.999.999,99');
    typeChar(input, '5');
    expect(input.value).toBe('99.999.999,99');
    expect(control.value).toBe(MAX_CENTS);
    expect(control.dirty).toBe(false);
  });

  it('valor: letras e colar', async () => {
    const { input, control } = await render();
    typeInto(input, 'R$ 12,34abc');
    expect(input.value).toBe('12,34');
    expect(control.value).toBe(1234);
  });

  it('valor: foco seleciona tudo', async () => {
    const { input } = await render(123);
    input.dispatchEvent(new Event('focus'));
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(input.value.length);
  });

  it('valor: apagar', async () => {
    const { input, control } = await render(123);
    typeInto(input, input.value.slice(0, -1));
    expect(input.value).toBe('0,12');
    expect(control.value).toBe(12);
  });

  it('valor: escrito pelo formulário e desabilitado', async () => {
    const { input, control } = await render();
    control.setValue(123456);
    expect(input.value).toBe('1.234,56');
    control.disable();
    expect(input.disabled).toBe(true);
  });
});
