import { InjectionToken } from '@angular/core';
import { type PlainDate, localToday } from '../../shared/date/plain-date';

/** "Today" as the browser's local date (ADR-11). Tests replace it with a fixed date. */
export const TODAY = new InjectionToken<() => PlainDate>('TODAY', {
  providedIn: 'root',
  factory: () => localToday,
});
