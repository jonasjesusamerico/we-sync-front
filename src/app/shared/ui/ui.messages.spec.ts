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
