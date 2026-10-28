import { NAV_ITEMS } from './nav-items';

describe('NAV_ITEMS', () => {
  it('um item no menu', () => {
    expect(NAV_ITEMS).toEqual([{ path: '/', label: 'Início', icon: 'home' }]);
  });
});
