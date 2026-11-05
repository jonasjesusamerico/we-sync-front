import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../http/api-base-url';
import type {
  CatalogKind,
  Category,
  CategoryRequest,
  Created,
  PaymentMethod,
  PaymentMethodRequest,
} from './catalog.models';

const PATHS: Record<CatalogKind, string> = { category: 'categories', payment: 'payment-methods' };

/**
 * Categories and payment methods (global and the user's own, archived included). Stateless; errors pass through
 * untouched (the caller decides by status and `code`).
 */
@Injectable({ providedIn: 'root' })
export class CatalogApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  categories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.base}/categories`);
  }

  paymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${this.base}/payment-methods`);
  }

  /** 201 → created; 200 → an archived own item with the same name was reactivated (ADR-09). */
  createCategory(body: CategoryRequest): Observable<Created<Category>> {
    return this.create<Category>('category', body);
  }

  createPaymentMethod(body: PaymentMethodRequest): Observable<Created<PaymentMethod>> {
    return this.create<PaymentMethod>('payment', body);
  }

  updateCategory(id: number, body: CategoryRequest): Observable<Category> {
    return this.http.put<Category>(`${this.url('category')}/${id}`, body);
  }

  updatePaymentMethod(id: number, body: PaymentMethodRequest): Observable<PaymentMethod> {
    return this.http.put<PaymentMethod>(`${this.url('payment')}/${id}`, body);
  }

  archive(kind: CatalogKind, id: number): Observable<void> {
    return this.http.put<void>(`${this.url(kind)}/${id}/archive`, null);
  }

  unarchive(kind: CatalogKind, id: number): Observable<void> {
    return this.http.delete<void>(`${this.url(kind)}/${id}/archive`);
  }

  private create<T>(kind: CatalogKind, body: object): Observable<Created<T>> {
    return this.http
      .post<T>(this.url(kind), body, { observe: 'response' })
      .pipe(
        map((response) => ({ item: response.body as T, reactivated: response.status === 200 })),
      );
  }

  private url(kind: CatalogKind): string {
    return `${this.base}/${PATHS[kind]}`;
  }
}
