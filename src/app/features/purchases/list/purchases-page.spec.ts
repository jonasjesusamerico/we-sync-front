import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  CATEGORIES_EXAMPLE,
  ERROR_INTERNAL,
  ERROR_PURCHASE_NOT_FOUND,
  PURCHASE_EXAMPLE,
  PURCHASE_LIST_EXAMPLE,
} from '../../../../testing/api-examples';
import { text, typeInto } from '../../../../testing/dom';
import { API, httpTestingProviders } from '../../../../testing/http';
import { settle } from '../../../../testing/session';
import { MSG_CONNECTION, MSG_SERVER } from '../../../core/http/error-messages';
import { TODAY } from '../../../core/navigation/today';
import { ICON_PATHS } from '../../../shared/ui/icon/icons';
import { ConfirmService } from '../../../shared/ui/confirm/confirm';
import { ToastService } from '../../../shared/ui/toast/toast';
import type { PaginatedPurchases, Purchase } from '../data/purchase.models';
import * as t from '../purchases.messages';
import { PurchasesPage } from './purchases-page';

@Component({ template: '<h1>Outra</h1>' })
class Blank {}

const NBSP = ' ';
const LIST_URL = `${API}/purchases`;

const page = (items: Purchase[], extra: Partial<PaginatedPurchases> = {}): PaginatedPurchases => ({
  items,
  total: items.length,
  total_amount: '1234.56',
  page: 1,
  page_size: 8,
  total_pages: items.length > 0 ? 1 : 0,
  ...extra,
});
const ONE = page([PURCHASE_EXAMPLE]);
const EMPTY = page([], { total_amount: '0' });

