import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { FormAlertComponent } from './form-alert.component';

@Component({
  imports: [FormAlertComponent],
  template: `<app-form-alert [kind]="kind()"
    >Texto do aviso <a href="/login">Entrar</a></app-form-alert
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostComponent {
  readonly kind = signal<'error' | 'info'>('error');
}

describe('FormAlertComponent', () => {
  async function render(kind: 'error' | 'info') {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.kind.set(kind);
    await fixture.whenStable();
    return (fixture.nativeElement as HTMLElement).querySelector('app-form-alert') as HTMLElement;
  }

  it('alert de erro', async () => {
    const alert = await render('error');
    expect(alert.getAttribute('role')).toBe('alert');
    expect(alert.textContent).toContain('Texto do aviso');
    expect(alert.querySelector('a')?.textContent).toBe('Entrar');
  });

  it('alert de info', async () => {
    const alert = await render('info');
    expect(alert.getAttribute('role')).toBe('status');
    expect(alert.classList).toContain('info');
  });
});
