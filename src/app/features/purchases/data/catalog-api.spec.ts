import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { CATEGORIES_EXAMPLE, PAYMENT_METHODS_EXAMPLE } from '../../../../testing/api-examples';
import { API, httpTestingProviders } from '../../../../testing/http';
import { CatalogApi } from './catalog-api';

describe('CatalogApi', () => {
  let http: HttpTestingController;
  let api: CatalogApi;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: httpTestingProviders() });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(CatalogApi);
  });

  afterEach(() => http.verify());

  it('categories', async () => {
    const result = firstValueFrom(api.categories());
    const req = http.expectOne(`${API}/categories`);
    expect(req.request.method).toBe('GET');
    req.flush(CATEGORIES_EXAMPLE);
    expect(await result).toEqual(CATEGORIES_EXAMPLE);
  });

  it('paymentMethods', async () => {
    const result = firstValueFrom(api.paymentMethods());
    const req = http.expectOne(`${API}/payment-methods`);
    expect(req.request.method).toBe('GET');
    req.flush(PAYMENT_METHODS_EXAMPLE);
    expect(await result).toEqual(PAYMENT_METHODS_EXAMPLE);
  });
});
