import { Directive, ElementRef, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

import { formatBrl, MONEY_INPUT_MAX_LENGTH, MONEY_TYPING_PATTERN, parseBrl } from '../money';

/**
 * Campo de valor em reais (ADR-07): só aceita o que casa `MONEY_TYPING_PATTERN` (dígitos, pontos e até duas casas
 * depois da vírgula). Ouve o `input`, que sempre dispara (digitação, colagem e teclado virtual); um texto recusado
 * volta ao último aceito. No `blur`, reescreve o valor no formato `1.234,56`.
 */
@Directive({
  selector: 'input[appMoneyInput]',
  host: {
    inputmode: 'decimal',
    autocomplete: 'off',
    '[attr.maxlength]': 'maxLength',
    '(focus)': 'onFocus()',
    '(input)': 'onInput()',
    '(blur)': 'onBlur()',
  },
})
export class MoneyInputDirective {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private readonly ngControl = inject(NgControl, { self: true });
  private lastAccepted = '';

  protected readonly maxLength = MONEY_INPUT_MAX_LENGTH;

  protected onFocus(): void {
    this.lastAccepted = this.accepts(this.el.value) ? this.el.value : '';
  }

  protected onInput(): void {
    const text = this.el.value;
    if (this.accepts(text)) {
      this.lastAccepted = text;
      return;
    }
    const caret = this.el.selectionStart ?? text.length;
    this.el.value = this.lastAccepted;
    this.ngControl.control?.setValue(this.lastAccepted);
    const position = Math.max(0, caret - (text.length - this.lastAccepted.length));
    this.el.setSelectionRange(position, position);
  }

  protected onBlur(): void {
    const cents = parseBrl(this.el.value);
    if (cents !== null && formatBrl(cents) !== this.el.value) {
      this.ngControl.control?.setValue(formatBrl(cents));
    }
  }

  private accepts(text: string): boolean {
    return text.length <= MONEY_INPUT_MAX_LENGTH && MONEY_TYPING_PATTERN.test(text);
  }
}
