import * as ui from './ui.messages';

describe('ui.messages (textos)', () => {
  it('has the texts of the SDD', () => {
    expect(ui.BRAND_NAME).toBe('we-sync');
    expect(ui.LABEL_SHOW_PASSWORD).toBe('Mostrar senha');
    expect(ui.LABEL_HIDE_PASSWORD).toBe('Ocultar senha');
    expect(ui.STRENGTH_HINT_EMPTY).toBe('Use pelo menos 8 caracteres.');
    expect(ui.STRENGTH_HINT_WEAK).toBe('Misture letras maiúsculas, números e símbolos.');
    expect(ui.STRENGTH_HINT_STRONG).toBe('Senha forte.');
    expect(ui.SOON_TITLE).toBe('Em breve');
    expect(ui.SOON_TAG).toBe('em breve');
    expect(ui.soonLabel('Compras')).toBe('Compras, em breve');
    expect(ui.LABEL_USE_DARK_THEME).toBe('Usar tema escuro');
    expect(ui.LABEL_USE_LIGHT_THEME).toBe('Usar tema claro');
  });
});

describe('ui.messages (feature 005)', () => {
  it('has the paginator, month switcher and area texts', () => {
    expect(ui.pagerInfo(1, 3)).toBe('Página 1 de 3');
    expect(ui.LABEL_PREVIOUS_PAGE).toBe('Anterior');
    expect(ui.LABEL_NEXT_PAGE).toBe('Próxima');
    expect(ui.LABEL_MONTH).toBe('Mês');
    expect(ui.LABEL_PREVIOUS_MONTH).toBe('Mês anterior');
    expect(ui.LABEL_NEXT_MONTH).toBe('Próximo mês');
    expect(ui.LABEL_CURRENT_MONTH).toBe('Mês atual');
    expect(ui.LABEL_LOADING).toBe('Carregando…');
    expect(ui.LABEL_RETRY).toBe('Tentar novamente');
    expect(ui.LABEL_CLOSE_TOAST).toBe('Fechar aviso');
  });
});
