import { Directive, ElementRef, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { codePoints } from '../../shared/validators/text-measure';

/** RN-08: the form accepts up to 120 characters (code points); the API accepts 255. */
export const DESCRIPTION_MAX = 120;

const firstPoints = (text: string, max: number): string => Array.from(text).slice(0, max).join('');

/**
 * Value accepted by the field after an input event (code points, RN-08, RN-09).
 * Up to 120 → as typed. Above 120: a paste fills up to the limit; an old description (already above 120) can only
 * get shorter.
 */
export function limitDescription(previous: string, next: string): string {
  if (codePoints(next) <= DESCRIPTION_MAX) {
    return next;
  }
  if (codePoints(previous) <= DESCRIPTION_MAX) {
    return firstPoints(next, DESCRIPTION_MAX);
  }
  return codePoints(next) < codePoints(previous) ? next : previous;
}

/**
 * Text field of the description (DAS 4.1): refuses the 121st code point and lets an old, longer description only
 * shrink. The form value is the text as typed (trimmed on submit).
 */
@Directive({
  selector: 'input[wsDescriptionInput]',
  host: { '(input)': 'onInput()', '(blur)': 'onTouched()' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DescriptionInputDirective),
      multi: true,
    },
  ],
})
export class DescriptionInputDirective implements ControlValueAccessor {
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
    const next = limitDescription(this.last, this.el.value);
    if (next !== this.el.value) {
      this.el.value = next;
    }
    this.last = next;
    this.onChange(next);
  }
}
