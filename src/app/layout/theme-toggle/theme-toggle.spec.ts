import { TestBed } from '@angular/core/testing';
import { httpTestingProviders } from '../../../testing/http';
import { ThemeService } from '../../core/theme/theme';
import { ICON_PATHS } from '../../shared/ui/icon/icons';
import { LABEL_USE_DARK_THEME, LABEL_USE_LIGHT_THEME } from '../../shared/ui/ui.messages';
import { ThemeToggle } from './theme-toggle';

describe('ThemeToggle', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-bs-theme');
  });

  it('rótulo e ícone', async () => {
    document.documentElement.setAttribute('data-bs-theme', 'light');
    TestBed.configureTestingModule({ providers: httpTestingProviders() });
    const fixture = TestBed.createComponent(ThemeToggle);
    fixture.componentRef.setInput('extraClass', 'ws-auth-theme');
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const path = () => button.querySelector('path')!.getAttribute('d');

    expect(button.className).toBe('btn btn-ghost btn-icon ws-auth-theme');
    expect(button.getAttribute('aria-label')).toBe(LABEL_USE_DARK_THEME);
    expect(path()).toBe(ICON_PATHS.moon);

    button.click();
    await fixture.whenStable();
    expect(button.getAttribute('aria-label')).toBe(LABEL_USE_LIGHT_THEME);
    expect(path()).toBe(ICON_PATHS.sun);
  });

  it('botão do topo chama set', async () => {
    document.documentElement.setAttribute('data-bs-theme', 'light');
    TestBed.configureTestingModule({ providers: httpTestingProviders() });
    const set = vi.spyOn(TestBed.inject(ThemeService), 'set');
    const fixture = TestBed.createComponent(ThemeToggle);
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(set).toHaveBeenCalledWith('dark');
  });
});
