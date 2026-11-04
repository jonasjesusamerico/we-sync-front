import * as home from './home.messages';

describe('home.messages (textos)', () => {
  it('has the home texts', () => {
    expect(home.TITLE_HOME).toBe('Início · we-sync');
    expect(home.greeting('Ana Souza')).toBe('Olá, Ana Souza');
    expect(home.GREETING_FALLBACK).toBe('Olá!');
    expect(home.HOME_SUBTITLE).toBe('Veja como está o seu mês.');
    expect('HOME_SOON' in home).toBe(false);
  });
});

describe('home.messages (cartão do gasto, feature 005)', () => {
  it('has the spending card texts', () => {
    expect(home.spentIn('novembro')).toBe('Gasto em novembro');
    expect(home.LABEL_SEE_PURCHASES).toBe('Ver compras');
    expect(home.noPurchasesIn('novembro')).toBe('Nenhuma compra em novembro.');
    expect(home.LABEL_NEW_PURCHASE).toBe('Nova compra');
    expect(home.sealMore(10, 'agosto', '')).toBe('10% a mais que agosto');
    expect(home.sealLess(50, 'outubro', ' até o dia 10')).toBe(
      '50% a menos que outubro até o dia 10',
    );
    expect(home.sealEqual('agosto', '')).toBe('Igual a agosto');
    expect(home.sealNoBase('agosto', '')).toBe('Sem compras em agosto para comparar.');
  });
});
