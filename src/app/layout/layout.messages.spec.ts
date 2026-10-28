import {
  APP_NAME,
  LABEL_ACCOUNT,
  LABEL_AUTH_TABS,
  LABEL_HOME,
  LABEL_LOGOUT,
  LABEL_MAIN_NAV,
  LABEL_OPEN_MENU,
} from './layout.messages';

describe('layout.messages', () => {
  it('textos do layout', () => {
    expect(APP_NAME).toBe('we-sync');
    expect(LABEL_OPEN_MENU).toBe('Abrir menu');
    expect(LABEL_ACCOUNT).toBe('Conta');
    expect(LABEL_LOGOUT).toBe('Sair');
    expect(LABEL_MAIN_NAV).toBe('Navegação principal');
    expect(LABEL_AUTH_TABS).toBe('Acesso');
    expect(LABEL_HOME).toBe('Início');
  });
});
