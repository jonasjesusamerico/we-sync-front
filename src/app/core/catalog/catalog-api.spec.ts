import { HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import {
  CATEGORIES_EXAMPLE,
  ERROR_NAME_CONFLICT,
  PAYMENT_METHODS_EXAMPLE,
} from '../../../testing/api-examples';
import { API, httpTestingProviders } from '../../../testing/http';
import { apiErrorCode } from '../http/http-error';
import { CatalogApi } from './catalog-api';

describe('CatalogApi', () => {
  let http: HttpTestingController;
  let api: CatalogApi;

  const pets = CATEGORIES_EXAMPLE.find((c) => c.id === 31)!;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: httpTestingProviders() });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(CatalogApi);
  });

  afterEach(() => http.verify());

  it('lista com arquivadas', async () => {
    const result = firstValueFrom(api.categories());
    const req = http.expectOne(`${API}/categories`);
    expect(req.request.method).toBe('GET');
    req.flush(CATEGORIES_EXAMPLE);
    const list = await result;
    expect(list).toEqual(CATEGORIES_EXAMPLE);
    expect(list).toHaveLength(9);
    expect(list.find((c) => c.name === 'Academia')?.archived_at).not.toBeNull();
  });

  it('formas de pagamento', async () => {
    const result = firstValueFrom(api.paymentMethods());
    const req = http.expectOne(`${API}/payment-methods`);
    expect(req.request.method).toBe('GET');
    req.flush(PAYMENT_METHODS_EXAMPLE);
    expect(await result).toEqual(PAYMENT_METHODS_EXAMPLE);
  });

  it('cria e devolve 201', async () => {
    const body = { name: 'Pets', icon: 'HEART', color: 'LEISURE' } as const;
    const result = firstValueFrom(api.createCategory(body));
    const req = http.expectOne(`${API}/categories`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(pets, { status: 201, statusText: 'Created' });
    expect(await result).toEqual({ item: pets, reactivated: false });
  });

  it('reativa com 200', async () => {
    const result = firstValueFrom(
      api.createCategory({ name: 'Pets', icon: 'HEART', color: 'LEISURE' }),
    );
    http.expectOne(`${API}/categories`).flush(pets, { status: 200, statusText: 'OK' });
    expect(await result).toEqual({ item: pets, reactivated: true });
  });

  it('forma sem ícone', async () => {
    const created = PAYMENT_METHODS_EXAMPLE.find((p) => p.id === 40)!;
    const result = firstValueFrom(api.createPaymentMethod({ name: 'Vale-refeição' }));
    const req = http.expectOne(`${API}/payment-methods`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Vale-refeição' });
    req.flush(created, { status: 201, statusText: 'Created' });
    expect(await result).toEqual({ item: created, reactivated: false });
  });

  it('edita', async () => {
    const body = { name: 'Pets', icon: 'HOUSE', color: 'HOME' } as const;
    const result = firstValueFrom(api.updateCategory(31, body));
    const req = http.expectOne(`${API}/categories/31`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush({ ...pets, ...body });
    expect((await result).icon).toBe('HOUSE');
  });

  it('edita forma', async () => {
    const result = firstValueFrom(api.updatePaymentMethod(40, { name: 'VR' }));
    const req = http.expectOne(`${API}/payment-methods/40`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'VR' });
    req.flush({ ...PAYMENT_METHODS_EXAMPLE[7], name: 'VR' });
    expect((await result).name).toBe('VR');
  });

  it('arquiva e reativa', async () => {
    const archived = firstValueFrom(api.archive('payment', 41), { defaultValue: undefined });
    const put = http.expectOne(`${API}/payment-methods/41/archive`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toBeNull();
    put.flush(null, { status: 204, statusText: 'No Content' });
    await archived;

    const reactivated = firstValueFrom(api.unarchive('category', 32), { defaultValue: undefined });
    const del = http.expectOne(`${API}/categories/32/archive`);
    expect(del.request.method).toBe('DELETE');
    del.flush(null, { status: 204, statusText: 'No Content' });
    await reactivated;
  });

  it('erro passa', async () => {
    const result = firstValueFrom(api.createCategory({ name: 'pets', icon: 'TAG', color: 'FOOD' }));
    http
      .expectOne(`${API}/categories`)
      .flush(ERROR_NAME_CONFLICT, { status: 409, statusText: 'Conflict' });
    const error: unknown = await result.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect(apiErrorCode(error)).toBe('NAME_CONFLICT');
  });
});
