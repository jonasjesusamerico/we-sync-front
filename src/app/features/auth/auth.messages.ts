// Textos das telas de autenticação ("Textos da interface" do SDD frontend da feature 001).

export const MSG_REGISTERED = 'Conta criada. Entre com sua senha.';
export const MSG_EMAIL_TAKEN = 'Este e-mail já está cadastrado.';
export const MSG_INVALID_CREDENTIALS = 'E-mail ou senha inválidos.';
export const MSG_SESSION_EXPIRED = 'Sua sessão expirou. Entre novamente.';

export const LABEL_EMAIL = 'E-mail';
export const LABEL_PASSWORD = 'Senha';
export const LABEL_CONFIRM_PASSWORD = 'Confirmar senha';
export const LABEL_LOGIN = 'Entrar';
export const LABEL_REGISTER = 'Criar conta';

/** `state` da navegação para `/login`. */
export interface LoginNavigationState {
  email?: string;
  notice?: 'registered' | 'expired';
}
