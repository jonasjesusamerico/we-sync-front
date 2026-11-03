import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { THEME_KEY, ThemeService } from './theme';

describe('ThemeService', () => {
  const root = document.documentElement;

  function create(attribute: string | null): ThemeService {
    if (attribute === null) {
      root.removeAttribute('data-bs-theme');
    } else {
      root.setAttribute('data-bs-theme', attribute);
    }
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    return TestBed.inject(ThemeService);
  }

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    root.removeAttribute('data-bs-theme');
  });

  it.each([
    ['dark', 'dark'],
    ['light', 'light'],
    [null, 'light'],
  ])('estado inicial: %s → %s', (attribute, expected) => {
    expect(create(attribute).theme()).toBe(expected);
  });

  it('trocar', () => {
    const service = create('light');
    service.toggle();
    expect(root.getAttribute('data-bs-theme')).toBe('dark');
    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
  });

  it('storage recusado', () => {
    const service = create('light');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => service.toggle()).not.toThrow();
    expect(root.getAttribute('data-bs-theme')).toBe('dark');
    expect(service.theme()).toBe('dark');
  });
});
