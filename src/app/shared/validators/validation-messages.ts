import { ValidationErrors } from '@angular/forms';

export type FieldKind = 'email' | 'password' | 'confirmPassword';

export const MSG_EMAIL_REQUIRED = 'Informe o e-mail.';
export const MSG_EMAIL_FORMAT = 'Informe um e-mail válido.';
export const MSG_EMAIL_MAX_BYTES = 'O e-mail é muito longo.';
export const MSG_PASSWORD_REQUIRED = 'Informe a senha.';
export const MSG_PASSWORD_MIN_BYTES = 'A senha precisa ter pelo menos 8 caracteres.';
export const MSG_PASSWORD_MAX_BYTES = 'A senha é muito longa.';
export const MSG_CONFIRM_REQUIRED = 'Confirme a senha.';
export const MSG_PASSWORD_MISMATCH = 'As senhas não conferem.';

const MESSAGES: Record<FieldKind, readonly (readonly [string, string])[]> = {
  email: [
    ['required', MSG_EMAIL_REQUIRED],
    ['emailMaxBytes', MSG_EMAIL_MAX_BYTES],
    ['emailFormat', MSG_EMAIL_FORMAT],
  ],
  password: [
    ['required', MSG_PASSWORD_REQUIRED],
    ['passwordMinBytes', MSG_PASSWORD_MIN_BYTES],
    ['passwordMaxBytes', MSG_PASSWORD_MAX_BYTES],
  ],
  confirmPassword: [
    ['required', MSG_CONFIRM_REQUIRED],
    ['passwordMismatch', MSG_PASSWORD_MISMATCH],
  ],
};

/** Texto do erro do campo para a primeira chave conhecida presente em `errors`. */
export function fieldErrorMessage(kind: FieldKind, errors: ValidationErrors | null): string | null {
  if (!errors) {
    return null;
  }
  for (const [key, message] of MESSAGES[kind]) {
    if (errors[key]) {
      return message;
    }
  }
  return null;
}
