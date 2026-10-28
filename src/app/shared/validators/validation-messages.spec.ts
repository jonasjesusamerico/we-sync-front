import {
  fieldErrorMessage,
  FieldKind,
  MSG_CONFIRM_REQUIRED,
  MSG_EMAIL_FORMAT,
  MSG_EMAIL_MAX_BYTES,
  MSG_EMAIL_REQUIRED,
  MSG_PASSWORD_MAX_BYTES,
  MSG_PASSWORD_MIN_BYTES,
  MSG_PASSWORD_MISMATCH,
  MSG_PASSWORD_REQUIRED,
} from './validation-messages';

describe('fieldErrorMessage', () => {
  const cases: [FieldKind, string, string][] = [
    ['email', 'required', 'Informe o e-mail.'],
    ['email', 'emailFormat', 'Informe um e-mail válido.'],
    ['email', 'emailMaxBytes', 'O e-mail é muito longo.'],
    ['password', 'required', 'Informe a senha.'],
    ['password', 'passwordMinBytes', 'A senha precisa ter pelo menos 8 caracteres.'],
    ['password', 'passwordMaxBytes', 'A senha é muito longa.'],
    ['confirmPassword', 'required', 'Confirme a senha.'],
    ['confirmPassword', 'passwordMismatch', 'As senhas não conferem.'],
  ];

  it.each(cases)('fieldErrorMessage mapeia cada chave (%s.%s)', (kind, key, text) => {
    expect(fieldErrorMessage(kind, { [key]: true })).toBe(text);
  });

  it('as constantes são os textos da interface', () => {
    expect([
      MSG_EMAIL_REQUIRED,
      MSG_EMAIL_FORMAT,
      MSG_EMAIL_MAX_BYTES,
      MSG_PASSWORD_REQUIRED,
      MSG_PASSWORD_MIN_BYTES,
      MSG_PASSWORD_MAX_BYTES,
      MSG_CONFIRM_REQUIRED,
      MSG_PASSWORD_MISMATCH,
    ]).toEqual(cases.map(([, , text]) => text));
  });

  it('fieldErrorMessage sem erro', () => {
    expect(fieldErrorMessage('email', null)).toBeNull();
    expect(fieldErrorMessage('password', null)).toBeNull();
    expect(fieldErrorMessage('confirmPassword', null)).toBeNull();
  });
});
