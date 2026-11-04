import {
  EnvironmentInjector,
  provideZonelessChangeDetection,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { seedSession } from '../../../testing/session';
import { ConfirmService } from '../../shared/ui/confirm/confirm';
import { DISCARD_CONFIRM, DISCARD_KEEP, DISCARD_TITLE } from './navigation.messages';
import { HasUnsavedChanges, unsavedChangesGuard } from './unsaved-changes.guard';

function run(page: HasUnsavedChanges) {
  return runInInjectionContext(TestBed.inject(EnvironmentInjector), () =>
    unsavedChangesGuard(
      page,
      {} as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot,
      {} as RouterStateSnapshot,
    ),
  );
}

describe('unsavedChangesGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('guard sem sessão libera sem perguntar', () => {
    const ask = vi.spyOn(TestBed.inject(ConfirmService), 'ask');
    expect(run({ hasUnsavedChanges: () => true })).toBe(true);
    expect(ask).not.toHaveBeenCalled();
  });

  it('guard sem alteração libera', () => {
    seedSession('a', 'r');
    expect(run({ hasUnsavedChanges: () => false })).toBe(true);
  });

  it.each([
    ['Descartar', true],
    ['Continuar editando', false],
  ])('guard com alteração: %s', async (_choice, confirmed) => {
    seedSession('a', 'r');
    const confirm = TestBed.inject(ConfirmService);
    const answer = run({ hasUnsavedChanges: () => true }) as Promise<boolean>;
    expect(confirm.active()).toEqual({
      title: DISCARD_TITLE,
      icon: 'alert',
      confirmLabel: DISCARD_CONFIRM,
      cancelLabel: DISCARD_KEEP,
    });
    if (confirmed) {
      confirm.confirm();
    } else {
      confirm.cancel();
    }
    expect(await answer).toBe(confirmed);
  });
});
