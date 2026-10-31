import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../core/http/api-base-url';
import { OptionsApi, sortOptions } from './options.api';
import { Option } from './purchase.models';

const opt = (id: number, name: string, is_global = true) => ({
  id,
  name,
  is_global,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
});

const names = (list: Option[]) => list.map((o) => o.name);

describe('OptionsApi', () => {
  let api: OptionsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });
    api = TestBed.inject(OptionsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('categories ordena', () => {
    const next = vi.fn();
    api.categories().subscribe(next);
    http
      .expectOne('/api/v1/categories')
      .flush([
        opt(2, 'Transporte'),
        { ...opt(31, 'Academia', false), user_id: 7 },
        opt(1, 'Alimentação'),
        opt(4, 'Saúde'),
        opt(5, 'Educação'),
        opt(6, 'Lazer'),
        opt(3, 'Moradia'),
        { ...opt(32, 'Pets', false), user_id: 7 },
      ]);
    const result = next.mock.calls[0][0] as Option[];
    expect(names(result)).toEqual([
      'Academia',
      'Alimentação',
      'Educação',
      'Lazer',
      'Moradia',
      'Pets',
      'Saúde',
      'Transporte',
    ]);
    expect(result[0]).toEqual({ id: 31, name: 'Academia', is_global: false });
  });

  it('ordenação ignora acento e caixa', () => {
    expect(names(sortOptions([opt(1, 'Éter'), opt(2, 'alfa'), opt(3, 'Beta')]))).toEqual([
      'alfa',
      'Beta',
      'Éter',
    ]);
  });

  it('desempate por id', () => {
    expect(sortOptions([opt(9, 'Pix'), opt(4, 'Pix')]).map((o) => o.id)).toEqual([4, 9]);
  });

  it('both', () => {
    const next = vi.fn();
    api.both().subscribe(next);
    http.expectOne('/api/v1/categories').flush([opt(2, 'Transporte'), opt(1, 'Alimentação')]);
    http.expectOne('/api/v1/payment-methods').flush([opt(4, 'Pix'), opt(1, 'Dinheiro')]);
    const result = next.mock.calls[0][0] as { categories: Option[]; paymentMethods: Option[] };
    expect(names(result.categories)).toEqual(['Alimentação', 'Transporte']);
    expect(names(result.paymentMethods)).toEqual(['Dinheiro', 'Pix']);
  });
});
