import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

import { LABEL_NEXT_PAGE, LABEL_PREVIOUS_PAGE, rangeLabel } from './purchase.messages';

/** RF-11: paginador em pt-BR, com `1–20 de 47`. */
@Injectable()
export class PtBrPaginatorIntl extends MatPaginatorIntl {
  override nextPageLabel = LABEL_NEXT_PAGE;
  override previousPageLabel = LABEL_PREVIOUS_PAGE;
  /** Escondido por `hidePageSize`. */
  override itemsPerPageLabel = '';

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0) {
      return rangeLabel(0, 0, 0);
    }
    const start = page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, length);
    return rangeLabel(start, end, length);
  };
}
