import { FormControl } from '@angular/forms';

import { emailValidator } from './email.validator';

const validate = (value: string) => emailValidator(new FormControl(value));

describe('emailValidator', () => {
  it('email vazio', () => {
    expect(validate('')).toEqual({ required: true });
    expect(validate('   ')).toEqual({ required: true });
  });

  it('email sem ponto no domínio', () => {
    expect(validate('ana@exemplo')).toEqual({ emailFormat: true });
  });

  it('email com espaço no meio', () => {
    expect(validate('ana @exemplo.com')).toEqual({ emailFormat: true });
  });

  it('email com dois @', () => {
    expect(validate('a@b@c.com')).toEqual({ emailFormat: true });
  });

  it('email com 255 caracteres', () => {
    const value = 'a'.repeat(243) + '@exemplo.com';
    expect(value.length).toBe(255);
    expect(validate(value)).toEqual({ emailMaxBytes: true });
  });

  it('email com 254 caracteres', () => {
    const value = 'a'.repeat(242) + '@exemplo.com';
    expect(value.length).toBe(254);
    expect(validate(value)).toBeNull();
  });

  it('email com espaços nas pontas', () => {
    expect(validate('  ana@exemplo.com  ')).toBeNull();
  });

  it('email válido', () => {
    expect(validate('ana@exemplo.com')).toBeNull();
  });
});
