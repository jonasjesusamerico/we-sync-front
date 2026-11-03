import { FormControl } from '@angular/forms';
import {
  emailValidator,
  nameValidator,
  newPasswordValidator,
  requiredPasswordValidator,
} from './auth-validators';

const run = (validator: typeof nameValidator, value: string) =>
  validator(new FormControl(value, { nonNullable: true }));

describe('nameValidator', () => {
  it.each(['', '   '])('nome obrigatório: %j', (value) => {
    expect(run(nameValidator, value)).toEqual({ required: true });
  });

  it.each(['A', ' A ', 'a'.repeat(61), '😀'])('nome fora do tamanho: %j', (value) => {
    expect(run(nameValidator, value)).toEqual({ nameLength: true });
  });

  it.each(['Jô', '  Ana  ', 'ã'.repeat(60), '😀😀'])('nome válido: %j', (value) => {
    expect(run(nameValidator, value)).toBeNull();
  });
});

describe('emailValidator', () => {
  it.each(['', '  '])('e-mail obrigatório: %j', (value) => {
    expect(run(emailValidator, value)).toEqual({ required: true });
  });

  it.each([
    'ana@exemplo',
    'ana exemplo@x.com',
    '@x.com',
    'ana@@x.com',
    `${'a'.repeat(243)}@exemplo.com`,
  ])('e-mail inválido: %s', (value) => {
    expect(run(emailValidator, value)).toEqual({ email: true });
  });

  it.each(['ana@exemplo.com', '  ANA@exemplo.com  ', `${'a'.repeat(242)}@exemplo.com`])(
    'e-mail válido: %s',
    (value) => {
      expect(run(emailValidator, value)).toBeNull();
    },
  );
});

describe('newPasswordValidator', () => {
  it.each([
    ['', { required: true }],
    ['Abc1234', { passwordShort: true }],
    ['á'.repeat(36) + 'a', { passwordLong: true }],
    ['á'.repeat(40), { passwordLong: true }],
  ])('senha nova: %j', (value, errors) => {
    expect(run(newPasswordValidator, value)).toEqual(errors);
  });

  it.each(['abcdefgh', 'áááá', '        ', 'a'.repeat(72)])('senha nova válida: %j', (value) => {
    expect(run(newPasswordValidator, value)).toBeNull();
  });
});

describe('requiredPasswordValidator', () => {
  it('senha do login', () => {
    expect(run(requiredPasswordValidator, '')).toEqual({ required: true });
    expect(run(requiredPasswordValidator, 'a')).toBeNull();
  });
});
