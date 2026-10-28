import { FormControl, FormGroup } from '@angular/forms';

import { confirmPasswordValidator, passwordValidator } from './password.validators';

const validate = (value: string) => passwordValidator(new FormControl(value));

function group(password: string, confirm: string) {
  const form = new FormGroup({
    password: new FormControl(password, { nonNullable: true }),
    confirm: new FormControl(confirm, {
      nonNullable: true,
      validators: [confirmPasswordValidator('password')],
    }),
  });
  // Na construção o controle ainda não tem `parent`; revalida como acontece quando o usuário digita.
  form.controls.confirm.updateValueAndValidity();
  return form;
}

describe('passwordValidator', () => {
  it('senha com 7 bytes', () => {
    expect(validate('senha12')).toEqual({ passwordMinBytes: true });
  });

  it('senha com 8 bytes', () => {
    expect(validate('senha123')).toBeNull();
  });

  it('senha com 72 bytes', () => {
    expect(validate('a'.repeat(72))).toBeNull();
  });

  it('senha com 80 bytes em 40 caracteres', () => {
    expect(validate('á'.repeat(40))).toEqual({ passwordMaxBytes: true });
  });

  it('senha com 4 caracteres e 8 bytes', () => {
    expect(validate('áéíó')).toBeNull();
  });

  it('senha não sofre trim', () => {
    expect(validate('       a')).toBeNull();
  });

  it('senha vazia', () => {
    expect(validate('')).toEqual({ required: true });
  });
});

describe('confirmPasswordValidator', () => {
  it('confirmação vazia', () => {
    expect(group('senha123', '').controls.confirm.errors).toEqual({ required: true });
  });

  it('confirmação diferente', () => {
    expect(group('senha123', 'senha124').controls.confirm.errors).toEqual({
      passwordMismatch: true,
    });
  });

  it('confirmação igual', () => {
    expect(group('senha123', 'senha123').controls.confirm.errors).toBeNull();
  });
});
