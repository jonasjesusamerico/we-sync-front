import { monthName } from '../../shared/date/plain-date';
import type { Comparison } from '../purchases/data/purchase.models';
import { sealEqual, sealLess, sealMore, sealNoBase } from './home.messages';

/** Text and icon of the comparison seal of the spending card (RN-02, RN-03). */
export interface Seal {
  text: string;
  icon: 'arrowUp' | 'arrowDown' | null;
}

export function spendingSeal(c: Comparison): Seal {
  const previous = monthName(c.previous_month);
  const suffix = c.period === 'UNTIL_DAY' ? ` até o dia ${c.until_day}` : '';
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
