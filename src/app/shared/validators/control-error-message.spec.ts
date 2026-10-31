import { TestBed } from '@angular/core/testing';
import { FormControl, ValidationErrors, Validators } from '@angular/forms';

import { controlErrorFrom } from './control-error-message';

describe('controlErrorFrom', () => {
  it('acompanha os erros do controle com a tradução de quem chama', () => {
    const control = new FormControl('', { validators: [Validators.required] });
    const messageOf = (errors: ValidationErrors | null) =>
      errors?.['required'] ? 'Obrigatório' : null;
    const message = TestBed.runInInjectionContext(() => controlErrorFrom(control, messageOf));
    expect(message()).toBe('Obrigatório');
    control.setValue('x');
    expect(message()).toBeNull();
    control.setErrors({ required: true });
    expect(message()).toBe('Obrigatório');
  });
});
