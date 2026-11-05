import * as nav from './navigation.messages';

describe('navigation.messages (textos)', () => {
  it('descarte', () => {
    expect(nav.DISCARD_TITLE).toBe('Descartar alterações?');
    expect(nav.DISCARD_KEEP).toBe('Continuar editando');
    expect(nav.DISCARD_CONFIRM).toBe('Descartar');
  });
});
