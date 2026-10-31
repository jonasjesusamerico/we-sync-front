import { NAV_ITEMS } from './nav-items';

describe('NAV_ITEMS', () => {
  it('dois itens no menu', () => {
    const ignored = { queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored' };
    expect(NAV_ITEMS).toEqual([
      { path: '/', label: 'Início', icon: 'home', match: { paths: 'exact', ...ignored } },
      {
        path: '/lancamentos',
        label: 'Lançamentos',
        icon: 'receipt_long',
        match: { paths: 'subset', ...ignored },
      },
    ]);
  });
});
