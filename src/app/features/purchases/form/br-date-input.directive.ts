import { Directive, ElementRef, forwardRef, inject } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';

import { formatBrDate, fromLocalDate, parseBrDate, toLocalDate } from '../plain-date';

/** Erro de texto que não é uma data `dd/mm/aaaa` válida. */
export const DATE_PARSE_ERROR = 'dateParse';

/**
 * Campo de data em texto `dd/mm/aaaa` (ADR-06): o modelo é um `Date` à meia-noite local, ou `null`. Lê `d/m/aaaa`
 * por `plain-date.ts` (o `Date` nativo leria no formato americano). Texto que não é data deixa o modelo `null` com o
 * erro `dateParse`; no `blur`, uma data válida é reescrita como `05/10/2026`.
 */
@Directive({
  selector: 'input[appBrDateInput]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BrDateInputDirective),
      multi: true,
    },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => BrDateInputDirective), multi: true },
  ],
  host: {
    autocomplete: 'off',
    inputmode: 'numeric',
    maxlength: '10',
    '(input)': 'onInput()',
    '(blur)': 'onBlur()',
  },
})
export class BrDateInputDirective implements ControlValueAccessor, Validator {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private onChange: (value: Date | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;
  private lastTextValid = true;

  writeValue(value: Date | null): void {
    this.lastTextValid = true;
    this.el.value = value ? formatBrDate(fromLocalDate(value)) : '';
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.el.disabled = disabled;
  }

  validate(): ValidationErrors | null {
    return this.lastTextValid ? null : { [DATE_PARSE_ERROR]: { text: this.el.value } };
  }

  protected onInput(): void {
    const text = this.el.value.trim();
    const date = text === '' ? null : parseBrDate(text);
    const valid = text === '' || date !== null;
    if (valid !== this.lastTextValid) {
      this.lastTextValid = valid;
      this.onValidatorChange();
    }
    this.onChange(date ? toLocalDate(date) : null);
  }

  protected onBlur(): void {
    const date = parseBrDate(this.el.value.trim());
    if (date) {
      this.el.value = formatBrDate(date);
    }
    this.onTouched();
  }
}
