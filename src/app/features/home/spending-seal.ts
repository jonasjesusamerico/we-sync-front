import { monthName } from '../../shared/date/plain-date';
import type { Comparison } from '../purchases/data/purchase.models';
import { sealEqual, sealLess, sealMore, sealNoBase, shorterMonthSuffix } from './home.messages';

/** Text and icon of the comparison seal of the spending card (RN-02, RN-03 of 005; RN-04 of 007). */
export interface Seal {
  text: string;
  icon: 'arrowUp' | 'arrowDown' | null;
}

export function spendingSeal(c: Comparison): Seal {
  const previous = monthName(c.previous_month);
  let suffix = '';
  if (c.period === 'UNTIL_DAY') {
    const untilDay = c.until_day;
    // RN-04 (ADR-05): the previous month ended before `until_day`. Old API without the field (D-09) → texts of 005.
    const previousUntilDay = c.previous_until_day as number | null | undefined;
    if (untilDay !== null && typeof previousUntilDay === 'number' && previousUntilDay < untilDay) {
      if (c.result === 'NO_BASE') {
        return { text: sealNoBase(previous, ''), icon: null };
      }
      suffix = shorterMonthSuffix(untilDay, previous, previousUntilDay);
    } else {
      suffix = ` até o dia ${untilDay}`;
    }
  }
  switch (c.result) {
    case 'MORE':
      return { text: sealMore(c.percent ?? 0, previous, suffix), icon: 'arrowUp' };
    case 'LESS':
      return { text: sealLess(c.percent ?? 0, previous, suffix), icon: 'arrowDown' };
    case 'EQUAL':
      return { text: sealEqual(previous, suffix), icon: null };
    case 'NO_BASE':
      return { text: sealNoBase(previous, suffix), icon: null };
  }
}
