import { Injectable } from '@angular/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';

import { DATEPICKER_LABELS, yearRangeLabel } from './purchase.messages';

/** Textos do calendário em pt-BR (os padrões do Material vêm em inglês). */
@Injectable()
export class PtBrDatepickerIntl extends MatDatepickerIntl {
  override calendarLabel = DATEPICKER_LABELS.calendarLabel;
  override openCalendarLabel = DATEPICKER_LABELS.openCalendarLabel;
  override closeCalendarLabel = DATEPICKER_LABELS.closeCalendarLabel;
  override prevMonthLabel = DATEPICKER_LABELS.prevMonthLabel;
  override nextMonthLabel = DATEPICKER_LABELS.nextMonthLabel;
  override prevYearLabel = DATEPICKER_LABELS.prevYearLabel;
  override nextYearLabel = DATEPICKER_LABELS.nextYearLabel;
  override prevMultiYearLabel = DATEPICKER_LABELS.prevMultiYearLabel;
  override nextMultiYearLabel = DATEPICKER_LABELS.nextMultiYearLabel;
  override switchToMonthViewLabel = DATEPICKER_LABELS.switchToMonthViewLabel;
  override switchToMultiYearViewLabel = DATEPICKER_LABELS.switchToMultiYearViewLabel;

  /** Lido pelo leitor de tela no botão do intervalo de anos (o padrão é `2016 to 2039`). */
  override formatYearRangeLabel(start: string, end: string): string {
    return yearRangeLabel(start, end);
  }
}
