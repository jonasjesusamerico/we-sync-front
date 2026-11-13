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

describe('home.messages (blocos do mês, feature 007)', () => {
  it('textos novos', () => {
    expect(home.purchaseCount(0)).toBe('0 compras');
    expect(home.purchaseCount(1)).toBe('1 compra');
    expect(home.purchaseCount(3)).toBe('3 compras');
    expect(home.inDays(1)).toBe('em 1 dia');
    expect(home.inDays(10)).toBe('em 10 dias');
    expect(home.peakDay(25)).toBe('Pico dia 25');
    expect(home.dailyChartLabel('novembro')).toBe('Gráfico de gastos por dia de novembro');
    expect(home.dayValue(2, 'R$ 100,00', false)).toBe('Dia 2: R$ 100,00');
    expect(home.dayValue(25, 'R$ 1.000,00', true)).toBe('Dia 25: R$ 1.000,00 (previsto)');
    expect(home.categoryChartLabel(['Moradia R$ 1.000,00', 'Alimentação R$ 160,00'])).toBe(
      'Gastos por categoria: Moradia R$ 1.000,00, Alimentação R$ 160,00',
    );
    expect(home.purchaseMeta('02 nov', 'Pix')).toBe('02 nov · Pix');
    expect(home.shorterMonthSuffix(31, 'setembro', 30)).toBe(
      ' (até o dia 31; setembro até o dia 30)',
    );
  });

  it('títulos dos blocos', () => {
    expect([home.KPI_PAID, home.KPI_PENDING, home.KPI_COUNT, home.KPI_AVERAGE]).toEqual([
      'Já pago',
      'A pagar',
      'Compras',
      'Média por dia',
    ]);
    expect(home.KPI_COUNT_FOOT).toBe('neste mês');
    expect(home.DAILY_TITLE).toBe('Gastos por dia');
    expect(home.DAILY_SUBTITLE).toBe('Passe o mouse sobre a barra para ver o valor');
    expect(home.CATEGORY_TITLE).toBe('Por categoria');
    expect(home.CATEGORY_TOP_CAPTION).toBe('maior gasto');
    expect(home.LATEST_TITLE).toBe('Últimas compras');
    expect(home.LATEST_SEE_ALL).toBe('Ver todas');
    expect(home.PAYMENT_TITLE).toBe('Formas de pagamento');
  });
});
