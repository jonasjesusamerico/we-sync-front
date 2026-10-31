import { BreakpointObserver } from '@angular/cdk/layout';
import { Location, registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  TestRequest,
} from '@angular/common/http/testing';
import localePt from '@angular/common/locales/pt';
import { ApplicationRef, ChangeDetectionStrategy, Component, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { throwError } from 'rxjs';

import { FakeBreakpointObserver } from '../../../../testing/fake-breakpoint-observer';
import { nativeSelect } from '../../../../testing/native-select';
import {
  GLOBAL_CATEGORIES,
  GLOBAL_PAYMENT_METHODS,
  page,
  purchase,
} from '../../../../testing/purchases-contract';
import { RefreshError } from '../../../core/auth/refresh-error';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import { MSG_CONNECTION, MSG_SERVER } from '../../../core/http/error-messages';
import { Notifier } from '../../../shared/notifier/notifier';
import {
  LABEL_CLEAR_FILTERS,
  LABEL_NEW_PURCHASE,
  LABEL_PREVIOUS_MONTH,
  LABEL_RETRY,
  MSG_DELETED,
} from '../purchase.messages';
import { Purchase, PurchasePage } from '../purchase.models';
import { PurchasesApi } from '../purchases.api';
import { PURCHASE_ROUTES } from '../purchases.routes';

registerLocaleData(localePt);

const BASE = '/api/v1';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class StubPage {}

describe('PurchaseListPage', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 22, 12, 0));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'lancamentos', children: PURCHASE_ROUTES },
          { path: '**', component: StubPage },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
        { provide: BreakpointObserver, useClass: FakeBreakpointObserver },
        { provide: LOCALE_ID, useValue: 'pt-BR' },
      ],
    });
    harness = await RouterTestingHarness.create();
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    http.verify();
    TestBed.inject(Notifier).dismiss();
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => el.remove());
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const settle = async () => {
    await harness.fixture.whenStable();
    await TestBed.inject(ApplicationRef).whenStable();
  };
  const root = () => harness.fixture.nativeElement as HTMLElement;
  const fake = () => TestBed.inject(BreakpointObserver) as unknown as FakeBreakpointObserver;

  async function open(url: string) {
    await harness.navigateByUrl(url);
    await settle();
  }

  const listRequests = () => http.match((r) => r.url === `${BASE}/purchases`);
  function listRequest(): TestRequest {
    const all = listRequests();
    expect(all).toHaveLength(1);
    return all[0];
  }
  const params = (req: TestRequest) =>
    Object.fromEntries(req.request.params.keys().map((k) => [k, req.request.params.get(k)]));

  function flushOptions() {
    http.expectOne(`${BASE}/categories`).flush(GLOBAL_CATEGORIES);
    http.expectOne(`${BASE}/payment-methods`).flush(GLOBAL_PAYMENT_METHODS);
  }

  /** Abre a URL e responde opções e lista. */
  async function openWith(url: string, result: PurchasePage, withOptions = true) {
    await open(url);
    if (withOptions) {
      flushOptions();
    }
    listRequest().flush(result);
    await settle();
  }

  const two = () =>
    page([purchase(), purchase({ id: 41, description: 'Padaria', purchase_date: '2026-10-04' })]);
  const many = (count: number, patch: Partial<PurchasePage> = {}): PurchasePage => {
    const items: Purchase[] = Array.from({ length: count }, (_, i) =>
      purchase({ id: 100 + i, description: `Item ${i + 1}` }),
    );
    return page(items, patch);
  };

  const dataRows = () => root().querySelectorAll('tbody tr');
  const spinner = () => root().querySelector('.spinner-border');
  const text = () => root().textContent ?? '';
  const button = (label: string) =>
    Array.from(root().querySelectorAll<HTMLElement>('button, a')).find(
      (b) => b.textContent?.trim() === label || b.getAttribute('aria-label') === label,
    );
  const dialog = () => document.querySelector('cdk-dialog-container') as HTMLElement | null;
  const dialogButton = (label: string) =>
    Array.from(dialog()?.querySelectorAll<HTMLButtonElement>('button') ?? []).find(
      (b) => b.textContent?.trim() === label,
    )!;

  it('sem mês → endereço canônico', async () => {
    await open('/lancamentos');
    expect(router.url).toBe('/lancamentos?ano=2026&mes=10');
    const req = listRequest();
    expect(params(req)).toEqual({ year: '2026', month: '10', page: '1', page_size: '20' });
    flushOptions();
    req.flush(page([]));
    await settle();
  });

  it('endereço inválido corrigido', async () => {
    await open('/lancamentos?mes=13&ano=2026&status=X');
    expect(router.url).toBe('/lancamentos?ano=2026&mes=10');
    const req = listRequest();
    expect(params(req)).toEqual({ year: '2026', month: '10', page: '1', page_size: '20' });
    flushOptions();
    req.flush(page([]));
    await settle();
  });

  it('carregando até tudo chegar', async () => {
    await open('/lancamentos?ano=2026&mes=10');
    listRequest().flush(two());
    await settle();
    expect(spinner()).not.toBeNull();
    expect(spinner()?.getAttribute('aria-label')).toBe('Carregando');
    expect(dataRows()).toHaveLength(0);
    expect(text()).not.toContain('Nenhum lançamento');
    // Barra de mês e "Novo lançamento" já aparecem; filtros só depois das opções.
    expect(root().querySelector('app-month-bar')).not.toBeNull();
    expect(button(LABEL_NEW_PURCHASE)).toBeDefined();
    expect(root().querySelector('app-purchase-filters')).toBeNull();
    flushOptions();
    await settle();
    expect(dataRows()).toHaveLength(2);
    expect(root().querySelector('app-purchase-filters')).not.toBeNull();
  });

  it('mostra a página', async () => {
    await openWith('/lancamentos?ano=2026&mes=10', two());
    expect(root().querySelector('table')).not.toBeNull();
    expect(dataRows()).toHaveLength(2);
    expect(root().querySelector('app-paginator')).toBeNull();
  });

  it('celular', async () => {
    fake().setWide(false);
    await openWith('/lancamentos?ano=2026&mes=10', two());
    expect(root().querySelector('app-purchase-items')).not.toBeNull();
    expect(root().querySelector('table')).toBeNull();
  });

  it('paginador', async () => {
    await openWith('/lancamentos?ano=2026&mes=10', many(20, { total: 47, total_pages: 3 }));
    expect(root().querySelector('.range-label')?.textContent?.trim()).toBe('1–20 de 47');
    button('Próxima página')!.click();
    await settle();
    expect(router.url).toBe('/lancamentos?ano=2026&mes=10&pagina=2');
    listRequest().flush(many(20, { total: 47, total_pages: 3, page: 2 }));
    await settle();
  });

  it('uma página só', async () => {
    await openWith('/lancamentos?ano=2026&mes=10', many(15));
    expect(root().querySelector('app-paginator')).toBeNull();
  });

  it('vazio sem filtro', async () => {
    await openWith('/lancamentos?ano=2026&mes=10', page([]));
    const empty = root().querySelector('[role="status"]');
    expect(empty?.textContent).toContain('Nenhum lançamento em outubro de 2026.');
    const link = empty?.querySelector('a');
    expect(link?.textContent?.trim()).toBe(LABEL_NEW_PURCHASE);
    expect(link?.getAttribute('href')).toBe('/lancamentos/novo');
  });

  it('vazio com filtro', async () => {
    await openWith('/lancamentos?ano=2026&mes=10&status=PENDING', page([]));
    const empty = root().querySelector<HTMLElement>('[role="status"]')!;
    expect(empty.textContent).toContain('Nenhum lançamento encontrado com esses filtros.');
    Array.from(empty.querySelectorAll('button'))
      .find((b) => b.textContent?.trim() === LABEL_CLEAR_FILTERS)!
      .click();
    await settle();
    expect(router.url).toBe('/lancamentos?ano=2026&mes=10');
    listRequest().flush(page([]));
    await settle();
  });

  it('mês anterior mantém filtros', async () => {
    await openWith('/lancamentos?ano=2026&mes=10&categoria=1&forma=4&pagina=2', two());
    button(LABEL_PREVIOUS_MONTH)!.click();
    await settle();
    expect(router.url).toBe('/lancamentos?ano=2026&mes=9&categoria=1&forma=4');
    listRequest().flush(two());
    await settle();
  });

  it('filtro volta à página 1', async () => {
    await openWith('/lancamentos?ano=2026&mes=10&pagina=2', many(20, { total: 47, page: 2 }));
    nativeSelect(root().querySelector('app-purchase-filters select')!).select('Pendente');
    await settle();
    expect(router.url).toBe('/lancamentos?ano=2026&mes=10&status=PENDING');
    listRequest().flush(page([]));
    await settle();
  });

  it('categoria inexistente', async () => {
    await open('/lancamentos?ano=2026&mes=10&categoria=999');
    flushOptions();
    listRequest().flush(page([]));
    await settle();
    expect(router.url).toBe('/lancamentos?ano=2026&mes=10');
    const req = listRequest();
    expect(req.request.params.has('category_id')).toBe(false);
    expect(http.match(`${BASE}/categories`)).toHaveLength(0);
    req.flush(two());
    await settle();
    expect(dataRows()).toHaveLength(2);
  });

  it('página além da última', async () => {
    await open('/lancamentos?ano=2026&mes=10&pagina=9');
    flushOptions();
    listRequest().flush(page([], { total: 47, total_pages: 3, page: 9 }));
    await settle();
    expect(router.url).toBe('/lancamentos?ano=2026&mes=10&pagina=3');
    const req = listRequest();
    expect(req.request.params.get('page')).toBe('3');
    req.flush(many(7, { total: 47, total_pages: 3, page: 3 }));
    await settle();
  });

  it('respostas fora de ordem', async () => {
    await openWith('/lancamentos?ano=2026&mes=10', two());
    await router.navigateByUrl('/lancamentos?ano=2026&mes=9');
    await settle();
    const september = listRequest();
    await router.navigateByUrl('/lancamentos?ano=2026&mes=8');
    await settle();
    expect(september.cancelled).toBe(true);
    const august = listRequest();
    expect(august.request.params.get('month')).toBe('8');
    august.flush(two());
    await settle();
  });

  it('opções uma vez por página', async () => {
    await openWith('/lancamentos?ano=2026&mes=10', two());
    for (const month of [9, 8]) {
      await router.navigateByUrl(`/lancamentos?ano=2026&mes=${month}`);
      await settle();
      listRequest().flush(two());
      await settle();
    }
    expect(http.match(`${BASE}/categories`)).toHaveLength(0);
    expect(http.match(`${BASE}/payment-methods`)).toHaveLength(0);
  });

  it('erro na carga', async () => {
    await open('/lancamentos?ano=2026&mes=10');
    http
      .expectOne(`${BASE}/categories`)
      .flush({ code: 'INTERNAL_SERVER_ERROR', message: 'x' }, { status: 500, statusText: 'Error' });
    await settle();
    // O forkJoin cancela as outras chamadas quando uma falha.
    http.match(`${BASE}/payment-methods`);
    listRequests();
    expect(root().querySelector('app-form-alert')?.textContent?.trim()).toBe(MSG_SERVER);
    button(LABEL_RETRY)!.click();
    await settle();
    flushOptions();
    listRequest().flush(two());
    await settle();
    expect(root().querySelector('app-form-alert')).toBeNull();
    expect(dataRows()).toHaveLength(2);
  });

  it('sem conexão', async () => {
    await open('/lancamentos?ano=2026&mes=10');
    flushOptions();
    listRequest().error(new ProgressEvent('error'), { status: 0 });
    await settle();
    expect(root().querySelector('app-form-alert')?.textContent?.trim()).toBe(MSG_CONNECTION);
    expect(button(LABEL_RETRY)).toBeDefined();
  });

  it('sessão acabou', async () => {
    vi.spyOn(TestBed.inject(PurchasesApi), 'list').mockReturnValue(
      throwError(() => new RefreshError('expired')),
    );
    await open('/lancamentos?ano=2026&mes=10');
    http.match(`${BASE}/categories`);
    http.match(`${BASE}/payment-methods`);
    await settle();
    expect(root().querySelector('app-form-alert')).toBeNull();
    expect(button(LABEL_RETRY)).toBeUndefined();
    expect(spinner()).toBeNull();
  });

  it('link de novo leva a origem', async () => {
    await openWith('/lancamentos?ano=2026&mes=9', two());
    const link = root().querySelector<HTMLAnchorElement>('a.new')!;
    expect(link.getAttribute('href')).toBe('/lancamentos/novo');
    link.click();
    await settle();
    expect(router.url).toBe('/lancamentos/novo');
    expect(TestBed.inject(Location).getState()).toMatchObject({
      origin: {
        year: 2026,
        month: 9,
        status: null,
        categoryId: null,
        paymentMethodId: null,
        page: 1,
      },
    });
    // O formulário (TF-11) carrega as próprias opções; não interessam aqui.
    http.match(() => true);
  });

  async function deleteFirst() {
    button('Excluir Mercado')!.click();
    await settle();
    expect(dialog()).not.toBeNull();
    dialogButton('Excluir').click();
    await settle();
    return http.expectOne((r) => r.method === 'DELETE' && r.url === `${BASE}/purchases/42`);
  }

  it('excluir', async () => {
    const open = vi.spyOn(TestBed.inject(Notifier), 'show');
    await openWith('/lancamentos?ano=2026&mes=10', two());
    const del = await deleteFirst();
    del.flush(null, { status: 204, statusText: 'No Content' });
    await settle();
    expect(open).toHaveBeenCalledWith(MSG_DELETED);
    const req = listRequest();
    expect(params(req)).toEqual({ year: '2026', month: '10', page: '1', page_size: '20' });
    req.flush(page([purchase({ id: 41, description: 'Padaria' })]));
    await settle();
    expect(dataRows()).toHaveLength(1);
  });

  it('excluir cancelado', async () => {
    await openWith('/lancamentos?ano=2026&mes=10', two());
    button('Excluir Mercado')!.click();
    await settle();
    dialogButton('Cancelar').click();
    await settle();
    expect(http.match((r) => r.method === 'DELETE')).toHaveLength(0);
    expect(listRequests()).toHaveLength(0);
  });

  it('excluir 404', async () => {
    const open = vi.spyOn(TestBed.inject(Notifier), 'show');
    await openWith('/lancamentos?ano=2026&mes=10', two());
    const del = await deleteFirst();
    del.flush(
      { code: 'NOT_FOUND', message: 'purchase not found' },
      { status: 404, statusText: 'NF' },
    );
    await settle();
    expect(open).toHaveBeenCalledWith(MSG_DELETED);
    listRequest().flush(page([]));
    await settle();
  });

  it('excluir o único da página 3', async () => {
    await openWith(
      '/lancamentos?ano=2026&mes=10&pagina=3',
      page([purchase()], { total: 41, total_pages: 3, page: 3 }),
    );
    const navigate = vi.spyOn(router, 'navigate');
    const del = await deleteFirst();
    del.flush(null, { status: 204, statusText: 'No Content' });
    await settle();
    expect(router.url).toBe('/lancamentos?ano=2026&mes=10&pagina=2');
    expect(navigate).toHaveBeenCalledWith(['/lancamentos'], {
      queryParams: { ano: '2026', mes: '10', pagina: '2' },
      replaceUrl: true,
    });
    listRequest().flush(many(20, { total: 40, total_pages: 2, page: 2 }));
    await settle();
  });

  it('excluir falha', async () => {
    await openWith('/lancamentos?ano=2026&mes=10', two());
    const del = await deleteFirst();
    del.flush({ code: 'INTERNAL_SERVER_ERROR', message: 'x' }, { status: 500, statusText: 'E' });
    await settle();
    expect(dialog()).not.toBeNull();
    expect(dialog()!.querySelector('app-form-alert')?.textContent?.trim()).toBe(MSG_SERVER);
    expect(listRequests()).toHaveLength(0);
    expect(dataRows()).toHaveLength(2);
  });

  it('cabeçalho', async () => {
    await openWith('/lancamentos?ano=2026&mes=10', two());
    expect(root().querySelector('h1')?.textContent?.trim()).toBe('Lançamentos');
  });
});
