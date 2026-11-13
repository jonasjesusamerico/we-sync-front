import { HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import {
  ERROR_INTERNAL,
  OVERVIEW_EXAMPLE,
  PURCHASE_EXAMPLE,
  PURCHASE_LIST_EXAMPLE,
  PURCHASE_REQUEST_EXAMPLE,
  SUMMARY_UNTIL_DAY_EXAMPLE,
} from '../../../../testing/api-examples';
import { API, httpTestingProviders } from '../../../../testing/http';
import { PurchasesApi } from './purchases-api';

describe('PurchasesApi', () => {
  let http: HttpTestingController;
  let api: PurchasesApi;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: httpTestingProviders() });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(PurchasesApi);
  });

  afterEach(() => http.verify());

  it('list envia a query, só com as chaves definidas', async () => {
    const result = firstValueFrom(
      api.list({ year: 2026, month: 9, page: 2, page_size: 8, q: 'uber', status: 'PENDING' }),
    );
    const req = http.expectOne(
      `${API}/purchases?year=2026&month=9&page=2&page_size=8&q=uber&status=PENDING`,
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('category_id')).toBe(false);
    req.flush(PURCHASE_LIST_EXAMPLE);
    expect(await result).toEqual(PURCHASE_LIST_EXAMPLE);
  });

  it('list envia category_id quando ativo', () => {
    api.list({ year: 2026, month: 9, page: 1, page_size: 8, category_id: 31 }).subscribe();
    http
      .expectOne(`${API}/purchases?year=2026&month=9&page=1&page_size=8&category_id=31`)
      .flush(PURCHASE_LIST_EXAMPLE);
  });

  it('list codifica ; & + = ? # % na busca (o Go descarta pares com ;)', () => {
    api.list({ year: 2026, month: 9, page: 1, page_size: 8, q: 'a;b&c+d=e?f#g%h' }).subscribe();
    const req = http.expectOne((r) => r.url === `${API}/purchases`);
    expect(req.request.urlWithParams).toBe(
      `${API}/purchases?year=2026&month=9&page=1&page_size=8&q=a%3Bb%26c%2Bd%3De%3Ff%23g%25h`,
    );
    expect(req.request.params.get('q')).toBe('a;b&c+d=e?f#g%h');
    req.flush(PURCHASE_LIST_EXAMPLE);
  });

  it.each([
    ['sem total_amount', { ...PURCHASE_LIST_EXAMPLE, total_amount: undefined }],
    ['total_amount número', { ...PURCHASE_LIST_EXAMPLE, total_amount: 263.4 }],
    ['items null', { ...PURCHASE_LIST_EXAMPLE, items: null }],
    ['corpo vazio', null],
  ])('list %s → erro com status 500 (instância antiga, DAS 7)', async (_name, body) => {
    const result = firstValueFrom(api.list({ year: 2026, month: 9, page: 1, page_size: 8 }));
    http.expectOne((r) => r.url === `${API}/purchases`).flush(body);
    const error: unknown = await result.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect((error as HttpErrorResponse).status).toBe(500);
  });

  it('summary', async () => {
    const result = firstValueFrom(api.summary(2026, 11, '2026-11-10'));
    const req = http.expectOne(`${API}/purchases/summary?year=2026&month=11&today=2026-11-10`);
    expect(req.request.method).toBe('GET');
    req.flush(SUMMARY_UNTIL_DAY_EXAMPLE);
    expect(await result).toEqual(SUMMARY_UNTIL_DAY_EXAMPLE);
  });

  it('overview com os parâmetros', async () => {
    const result = firstValueFrom(api.overview(2026, 11, '2026-11-10'));
    const req = http.expectOne(`${API}/purchases/overview?year=2026&month=11&today=2026-11-10`);
    expect(req.request.method).toBe('GET');
    req.flush(OVERVIEW_EXAMPLE);
    expect(await result).toEqual(OVERVIEW_EXAMPLE);
  });

  it.each([
    ['{ items: [] }', { items: [] }],
    ['corpo vazio', null],
    ['sem latest', { ...OVERVIEW_EXAMPLE, latest: undefined }],
    ['spent número', { ...OVERVIEW_EXAMPLE, spent: 1200 }],
  ])('overview com resposta inesperada (%s) → erro com status 500', async (_name, body) => {
    const result = firstValueFrom(api.overview(2026, 11, '2026-11-10'));
    http.expectOne((r) => r.url === `${API}/purchases/overview`).flush(body);
    const error: unknown = await result.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect((error as HttpErrorResponse).status).toBe(500);
  });

  it('overview: erro 500 passa', async () => {
    const result = firstValueFrom(api.overview(2026, 11, '2026-11-10'));
    http
      .expectOne((r) => r.url === `${API}/purchases/overview`)
      .flush(ERROR_INTERNAL, { status: 500, statusText: 'Internal Server Error' });
    const error: unknown = await result.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect((error as HttpErrorResponse).status).toBe(500);
    expect((error as HttpErrorResponse).error).toEqual(ERROR_INTERNAL);
  });

  it('overview: sem conexão (status 0) passa', async () => {
    const result = firstValueFrom(api.overview(2026, 11, '2026-11-10'));
    http.expectOne((r) => r.url === `${API}/purchases/overview`).error(new ProgressEvent('error'));
    const error: unknown = await result.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect((error as HttpErrorResponse).status).toBe(0);
  });

  it('get', async () => {
    const result = firstValueFrom(api.get('42'));
    const req = http.expectOne(`${API}/purchases/42`);
    expect(req.request.method).toBe('GET');
    req.flush(PURCHASE_EXAMPLE);
    expect(await result).toEqual(PURCHASE_EXAMPLE);
  });

  it('create', async () => {
    const result = firstValueFrom(api.create(PURCHASE_REQUEST_EXAMPLE));
    const req = http.expectOne(`${API}/purchases`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(PURCHASE_REQUEST_EXAMPLE);
    req.flush(PURCHASE_EXAMPLE, { status: 201, statusText: 'Created' });
    expect(await result).toEqual(PURCHASE_EXAMPLE);
  });

  it('update', async () => {
    const result = firstValueFrom(api.update('42', PURCHASE_REQUEST_EXAMPLE));
    const req = http.expectOne(`${API}/purchases/42`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(PURCHASE_REQUEST_EXAMPLE);
    req.flush(PURCHASE_EXAMPLE);
    expect(await result).toEqual(PURCHASE_EXAMPLE);
  });

  it('remove completa com 204', async () => {
    let completed = false;
    const done = new Promise<void>((resolve) =>
      api.remove('42').subscribe({
        complete: () => {
          completed = true;
          resolve();
        },
      }),
    );
    const req = http.expectOne(`${API}/purchases/42`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await done;
    expect(completed).toBe(true);
  });
});
