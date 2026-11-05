import { BOTTOM_NAV_KEYS, NAV_GROUP_ORDER, NAV_ITEMS } from './nav-items';

describe('nav-items (itens do menu)', () => {
  it('follows RF-03 and RF-04', () => {
    expect(NAV_ITEMS.map((i) => [i.group, i.label, i.icon])).toEqual([
      ['Menu', 'Início', 'home'],
      ['Menu', 'Compras', 'receipt'],
      ['Menu', 'Nossa casa', 'users'],
      ['Planejamento', 'Metas e relatórios', 'target'],
      ['Planejamento', 'Investimentos', 'trendUp'],
      ['Administração', 'Configurações', 'sliders'],
    ]);
    expect(NAV_ITEMS.filter((i) => !i.soon).map((i) => i.key)).toEqual([
      'inicio',
      'compras',
      'configuracoes',
    ]);
    expect(NAV_ITEMS.filter((i) => i.soon).map((i) => i.key)).toEqual([
      'casa',
      'metas',
      'investimentos',
    ]);
    expect(NAV_ITEMS.find((i) => i.key === 'configuracoes')!.route).toBe('/configuracoes');
    expect(NAV_ITEMS.find((i) => i.key === 'inicio')!.route).toBe('/inicio');
    expect(NAV_ITEMS.find((i) => i.key === 'compras')!.route).toBe('/compras');
    expect(NAV_ITEMS.filter((i) => i.route).map((i) => i.key)).toEqual([
      'inicio',
      'compras',
      'configuracoes',
    ]);
    expect(NAV_GROUP_ORDER).toEqual(['Menu', 'Planejamento', 'Administração']);
    expect(BOTTOM_NAV_KEYS).toEqual(['inicio', 'compras', 'casa', 'configuracoes']);
    const short = BOTTOM_NAV_KEYS.map((k) => NAV_ITEMS.find((i) => i.key === k)!.shortLabel);
    expect(short).toEqual(['Início', 'Compras', 'Casa', 'Ajustes']);
  });
});
