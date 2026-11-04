import { FormControl } from '@angular/forms';
import { isoDate, maxCodePointsTrimmed, minCents, requiredTrimmed } from './purchase-validators';

const check = (validator: Parameters<FormControl['addValidators']>[0], value: unknown) =>
  new FormControl(value, validator).errors;

describe('purchase-validators', () => {
  it('minCents', () => {
    expect(check(minCents(1), 0)).toEqual({ minCents: true });
    expect(check(minCents(1), null)).toEqual({ minCents: true });
    expect(check(minCents(1), 1)).toBeNull();
  });

  it('requiredTrimmed', () => {
    expect(check(requiredTrimmed, '   ')).toEqual({ required: true });
    expect(check(requiredTrimmed, null)).toEqual({ required: true });
    expect(check(requiredTrimmed, ' a ')).toBeNull();
  });

  it('maxCodePointsTrimmed', () => {
    expect(check(maxCodePointsTrimmed(120), ' ' + 'a'.repeat(120) + ' ')).toBeNull();
    expect(check(maxCodePointsTrimmed(120), 'a'.repeat(121))).toEqual({
      maxCodePoints: { max: 120 },
    });
    expect(check(maxCodePointsTrimmed(120), '😀'.repeat(120))).toBeNull();
  });

  it.each([
    ['', { required: true }],
    ['20266-11-05', { required: true }],
    ['0000-01-01', { required: true }],
    ['2026-02-30', { required: true }],
    ['0001-01-01', null],
    ['9999-12-31', null],
  ])('isoDate(%j) (D-20)', (value, expected) => {
    expect(check(isoDate, value)).toEqual(expected);
  });
});
