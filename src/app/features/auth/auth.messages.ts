// Texts of the login and register pages (feature 004). No Angular imports: the e2e re-exports this file.
export { MSG_CONNECTION, MSG_INVALID_DATA, MSG_SERVER } from '../../core/http/error-messages';

export const TITLE_LOGIN = 'Entrar · we-sync';
export const TITLE_REGISTER = 'Criar conta · we-sync';

export const LOGIN_TITLE = 'Que bom te ver de novo';
export const LOGIN_SUBTITLE = 'Entre para ver como está o seu mês.';
export const LABEL_FORGOT_PASSWORD = 'Esqueci a senha';
export const LABEL_LOGIN_SUBMIT = 'Entrar';
export const LABEL_DIVIDER_OR = 'ou';
export const LOGIN_NO_ACCOUNT = 'Ainda não tem conta?';
export const LABEL_CREATE_ACCOUNT = 'Criar conta grátis';

export const LOGIN_PANEL_TITLE = 'Suas finanças em sincronia, sem complicação.';
export const LOGIN_PANEL_TEXT =
  'Registre compras em segundos, acompanhe o mês e descubra para onde vai o seu dinheiro.';
export const LOGIN_PREVIEW = {
  label: 'Gasto em outubro',
  total: 'R$ 3.925,42',
  items: [
    { title: 'Supermercado', meta: '23 out · Cartão', amount: 'R$ 412,30' },
    { title: 'Cinema', meta: '12 out · Cartão', amount: 'R$ 64,00' },
  ],
} as const;

export const REGISTER_TITLE = 'Crie sua conta';
export const REGISTER_SUBTITLE = 'É grátis e leva menos de um minuto.';
export const LABEL_REGISTER_SUBMIT = 'Criar conta';
export const REGISTER_HAS_ACCOUNT = 'Já tem conta?';
export const LABEL_GO_TO_LOGIN = 'Entrar';

export const REGISTER_PANEL_TITLE = 'Comece a organizar o seu dinheiro hoje.';
export const REGISTER_PANEL_BENEFITS = [
  { icon: 'receipt', text: 'Lance compras em segundos, do celular ou do computador' },
  { icon: 'chart', text: 'Veja para onde vai o dinheiro, por categoria' },
  { icon: 'shield', text: 'Seus dados só são vistos por você' },
] as const;

export const LABEL_NAME = 'Nome';
export const LABEL_EMAIL = 'E-mail';
export const LABEL_PASSWORD = 'Senha';
export const PLACEHOLDER_NAME = 'Como quer ser chamado';
export const PLACEHOLDER_EMAIL = 'voce@email.com';

export const MSG_NAME_REQUIRED = 'Informe seu nome.';
export const MSG_NAME_LENGTH = 'O nome deve ter de 2 a 60 caracteres.';
export const MSG_EMAIL_REQUIRED = 'Informe seu e-mail.';
export const MSG_EMAIL_INVALID = 'Informe um e-mail válido.';
export const MSG_PASSWORD_REQUIRED = 'Informe sua senha.';
export const MSG_PASSWORD_SHORT = 'Use pelo menos 8 caracteres.';
export const MSG_PASSWORD_LONG = 'A senha é longa demais. Use menos caracteres.';

export const MSG_INVALID_CREDENTIALS = 'E-mail ou senha incorretos.';
export const MSG_EMAIL_TAKEN = 'Este e-mail já está cadastrado.';
export const MSG_SESSION_EXPIRED = 'Sua sessão expirou. Entre novamente.';
export const MSG_ACCOUNT_CREATED = 'Conta criada. Entre com sua senha.';
export const MSG_ACCOUNT_DELETED = 'Sua conta foi excluída.';
