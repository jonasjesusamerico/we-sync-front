import { Directive, ElementRef, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { digitsToCents, formatMoneyInput } from '../../money/money';

/**
 * Amount field in cents (RN-07, ADR-11): each digit enters from the right ("1", "2", "3" → "1,23"); letters and
 * symbols are ignored; a digit that would pass R$ 99.999.999,99 is refused. The form value is the integer in cents.
 */
@Directive({
  selector: 'input[wsMoneyInput]',
  host: {
    inputmode: 'numeric',
    autocomplete: 'off',
    '(input)': 'onInput()',
    '(focus)': 'onFocus()',
    '(blur)': 'onTouched()',
  },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MoneyInputDirective), multi: true },
  ],
})
export class MoneyInputDirective implements ControlValueAccessor {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private cents = 0;
  private onChange: (cents: number) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(cents: number | null): void {
    this.cents = cents ?? 0;
    this.el.value = formatMoneyInput(this.cents);
  }

  registerOnChange(fn: (cents: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.el.disabled = disabled;
  }

  protected onInput(): void {
    const next = digitsToCents(this.el.value);
    if (next === null) {
      this.el.value = formatMoneyInput(this.cents);
      this.moveCaretToEnd();
      return;
    }
    this.cents = next;
    this.el.value = formatMoneyInput(next);
    this.moveCaretToEnd();
    this.onChange(next);
  }

  protected onFocus(): void {
    this.el.select();
  }

  private moveCaretToEnd(): void {
    const end = this.el.value.length;
    this.el.setSelectionRange(end, end);
  }
}
