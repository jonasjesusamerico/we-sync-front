import { InteractivityChecker } from '@angular/cdk/a11y';
import { Dialog } from '@angular/cdk/dialog';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { isObservable, Observable } from 'rxjs';

import { SESSION_KEY } from '../../../core/auth/session.store';
import { PURCHASE_ROUTES } from '../purchases.routes';
import { unsavedChangesGuard, UnsavedChangesAware } from './unsaved-changes.guard';

describe('unsavedChangesGuard', () => {
  beforeEach(() => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ access_token: 'A1', refresh_token: 'R1' }));
    vi.spyOn(TestBed.inject(InteractivityChecker), 'isVisible').mockReturnValue(true);
  });

  afterEach(() => {
    TestBed.inject(Dialog).closeAll();
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => el.remove());
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const settle = () => TestBed.inject(ApplicationRef).whenStable();
  const dialog = () => document.querySelector('cdk-dialog-container') as HTMLElement | null;
  const buttons = () =>
    Array.from(dialog()?.querySelectorAll<HTMLButtonElement>('.modal-footer button') ?? []);

  function run(dirty: boolean) {
    const component: UnsavedChangesAware = { hasUnsavedChanges: () => dirty };
    return TestBed.runInInjectionContext(() =>
      unsavedChangesGuard(
        component,
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
        {} as RouterStateSnapshot,
      ),
    );
  }

  async function ask() {
    const result = run(true);
    expect(isObservable(result)).toBe(true);
    const emitted = vi.fn();
    (result as Observable<boolean>).subscribe(emitted);
    await settle();
    return emitted;
  }

  it('sem alteração libera', () => {
    expect(run(false)).toBe(true);
    expect(dialog()).toBeNull();
  });

  it('com alteração pergunta', async () => {
    await ask();
    expect(dialog()?.querySelector('h2')?.textContent?.trim()).toBe('Descartar alterações?');
    expect(buttons().map((b) => b.textContent?.trim())).toEqual([
      'Continuar editando',
      'Descartar',
    ]);
    await settle();
    expect(document.activeElement).toBe(buttons()[0]);
  });

  it('Descartar sai', async () => {
    const emitted = await ask();
    buttons()[1].click();
    await settle();
    expect(emitted).toHaveBeenCalledWith(true);
  });

  it('Continuar editando fica', async () => {
    const emitted = await ask();
    buttons()[0].click();
    await settle();
    expect(emitted).toHaveBeenCalledWith(false);

    const again = await ask();
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    Object.defineProperty(event, 'keyCode', { get: () => 27 });
    dialog()!.dispatchEvent(event);
    await settle();
    expect(again).toHaveBeenCalledWith(false);
  });

  it('sem sessão libera', () => {
    localStorage.clear();
    expect(run(true)).toBe(true);
    expect(dialog()).toBeNull();
  });

  it('rota usa o guard', () => {
    const byPath = (path: string) => PURCHASE_ROUTES.find((r) => r.path === path)!;
    expect(byPath('novo').canDeactivate).toEqual([unsavedChangesGuard]);
    expect(byPath(':id').canDeactivate).toEqual([unsavedChangesGuard]);
    expect(byPath('').canDeactivate).toBeUndefined();
  });
});
