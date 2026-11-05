import { Directive, ElementRef, forwardRef, inject, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { codePoints } from '../validators/text-measure';

const firstPoints = (text: string, max: number): string => Array.from(text).slice(0, max).join('');

/**
 * Value accepted by a limited field after an input event (code points).
 * Up to `max` → as typed. Above `max`: a paste fills up to the limit; an old value (already above `max`) can only
 * get shorter.
 */
export function limitCodePoints(previous: string, next: string, max: number): string {
  if (codePoints(next) <= max) {
    return next;
  }
  if (codePoints(previous) <= max) {
    return firstPoints(next, max);
  }
  return codePoints(next) < codePoints(previous) ? next : previous;
}

/**
 * Text field limited to `wsCodePointLimit` code points (purchase description, category and payment method names):
 * refuses the code point after the limit and lets an old, longer value only shrink. The form value is the text as
 * typed (trimmed on submit).
 */
@Directive({
  selector: 'input[wsCodePointLimit]',
  host: { '(input)': 'onInput()', '(blur)': 'onTouched()' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CodePointLimitDirective),
      multi: true,
    },
  ],
})
export class CodePointLimitDirective implements ControlValueAccessor {
  readonly wsCodePointLimit = input.required<number>();

  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private last = '';
  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.last = value ?? '';
    this.el.value = this.last;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.el.disabled = disabled;
  }

  protected onInput(): void {
    const next = limitCodePoints(this.last, this.el.value, this.wsCodePointLimit());
    if (next !== this.el.value) {
      this.el.value = next;
    }
    this.last = next;
    this.onChange(next);
  }
}
