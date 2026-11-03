import * as home from './home.messages';

describe('home.messages (textos)', () => {
  it('has the home texts', () => {
    expect(home.TITLE_HOME).toBe('Início · we-sync');
    expect(home.greeting('Ana Souza')).toBe('Olá, Ana Souza');
    expect(home.GREETING_FALLBACK).toBe('Olá!');
    expect(home.HOME_SUBTITLE).toBe('Veja como está o seu mês.');
    expect(home.HOME_SOON).toBe('O resumo do seu mês vai aparecer aqui em breve.');
  });
});
