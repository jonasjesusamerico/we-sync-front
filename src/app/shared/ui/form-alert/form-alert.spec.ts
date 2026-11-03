import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ICON_PATHS } from '../icon/icons';
import { FormAlert, FormAlertKind } from './form-alert';

@Component({
  imports: [FormAlert],
  template: `<ws-form-alert [kind]="kind()">Texto <a href="/login">Entrar</a></ws-form-alert>`,
})
class Host {
  readonly kind = signal<FormAlertKind>('error');
}

describe('FormAlert (aviso)', () => {
  it.each([
    ['error', 'alert-danger', 'alert', ICON_PATHS.alert],
    ['success', 'alert-success', 'status', ICON_PATHS.check],
    ['info', 'alert-primary', 'status', ICON_PATHS.clock],
  ] as const)('%s', async (kind, cls, role, icon) => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.kind.set(kind);
    await fixture.whenStable();
    const alert = (fixture.nativeElement as HTMLElement).querySelector('.alert')!;
    expect(alert.classList).toContain(cls);
    expect(alert.getAttribute('role')).toBe(role);
    expect(alert.querySelector('path')!.getAttribute('d')).toBe(icon);
    expect(alert.textContent).toContain('Texto');
    expect(alert.querySelector('a')!.getAttribute('href')).toBe('/login');
  });
});
