import { Injectable } from '@angular/core';
import { MatDateFormats, NativeDateAdapter } from '@angular/material/core';

import { formatBrDate, fromLocalDate, parseBrDate, toLocalDate } from './plain-date';

/** Marcador do formato de entrada e exibição do campo de data (`dd/mm/aaaa`). */
export const BR_DATE_INPUT = 'dd/mm/aaaa';

export const BR_DATE_FORMATS: MatDateFormats = {
  parse: { dateInput: BR_DATE_INPUT },
  display: {
    dateInput: BR_DATE_INPUT,
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

/**
 * ADR-06: o `NativeDateAdapter` lê `05/10/2026` como 10 de maio. Este lê e escreve `dd/mm/aaaa` (e `d/m/aaaa`) por
 * `plain-date.ts`; o resto (cabeçalhos e rótulos do calendário) continua com o `Intl` em pt-BR da classe base.
 */
@Injectable()
export class BrDateAdapter extends NativeDateAdapter {
  override parse(value: unknown, parseFormat?: unknown): Date | null {
    if (typeof value === 'string') {
      const text = value.trim();
      if (text === '') {
        return null;
      }
      const date = parseBrDate(text);
      return date ? toLocalDate(date) : this.invalid();
    }
    if (value instanceof Date || typeof value === 'number') {
      return super.parse(value, parseFormat);
    }
    return null;
  }

  override format(date: Date, displayFormat: unknown): string {
    if (displayFormat === BR_DATE_INPUT) {
      return formatBrDate(fromLocalDate(date));
    }
    return super.format(date, displayFormat as object);
  }
}
