import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of, throwError } from 'rxjs';

import { API_BASE_URL } from '../../core/http/api-base-url';
import { ListQuery, toApiParams } from './list-query';
import { Purchase, PurchasePage, PurchaseRequest } from './purchase.models';

/**
 * Endpoints de `/purchases` (contrato da feature 003). Sem estado (ADR-03). Não trata erro, salvo o `404` do
 * `DELETE` (RN-14). O `id` é `string` e só chega aqui depois de `PURCHASE_ID_PATTERN` (quem chama confere).
 */
@Injectable({ providedIn: 'root' })
export class PurchasesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(q: ListQuery): Observable<PurchasePage> {
    return this.http.get<PurchasePage>(`${this.baseUrl}/purchases`, { params: toApiParams(q) });
  }

  get(id: string): Observable<Purchase> {
    return this.http.get<Purchase>(`${this.baseUrl}/purchases/${id}`);
  }

  create(body: PurchaseRequest): Observable<Purchase> {
    return this.http.post<Purchase>(`${this.baseUrl}/purchases`, body);
  }

  update(id: string, body: PurchaseRequest): Observable<Purchase> {
    return this.http.put<Purchase>(`${this.baseUrl}/purchases/${id}`, body);
  }

  /** RN-14: `404` (já excluído) também é sucesso. */
  remove(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/purchases/${id}`)
      .pipe(
        catchError((error: unknown) =>
          error instanceof HttpErrorResponse && error.status === 404
            ? of(undefined)
            : throwError(() => error),
        ),
      );
  }
}
