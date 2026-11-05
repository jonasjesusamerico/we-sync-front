import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { CurrentUserStore } from './current-user-store';

/** 'ready' → true at once; otherwise waits for CurrentUserStore.load(). Never rejects (DAS 3.5). */
export const currentUserResolver: ResolveFn<true> = async (): Promise<true> => {
  const store = inject(CurrentUserStore);
  if (store.status() !== 'ready') {
    await store.load();
  }
  return true;
};
