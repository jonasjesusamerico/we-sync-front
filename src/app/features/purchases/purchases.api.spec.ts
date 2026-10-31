import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import {
  CONTRACT_PAGE,
  CONTRACT_PURCHASE,
  CONTRACT_REQUEST,
} from '../../../testing/purchases-contract';
import { API_BASE_URL } from '../../core/http/api-base-url';
import { PurchasesApi } from './purchases.api';

describe('PurchasesApi', () => {
  let api: PurchasesApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });
    api = TestBed.inject(PurchasesApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list manda a query do contrato', () => {
    const next = vi.fn();
    api
      .list({
        year: 2026,
        month: 9,
        status: 'PENDING',
        categoryId: null,
        paymentMethodId: null,
        page: 2,
      })
      .subscribe(next);

    const req = http.expectOne((r) => r.url === '/api/v1/purchases');
    expect(req.request.method).toBe('GET');
    const params = req.request.params;
    expect(params.keys().sort()).toEqual(['month', 'page', 'page_size', 'status', 'year']);
    expect(params.get('year')).toBe('2026');
    expect(params.get('month')).toBe('9');
    expect(params.get('status')).toBe('PENDING');
    expect(params.get('page')).toBe('2');
    expect(params.get('page_size')).toBe('20');
    expect(params.has('category_id')).toBe(false);
    expect(params.has('payment_method_id')).toBe(false);
    req.flush(CONTRACT_PAGE);

    expect(next).toHaveBeenCalledWith(CONTRACT_PAGE);
  });

  it('get', () => {
    const next = vi.fn();
    api.get('42').subscribe(next);
    const req = http.expectOne('/api/v1/purchases/42');
    expect(req.request.method).toBe('GET');
    req.flush(CONTRACT_PURCHASE);
    expect(next).toHaveBeenCalledWith(CONTRACT_PURCHASE);
  });

  it('create manda o corpo', () => {
    const next = vi.fn();
    api.create(CONTRACT_REQUEST).subscribe(next);
    const req = http.expectOne('/api/v1/purchases');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(CONTRACT_REQUEST);
    req.flush(CONTRACT_PURCHASE, { status: 201, statusText: 'Created' });
    expect(next).toHaveBeenCalledWith(CONTRACT_PURCHASE);
  });

  it('update', () => {
    const next = vi.fn();
    api.update('42', CONTRACT_REQUEST).subscribe(next);
    const req = http.expectOne('/api/v1/purchases/42');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(CONTRACT_REQUEST);
    req.flush(CONTRACT_PURCHASE);
    expect(next).toHaveBeenCalledWith(CONTRACT_PURCHASE);
  });

  it('remove 204', () => {
    const complete = vi.fn();
    const error = vi.fn();
    api.remove('42').subscribe({ complete, error });
    const req = http.expectOne('/api/v1/purchases/42');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(complete).toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it('remove 404 é sucesso', () => {
    const complete = vi.fn();
    const error = vi.fn();
    api.remove('42').subscribe({ complete, error });
    http
      .expectOne('/api/v1/purchases/42')
      .flush(
        { code: 'NOT_FOUND', message: 'purchase not found' },
        { status: 404, statusText: 'Not Found' },
      );
    expect(complete).toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it('remove 500 propaga', () => {
    const error = vi.fn();
    api.remove('42').subscribe({ error });
    http
      .expectOne('/api/v1/purchases/42')
      .flush(
        { code: 'INTERNAL_SERVER_ERROR', message: 'internal server error' },
        { status: 500, statusText: 'Internal Server Error' },
      );
    expect(error).toHaveBeenCalledTimes(1);
    const e = error.mock.calls[0][0] as HttpErrorResponse;
    expect(e).toBeInstanceOf(HttpErrorResponse);
    expect(e.status).toBe(500);
  });
});