describe('PurchasesPage', () => {
  let http: HttpTestingController;
  let router: Router;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        ...httpTestingProviders(),
        { provide: TODAY, useValue: () => ({ year: 2026, month: 11, day: 10 }) },
        provideRouter([
          { path: 'compras', component: PurchasesPage },
          { path: 'compras/nova', component: Blank },
          { path: 'compras/:id', component: Blank },
        ]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  const stable = async () => {
    await settle();
    await harness.fixture.whenStable();
  };
  const root = () => harness.fixture.nativeElement as HTMLElement;
  const listRequests = () => http.match((r) => r.url === LIST_URL && r.method === 'GET');
  const listRequest = (): TestRequest => {
    const requests = listRequests();
    expect(requests, 'one GET /purchases').toHaveLength(1);
    return requests[0];
  };

  /** Opens the page and answers the categories and the list. */
  async function open(
    url: string,
    list: PaginatedPurchases = ONE,
    categories = CATEGORIES_EXAMPLE,
  ) {
    await router.navigateByUrl(url);
    await stable();
    http.expectOne(`${API}/categories`).flush(categories);
    const req = listRequest();
    req.flush(list);
    await stable();
    return req;
  }

  const rows = () => Array.from(root().querySelectorAll<HTMLTableRowElement>('#rows tr'));
  const cards = () => Array.from(root().querySelectorAll<HTMLLIElement>('#cards li'));
  const button = (label: string) =>
    Array.from(root().querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => text(b) === label || b.getAttribute('aria-label') === label,
    );
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  it('abre no mês atual', async () => {
    const navigate = vi.spyOn(router, 'navigate');
    await router.navigateByUrl('/compras');
    await stable();
    expect(router.url).toBe('/compras?ano=2026&mes=11');
    expect(navigate.mock.calls[0][1]).toMatchObject({ replaceUrl: true });
    http.expectOne(`${API}/categories`).flush(CATEGORIES_EXAMPLE);
    const req = listRequest();
    expect(req.request.urlWithParams).toBe(`${LIST_URL}?year=2026&month=11&page=1&page_size=8`);
    req.flush(ONE);
    await stable();
    expect(text(root().querySelector('h1'))).toBe('Compras');
    expect(text(root().querySelector('.ws-month-label'))).toBe('novembro 2026');
  });

  it('resumo', async () => {
    await open('/compras?ano=2026&mes=9&pagina=2', PURCHASE_LIST_EXAMPLE);
    expect(text(root().querySelector('#summary'))).toBe('11 compras · R$ 263,40 no total');
  });

  it('ordem da resposta', async () => {
    const second = { ...PURCHASE_EXAMPLE, id: 7, description: 'Uber' };
    await open('/compras?ano=2026&mes=11', page([second, PURCHASE_EXAMPLE]));
    expect(rows().map((r) => text(r.querySelector('a')))).toEqual(['Uber', 'Padária São João']);
    expect(cards().map((c) => text(c.querySelector('.ws-tx-title')))).toEqual([
      'Uber',
      'Padária São João',
    ]);
  });

  it('linha', async () => {
    await open('/compras?ano=2026&mes=11');
    const [row] = rows();
    const bubble = row.querySelector<HTMLElement>('ws-category-bubble')!;
    expect(bubble.style.getPropertyValue('--cat')).toBe('var(--ws-cat-food)');
    expect(bubble.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS.food);
    const link = row.querySelector('a')!;
    expect(text(link)).toBe('Padária São João');
    expect(link.getAttribute('href')).toBe('/compras/42');
    const cells = Array.from(row.querySelectorAll('td')).map(text);
    expect(text(row.querySelector('td .small'))).toBe('Alimentação');
    expect(cells.slice(1, 5)).toEqual(['05/11/2026', 'Pix', 'Paga', 'R$ 1.234,56']);
    expect(row.querySelector('[aria-label="Editar Padária São João"]')!.tagName).toBe('A');
    expect(row.querySelector('[aria-label="Excluir Padária São João"]')!.tagName).toBe('BUTTON');
    expect(root().querySelector('.ws-table-wrap')!.classList).toContain('d-md-block');
  });

  it('cartão do celular', async () => {
    await open('/compras?ano=2026&mes=11');
    const [card] = cards();
    expect(card.classList).toContain('position-relative');
    expect(text(card.querySelector('.ws-tx-meta'))).toBe('05 nov · Pix');
    expect(text(card.querySelector('.ws-tx-amount'))).toBe('R$ 1.234,56');
    expect(text(card.querySelector('.ws-status'))).toBe('Paga');
    const links = card.querySelectorAll('a, button');
    expect(links).toHaveLength(1);
    expect(links[0].classList).toContain('stretched-link');
    expect(root().querySelector('#cards')!.classList).toContain('d-md-none');
  });

  it('cancelada', async () => {
    await open('/compras?ano=2026&mes=11', page([{ ...PURCHASE_EXAMPLE, status: 'CANCELED' }]));
    const [row] = rows();
    expect(row.classList).toContain('is-canceled');
    expect(cards()[0].classList).toContain('is-canceled');
    expect(text(row.querySelector('.ws-status.is-canceled'))).toBe('Cancelada');
    const amount = row.querySelector('td.is-num')!;
    expect(amount.classList).toContain('text-decoration-line-through');
    expect(amount.classList).toContain('text-muted');
  });

  it('descrição longa', async () => {
    const long = 'a'.repeat(200);
    await open('/compras?ano=2026&mes=11', page([{ ...PURCHASE_EXAMPLE, description: long }]));
    const link = rows()[0].querySelector('a')!;
    expect(link.getAttribute('title')).toBe(long);
    expect(text(link)).toBe(long);
    expect(link.classList).toContain('text-truncate');
    expect(cards()[0].querySelector('a')!.getAttribute('title')).toBe(long);
  });

  it('paginador', async () => {
    await open('/compras?ano=2026&mes=11', page([PURCHASE_EXAMPLE], { total: 20, total_pages: 3 }));
    expect(text(root().querySelector('.ws-pager > span'))).toBe('Página 1 de 3');
    button('Próxima')!.click();
    await stable();
    expect(router.url).toBe('/compras?ano=2026&mes=11&pagina=2');
    listRequest().flush(page([PURCHASE_EXAMPLE], { total: 20, page: 2, total_pages: 3 }));
  });

  it('sem paginador com uma página', async () => {
    await open('/compras?ano=2026&mes=11');
    expect(root().querySelector('ws-paginator')).toBeNull();
  });

  it('busca: 300 ms, página 1 e replaceUrl', async () => {
    await open('/compras?ano=2026&mes=11&pagina=2');
    const navigate = vi.spyOn(router, 'navigate');
    typeInto(root().querySelector<HTMLInputElement>('#f-search')!, 'padaria');
    await wait(150);
    expect(navigate).not.toHaveBeenCalled();
    await wait(250);
    await stable();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0][1]).toMatchObject({
      replaceUrl: true,
      queryParams: { ano: '2026', mes: '11', busca: 'padaria' },
    });
    const req = listRequest();
    expect(req.request.params.get('q')).toBe('padaria');
    req.flush(ONE);
  });

  it('busca antiga não aparece', async () => {
    await open('/compras?ano=2026&mes=11');
    const search = root().querySelector<HTMLInputElement>('#f-search')!;
    typeInto(search, 'pad');
    await wait(350);
    await stable();
    const old = listRequest();
    typeInto(search, 'padaria');
    await wait(350);
    await stable();
    const current = http.match((r) => r.url === LIST_URL && r.params.get('q') === 'padaria');
    expect(old.cancelled).toBe(true);
    current[0].flush(page([{ ...PURCHASE_EXAMPLE, description: 'Padaria nova' }]));
    await stable();
    expect(rows().map((r) => text(r.querySelector('a')))).toEqual(['Padaria nova']);
  });

  it('busca só com espaços', async () => {
    await open('/compras?ano=2026&mes=11&busca=uber');
    typeInto(root().querySelector<HTMLInputElement>('#f-search')!, '   ');
    await wait(350);
    await stable();
    expect(router.url).toBe('/compras?ano=2026&mes=11');
    listRequest().flush(ONE);
  });

  it('trocar mês mantém filtros', async () => {
    await open('/compras?ano=2026&mes=11&busca=uber&categoria=31&pagina=2');
    button('Próximo mês')!.click();
    await stable();
    expect(router.url).toBe('/compras?ano=2026&mes=12&busca=uber&categoria=31');
    listRequest().flush(ONE);
  });

  it('situação', async () => {
    await open('/compras?ano=2026&mes=11');
    const chips = Array.from(root().querySelectorAll<HTMLLabelElement>('#f-status label'));
    expect(chips.map(text)).toEqual(['Todas', 'Paga', 'Pendente', 'Cancelada']);
    expect(root().querySelector<HTMLInputElement>('#st-0')!.checked).toBe(true);
    chips[3].click();
    await stable();
    expect(router.url).toBe('/compras?ano=2026&mes=11&situacao=cancelada');
    const req = listRequest();
    expect(req.request.params.get('status')).toBe('CANCELED');
    req.flush(ONE);
    await stable();
    expect(root().querySelector<HTMLInputElement>('#st-3')!.checked).toBe(true);
  });

  it('limpar filtros', async () => {
    await open('/compras?ano=2026&mes=11&busca=uber&categoria=1&situacao=paga');
    expect(root().querySelector<HTMLInputElement>('#f-search')!.value).toBe('uber');
    button(t.LABEL_CLEAR_FILTERS)!.click();
    await stable();
    expect(router.url).toBe('/compras?ano=2026&mes=11');
    listRequest().flush(ONE);
    await stable();
    expect(root().querySelector<HTMLInputElement>('#f-search')!.value).toBe('');
    expect(button(t.LABEL_CLEAR_FILTERS)).toBeUndefined();
  });

  it('categoria alheia sai do endereço', async () => {
    const navigate = vi.spyOn(router, 'navigate');
    await open('/compras?ano=2026&mes=11&categoria=999', EMPTY);
    expect(router.url).toBe('/compras?ano=2026&mes=11');
    expect(navigate.mock.calls.at(-1)![1]).toMatchObject({ replaceUrl: true });
    listRequest().flush(ONE);
  });

  it('página além da última', async () => {
    const navigate = vi.spyOn(router, 'navigate');
    await open(
      '/compras?ano=2026&mes=11&pagina=5',
      page([], { total: 11, total_pages: 2, page: 5 }),
    );
    expect(router.url).toBe('/compras?ano=2026&mes=11&pagina=2');
    expect(navigate.mock.calls.at(-1)![1]).toMatchObject({ replaceUrl: true });
    listRequest().flush(page([PURCHASE_EXAMPLE], { total: 11, total_pages: 2, page: 2 }));
  });

  it('página com lista vazia volta à 1', async () => {
    await open('/compras?ano=2026&mes=11&pagina=3', EMPTY);
    expect(router.url).toBe('/compras?ano=2026&mes=11');
    listRequest().flush(EMPTY);
  });

  it('vazio sem filtro', async () => {
    await open('/compras?ano=2026&mes=11', EMPTY);
    const empty = root().querySelector('.ws-empty')!;
    expect(text(empty.querySelector('.fw-bold'))).toBe('Nenhuma compra em novembro de 2026.');
    expect(empty.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS.receipt);
    const link = empty.querySelector('a.btn-primary')!;
    expect(text(link)).toBe('Nova compra');
    expect(link.getAttribute('href')).toBe('/compras/nova');
    expect(root().querySelector('ws-paginator')).toBeNull();
    expect(root().querySelector('#rows')).toBeNull();
    expect(text(root().querySelector('#summary'))).toBe('0 compras · R$ 0,00 no total');
  });

  it('vazio com filtro', async () => {
    await open('/compras?ano=2026&mes=11&busca=xyz', EMPTY);
    const empty = root().querySelector('.ws-empty')!;
    expect(Array.from(empty.children).map(text)).toEqual([
      '',
      'Nenhuma compra encontrada',
      'Tente mudar os filtros ou o mês.',
      'Limpar filtros',
    ]);
    expect(empty.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS.search);
  });

  it('filtro com arquivadas', async () => {
    await open('/compras?ano=2026&mes=11&categoria=31');
    const options = Array.from(root().querySelectorAll<HTMLOptionElement>('#f-category option'));
    expect(options.map(text)).toEqual([
      'Todas',
      'Alimentação',
      'Transporte',
      'Moradia',
      'Saúde',
      'Educação',
      'Lazer',
      'Bar',
      'Pets',
      'Academia (arquivada)',
    ]);
    expect(root().querySelector<HTMLSelectElement>('#f-category')!.value).toBe('31');
  });

  it('bolha da API', async () => {
    const animais: Purchase = {
      ...PURCHASE_EXAMPLE,
      category: { id: 31, name: 'Animais', is_global: false, icon: 'HOUSE', color: 'HOME' },
    };
    await open('/compras?ano=2026&mes=11', page([animais]));
    for (const bubble of [
      rows()[0].querySelector<HTMLElement>('ws-category-bubble')!,
      cards()[0].querySelector<HTMLElement>('ws-category-bubble')!,
    ]) {
      expect(bubble.style.getPropertyValue('--cat')).toBe('var(--ws-cat-home)');
      expect(bubble.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS.house);
    }
  });

  it('filtro por arquivada', async () => {
    const req = await open('/compras?ano=2026&mes=11&categoria=32');
    expect(req.request.params.get('category_id')).toBe('32');
    expect(router.url).toBe('/compras?ano=2026&mes=11&categoria=32');
    const select = root().querySelector<HTMLSelectElement>('#f-category')!;
    expect(select.value).toBe('32');
    expect(text(select.selectedOptions[0])).toBe('Academia (arquivada)');
  });

  it('escolher categoria', async () => {
    await open('/compras?ano=2026&mes=11&pagina=2');
    const select = root().querySelector<HTMLSelectElement>('#f-category')!;
    select.value = '2';
    select.dispatchEvent(new Event('change'));
    await stable();
    expect(router.url).toBe('/compras?ano=2026&mes=11&categoria=2');
    const req = listRequest();
    expect(req.request.params.get('category_id')).toBe('2');
    req.flush(ONE);
  });

  it('clique na linha abre a edição com a origem', async () => {
    await open('/compras?ano=2026&mes=11');
    (rows()[0].querySelectorAll('td')[1] as HTMLElement).click();
    await stable();
    expect(router.url).toBe('/compras/42');
    expect(router.lastSuccessfulNavigation()?.extras.state).toEqual({
      wsOrigin: {
        screen: 'compras',
        query: { year: 2026, month: 11, search: '', categoryId: null, status: null, page: 1 },
      },
    });
  });

  it('lixeira não abre a edição', async () => {
    await open('/compras?ano=2026&mes=11');
    const ask = vi.spyOn(TestBed.inject(ConfirmService), 'ask').mockResolvedValue(false);
    button('Excluir Padária São João')!.click();
    await stable();
    expect(ask).toHaveBeenCalledTimes(1);
    expect(ask.mock.calls[0][0]).toMatchObject({
      title: 'Excluir compra?',
      icon: 'trash',
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      lines: [
        'Padária São João',
        `05/11/2026 · R$${NBSP}1.234,56`,
        'Esta ação não pode ser desfeita.',
      ],
    });
    expect(router.url).toBe('/compras?ano=2026&mes=11');
  });

  describe('excluir', () => {
    async function deleteWith(respond: (req: TestRequest) => void) {
      await open('/compras?ano=2026&mes=11');
      const confirm = TestBed.inject(ConfirmService);
      button('Excluir Padária São João')!.click();
      await stable();
      confirm.confirm();
      const req = http.expectOne(`${API}/purchases/42`);
      expect(req.request.method).toBe('DELETE');
      respond(req);
      await stable();
      return { confirm, toast: TestBed.inject(ToastService) };
    }

    it('204: aviso e nova carga', async () => {
      const { toast } = await deleteWith((req) =>
        req.flush(null, { status: 204, statusText: 'No Content' }),
      );
      expect(toast.current()?.text).toBe('Compra excluída');
      listRequest().flush(EMPTY);
    });

    it('404 conta como excluída', async () => {
      const { toast } = await deleteWith((req) =>
        req.flush(ERROR_PURCHASE_NOT_FOUND, { status: 404, statusText: 'Not Found' }),
      );
      expect(toast.current()?.text).toBe('Compra excluída');
      listRequest().flush(EMPTY);
    });

    it('falha fica no modal', async () => {
      const { confirm, toast } = await deleteWith((req) =>
        req.flush(ERROR_INTERNAL, { status: 500, statusText: 'x' }),
      );
      expect(confirm.error()).toBe(MSG_SERVER);
      expect(confirm.active()).not.toBeNull();
      expect(toast.current()).toBeNull();
      expect(listRequests()).toHaveLength(0);
      confirm.cancel();
    });
  });

  it('erro da lista e Tentar novamente', async () => {
    await router.navigateByUrl('/compras?ano=2026&mes=11');
    await stable();
    http.expectOne(`${API}/categories`).flush(CATEGORIES_EXAMPLE);
    listRequest().error(new ProgressEvent('error'));
    await stable();
    const list = root().querySelector('section[aria-label="Lista de compras"]')!;
    expect(text(list.querySelector('[role="alert"] .fw-bold'))).toBe(MSG_CONNECTION);
    expect(text(root().querySelector('#summary'))).toBe('');
    (list.querySelector('[role="alert"] button') as HTMLButtonElement).click();
    await stable();
    listRequest().flush(ONE);
    await stable();
    expect(rows()).toHaveLength(1);
  });

  it('erro das categorias só no cartão de filtros', async () => {
    await router.navigateByUrl('/compras?ano=2026&mes=11&categoria=31');
    await stable();
    http.expectOne(`${API}/categories`).flush(ERROR_INTERNAL, { status: 500, statusText: 'x' });
    const req = listRequest();
    expect(req.request.params.get('category_id')).toBe('31');
    req.flush(ONE);
    await stable();
    const filters = root().querySelector('section[aria-label="Filtros"]')!;
    expect(text(filters.querySelector('[role="alert"] .fw-bold'))).toBe(MSG_SERVER);
    expect(filters.querySelector('#f-search')).toBeNull();
    expect(rows()).toHaveLength(1);
    expect(router.url).toBe('/compras?ano=2026&mes=11&categoria=31');
    (filters.querySelector('[role="alert"] button') as HTMLButtonElement).click();
    await stable();
    http.expectOne(`${API}/categories`).flush(CATEGORIES_EXAMPLE);
    await stable();
    expect(filters.querySelector('#f-search')).not.toBeNull();
  });
});
