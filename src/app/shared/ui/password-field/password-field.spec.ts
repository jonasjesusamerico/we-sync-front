import { Component, provideZonelessChangeDetection, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { LABEL_HIDE_PASSWORD, LABEL_SHOW_PASSWORD } from '../ui.messages';
import { PasswordField } from './password-field';

@Component({
  imports: [PasswordField],
  template: `<ws-password-field
    [control]="control"
    inputId="password"
    autocomplete="current-password"
    [invalid]="invalid()"
    [describedBy]="describedBy()"
    [autofocus]="autofocus()"
  />`,
})
class Host {
  readonly control = new FormControl('segredo', { nonNullable: true });
  readonly invalid = signal(false);
  readonly describedBy = signal<string | null>(null);
  readonly autofocus = signal(false);
  readonly field = viewChild.required(PasswordField);
}

async function render() {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    input: root.querySelector('input')!,
    button: root.querySelector('button')!,
  };
}

describe('PasswordField', () => {
  it('senha oculta por padrão', async () => {
    const { input, button } = await render();
    expect(input.type).toBe('password');
    expect(input.id).toBe('password');
    expect(input.getAttribute('autocomplete')).toBe('current-password');
    expect(input.value).toBe('segredo');
    expect(button.getAttribute('aria-label')).toBe(LABEL_SHOW_PASSWORD);
    expect(button.getAttribute('aria-controls')).toBe('password');
    expect(button.type).toBe('button');
  });

  it('mostrar e ocultar', async () => {
    const { fixture, input, button } = await render();
    button.click();
    await fixture.whenStable();
    expect(input.type).toBe('text');
    expect(button.getAttribute('aria-label')).toBe(LABEL_HIDE_PASSWORD);
    button.click();
    await fixture.whenStable();
    expect(input.type).toBe('password');
    expect(button.getAttribute('aria-label')).toBe(LABEL_SHOW_PASSWORD);
    expect(fixture.componentInstance.control.value).toBe('segredo');
  });

  it('senha inválida', async () => {
    const { fixture, input } = await render();
    expect(input.hasAttribute('aria-invalid')).toBe(false);
    fixture.componentInstance.invalid.set(true);
    fixture.componentInstance.describedBy.set('password-error');
    await fixture.whenStable();
    expect(input.classList).toContain('is-invalid');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('password-error');
  });

  it('focus() moves the focus to the input', async () => {
    const { fixture, input } = await render();
    fixture.componentInstance.field().focus();
    expect(document.activeElement).toBe(input);
  });

  it('autofocus no input (D-12 da 006)', async () => {
    const { fixture, input } = await render();
    expect(input.hasAttribute('autofocus')).toBe(false);
    fixture.componentInstance.autofocus.set(true);
    await fixture.whenStable();
    expect(input.hasAttribute('autofocus')).toBe(true);
  });
});
