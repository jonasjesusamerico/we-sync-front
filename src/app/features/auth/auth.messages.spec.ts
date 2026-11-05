import * as auth from './auth.messages';

describe('auth.messages (textos)', () => {
  it('has the login texts', () => {
    expect(auth.TITLE_LOGIN).toBe('Entrar · we-sync');
    expect(auth.LOGIN_TITLE).toBe('Que bom te ver de novo');
    expect(auth.LOGIN_SUBTITLE).toBe('Entre para ver como está o seu mês.');
    expect(auth.LABEL_FORGOT_PASSWORD).toBe('Esqueci a senha');
    expect(auth.LABEL_LOGIN_SUBMIT).toBe('Entrar');
    expect(auth.LABEL_DIVIDER_OR).toBe('ou');
    expect(auth.LOGIN_NO_ACCOUNT).toBe('Ainda não tem conta?');
    expect(auth.LABEL_CREATE_ACCOUNT).toBe('Criar conta grátis');
    expect(auth.LOGIN_PANEL_TITLE).toBe('Suas finanças em sincronia, sem complicação.');
    expect(auth.LOGIN_PANEL_TEXT).toBe(
      'Registre compras em segundos, acompanhe o mês e descubra para onde vai o seu dinheiro.',
    );
    expect(auth.LOGIN_PREVIEW).toEqual({
      label: 'Gasto em outubro',
      total: 'R$ 3.925,42',
      items: [
        { title: 'Supermercado', meta: '23 out · Cartão', amount: 'R$ 412,30' },
        { title: 'Cinema', meta: '12 out · Cartão', amount: 'R$ 64,00' },
      ],
    });
  });

  it('has the register texts', () => {
    expect(auth.TITLE_REGISTER).toBe('Criar conta · we-sync');
    expect(auth.REGISTER_TITLE).toBe('Crie sua conta');
    expect(auth.REGISTER_SUBTITLE).toBe('É grátis e leva menos de um minuto.');
    expect(auth.LABEL_REGISTER_SUBMIT).toBe('Criar conta');
    expect(auth.REGISTER_HAS_ACCOUNT).toBe('Já tem conta?');
    expect(auth.LABEL_GO_TO_LOGIN).toBe('Entrar');
    expect(auth.REGISTER_PANEL_TITLE).toBe('Comece a organizar o seu dinheiro hoje.');
    expect(auth.REGISTER_PANEL_BENEFITS.map((b) => [b.icon, b.text])).toEqual([
      ['receipt', 'Lance compras em segundos, do celular ou do computador'],
      ['chart', 'Veja para onde vai o dinheiro, por categoria'],
      ['shield', 'Seus dados só são vistos por você'],
    ]);
  });

  it('has the field labels and errors', () => {
    expect([auth.LABEL_NAME, auth.LABEL_EMAIL, auth.LABEL_PASSWORD]).toEqual([
      'Nome',
      'E-mail',
      'Senha',
    ]);
    expect(auth.PLACEHOLDER_NAME).toBe('Como quer ser chamado');
    expect(auth.PLACEHOLDER_EMAIL).toBe('voce@email.com');
    expect(auth.MSG_NAME_REQUIRED).toBe('Informe seu nome.');
    expect(auth.MSG_NAME_LENGTH).toBe('O nome deve ter de 2 a 60 caracteres.');
    expect(auth.MSG_EMAIL_REQUIRED).toBe('Informe seu e-mail.');
    expect(auth.MSG_EMAIL_INVALID).toBe('Informe um e-mail válido.');
    expect(auth.MSG_PASSWORD_REQUIRED).toBe('Informe sua senha.');
    expect(auth.MSG_PASSWORD_SHORT).toBe('Use pelo menos 8 caracteres.');
    expect(auth.MSG_PASSWORD_LONG).toBe('A senha é longa demais. Use menos caracteres.');
  });

  it('has the notices and re-exports the generic errors', () => {
    expect(auth.MSG_INVALID_CREDENTIALS).toBe('E-mail ou senha incorretos.');
    expect(auth.MSG_EMAIL_TAKEN).toBe('Este e-mail já está cadastrado.');
    expect(auth.MSG_SESSION_EXPIRED).toBe('Sua sessão expirou. Entre novamente.');
    expect(auth.MSG_ACCOUNT_CREATED).toBe('Conta criada. Entre com sua senha.');
    expect(auth.MSG_CONNECTION).toContain('Não foi possível conectar');
    expect(auth.MSG_SERVER).toBe('Algo deu errado. Tente novamente em instantes.');
    expect(auth.MSG_INVALID_DATA).toBe('Verifique os dados informados.');
  });
});
