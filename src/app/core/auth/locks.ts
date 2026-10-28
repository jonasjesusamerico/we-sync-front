import { InjectionToken } from '@angular/core';

/** Subconjunto de `navigator.locks` usado pelo app (permite um fake nos testes, onde o jsdom não tem locks). */
export interface LockManagerLike {
  request<T>(
    name: string,
    options: { mode: 'exclusive'; signal?: AbortSignal },
    callback: () => Promise<T>,
  ): Promise<T>;
}

export const LOCKS = new InjectionToken<LockManagerLike>('LOCKS', {
  providedIn: 'root',
  factory: () => navigator.locks as unknown as LockManagerLike,
});

export const REFRESH_LOCK_NAME = 'we-sync.refresh';
/** Maior que o timeout do `/auth/refresh` (30 s), para quem espera não desistir antes de quem renova. */
export const REFRESH_LOCK_WAIT_MS = 35_000;
