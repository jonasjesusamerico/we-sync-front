import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { STRENGTH_HINT_EMPTY, STRENGTH_HINT_STRONG, STRENGTH_HINT_WEAK } from '../ui.messages';
import { StrengthMeter } from './strength-meter';

describe('StrengthMeter (medidor)', () => {
  it.each([
    ['', '0%', null, STRENGTH_HINT_EMPTY],
    ['abcdefgh', '25%', 'is-weak', STRENGTH_HINT_WEAK],
    ['Abcdefgh', '50%', 'is-fair', STRENGTH_HINT_WEAK],
    ['Abcdefg1', '75%', 'is-strong', STRENGTH_HINT_STRONG],
    ['Abcdef1!', '100%', 'is-strong', STRENGTH_HINT_STRONG],
  ])('%j', async (password, width, cls, hint) => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(StrengthMeter);
    fixture.componentRef.setInput('password', password);
    fixture.componentRef.setInput('hintId', 'password-hint');
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const bar = root.querySelector<HTMLElement>('.progress-bar')!;
    const text = root.querySelector('#password-hint')!;

    expect(bar.style.width).toBe(width);
    for (const c of ['is-weak', 'is-fair', 'is-strong']) {
      expect(bar.classList.contains(c)).toBe(c === cls);
    }
    expect(root.querySelector('.progress')!.getAttribute('aria-hidden')).toBe('true');
    expect(text.getAttribute('aria-live')).toBe('polite');
    expect(text.textContent!.trim()).toBe(hint);
  });
});
