import { InjectionToken } from '@angular/core';

export const REFRESH_LOCK_NAME = 'we-sync.refresh';
export const REFRESH_LOCK_TIMEOUT_MS = 10_000;

export interface LockManagerLike {
  request<T>(name: string, options: { signal: AbortSignal }, task: () => Promise<T>): Promise<T>;
}

/** navigator.locks wrapped (the browser callback receives the Lock, which we do not use); null outside a secure context. */
export const LOCK_MANAGER = new InjectionToken<LockManagerLike | null>('LOCK_MANAGER', {
  providedIn: 'root',
  factory: () =>
    typeof navigator !== 'undefined' && navigator.locks
      ? {
          request: <T>(name: string, options: { signal: AbortSignal }, task: () => Promise<T>) =>
            navigator.locks.request(name, options, () => task()) as Promise<T>,
        }
      : null,
});
