import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { passwordValidator } from '../validators/password.validators';
import { MSG_PASSWORD_MIN_BYTES, MSG_PASSWORD_MISMATCH } from '../validators/validation-messages';
import {
  LABEL_HIDE_PASSWORD,
  LABEL_SHOW_PASSWORD,
  PasswordFieldComponent,
} from './password-field.component';

@Component({
  imports: [ReactiveFormsModule, PasswordFieldComponent],
  template: `
    <form [formGroup]="form" (ngSubmit)="submitted.set(true)">
      <app-password-field [control]="form.controls.password" label="Senha" [kind]="kind()" />
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostComponent {
  readonly form = new FormGroup({
    password: new FormControl('', { nonNullable: true, validators: [passwordValidator] }),
  });
  readonly kind = signal<'password' | 'confirmPassword'>('password');
  readonly submitted = signal(false);
}

async function render() {
  const fixture = TestBed.createComponent(HostComponent);
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    host: fixture.componentInstance,
    input: () => el.querySelector('input') as HTMLInputElement,
    button: () => el.querySelector('button') as HTMLButtonElement,
    error: () => el.querySelector('.invalid-feedback')?.textContent?.trim() ?? null,
  };
}

describe('PasswordFieldComponent', () => {
  it('começa oculto', async () => {
    const { input, button } = await render();
    expect(input().type).toBe('password');
    expect(button().getAttribute('aria-label')).toBe(LABEL_SHOW_PASSWORD);
    expect(button().getAttribute('aria-pressed')).toBe('false');
  });

  it('mostra e oculta', async () => {
    const { fixture, input, button } = await render();

    button().click();
    await fixture.whenStable();
    expect(input().type).toBe('text');
    expect(button().getAttribute('aria-label')).toBe(LABEL_HIDE_PASSWORD);
    expect(button().getAttribute('aria-pressed')).toBe('true');

    button().click();
    await fixture.whenStable();
    expect(input().type).toBe('password');
    expect(button().getAttribute('aria-label')).toBe(LABEL_SHOW_PASSWORD);
  });

  it('botão não envia o form', async () => {
    const { fixture, host, button } = await render();
    button().click();
    await fixture.whenStable();
    expect(host.submitted()).toBe(false);
  });

  it('botão não tira o foco do input no clique do mouse', async () => {
    const { button } = await render();
    const mousedown = new MouseEvent('mousedown', { cancelable: true });
    button().dispatchEvent(mousedown);
    expect(mousedown.defaultPrevented).toBe(true);
  });

  it('mostra erro do campo', async () => {
    const { fixture, host, error } = await render();
    expect(error()).toBeNull();

    host.form.controls.password.setValue('senha12');
    host.form.controls.password.markAsTouched();
    await fixture.whenStable();

    expect(error()).toBe(MSG_PASSWORD_MIN_BYTES);
    expect(MSG_PASSWORD_MIN_BYTES).toBe('A senha precisa ter pelo menos 8 caracteres.');
  });

  it('confirmação usa as mensagens dela', async () => {
    const { fixture, host, error } = await render();
    host.kind.set('confirmPassword');
    const control = host.form.controls.password;
    control.setValidators(() => ({ passwordMismatch: true }));
    control.setValue('senha124');
    control.markAsTouched();
    await fixture.whenStable();

    expect(error()).toBe(MSG_PASSWORD_MISMATCH);
    expect(MSG_PASSWORD_MISMATCH).toBe('As senhas não conferem.');
  });
});
