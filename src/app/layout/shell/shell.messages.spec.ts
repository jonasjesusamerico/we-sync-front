import * as shell from './shell.messages';

describe('shell.messages (textos)', () => {
  it('has the menu texts', () => {
    expect(shell.LABEL_MAIN_MENU).toBe('Menu principal');
    expect(Object.values(shell.NAV_GROUPS)).toEqual(['Menu', 'Planejamento', 'Administração']);
    expect(Object.values(shell.NAV_LABELS)).toEqual([
      'Início',
      'Compras',
      'Nossa casa',
      'Metas e relatórios',
      'Investimentos',
      'Configurações',
    ]);
    expect(Object.values(shell.NAV_SHORT_LABELS)).toEqual(['Início', 'Compras', 'Casa', 'Ajustes']);
    expect(shell.LABEL_BOTTOM_NAV).toBe('Navegação');
    expect(shell.SIDEBAR_CARD_TITLE).toBe('Registre na hora');
    expect(shell.SIDEBAR_CARD_TEXT).toBe(
      'Lançar a compra assim que ela acontece deixa o mês sempre em dia.',
    );
    expect(shell.LABEL_NEW_PURCHASE).toBe('Nova compra');
  });

  it('has the top bar and user menu texts', () => {
    expect(shell.LABEL_NOTIFICATIONS).toBe('Notificações');
    expect(shell.LABEL_ACCOUNT_MENU).toBe('Menu da conta');
    expect(shell.LABEL_MY_PROFILE).toBe('Meu perfil');
    expect(shell.LABEL_SETTINGS).toBe('Configurações');
    expect(shell.LABEL_LOGOUT).toBe('Sair');
    expect(shell.MSG_USER_UNAVAILABLE).toBe('Não foi possível carregar seus dados.');
  });
});
