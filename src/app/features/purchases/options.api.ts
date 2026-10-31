import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';

import { API_BASE_URL } from '../../core/http/api-base-url';
import { Option } from './purchase.models';

export interface PurchaseOptions {
  categories: Option[];
  paymentMethods: Option[];
}

/** RF-19: globais e pessoais juntas, por nome (pt-BR, sem diferenciar acento e caixa), desempate por `id`. */
export function sortOptions(list: readonly Option[]): Option[] {
  return list
    .map(({ id, name, is_global }) => ({ id, name, is_global }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }) || a.id - b.id);
}

/** `GET /categories` e `GET /payment-methods`. Sem estado (ADR-03): cada página carrega as suas. */
@Injectable({ providedIn: 'root' })
export class OptionsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  categories(): Observable<Option[]> {
    return this.http.get<Option[]>(`${this.baseUrl}/categories`).pipe(map(sortOptions));
  }

  paymentMethods(): Observable<Option[]> {
    return this.http.get<Option[]>(`${this.baseUrl}/payment-methods`).pipe(map(sortOptions));
  }

  both(): Observable<PurchaseOptions> {
    return forkJoin({ categories: this.categories(), paymentMethods: this.paymentMethods() });
  }
}
