import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Icon } from './icon';
import { ICON_PATHS, IconName } from './icons';

@Component({
  imports: [Icon],
  template: `<ws-icon [name]="name()" [size]="size()" />`,
})
class Host {
  readonly name = signal<IconName>('home');
  readonly size = signal<'md' | 'lg'>('md');
}

async function render() {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  return fixture;
}

describe('Icon', () => {
  it('draws the path of the icon (ícone desenha o caminho)', async () => {
    const fixture = await render();
    const host = fixture.nativeElement.querySelector('ws-icon') as HTMLElement;
    const svg = host.querySelector('svg')!;
    expect(host.classList).toContain('ws-icon');
    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS.home);
  });

  it('has a large size (ícone grande)', async () => {
    const fixture = await render();
    const host = fixture.nativeElement.querySelector('ws-icon') as HTMLElement;
    expect(host.classList).not.toContain('ws-icon-lg');
    fixture.componentInstance.size.set('lg');
    await fixture.whenStable();
    expect(host.classList).toContain('ws-icon-lg');
  });

  it('has a path for every icon (todos os ícones existem)', () => {
    for (const name of Object.keys(ICON_PATHS) as IconName[]) {
      expect(ICON_PATHS[name].length, name).toBeGreaterThan(0);
    }
  });
});

describe('ICON_PATHS (feature 005)', () => {
  // Paths copied from ICONS in prototype/assets/app.js.
  it.each([
    ['car', 'M5 16v-5l2-5h10l2 5v5M3 16h18v3H3zM7.5 13h.01M16.5 13h.01'],
    ['house', 'M4 21V9l8-6 8 6v12zM10 21v-6h4v6'],
    ['heart', 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z'],
    ['book', 'M4 19V5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h14'],
    ['tag', 'M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9zM7.5 7.5h.01'],
    ['chevL', 'M15 6l-6 6 6 6'],
    ['chevR', 'M9 6l6 6-6 6'],
    ['edit', 'M4 20h4L19 9l-4-4L4 16z'],
    ['trash', 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13'],
    ['search', 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4'],
    ['x', 'M6 6l12 12M18 6 6 18'],
    ['arrowDown', 'M12 5v14M6 13l6 6 6-6'],
    ['arrowUp', 'M12 19V5M6 11l6-6 6 6'],
  ] as const)('ícone %s', (name, path) => {
    expect(ICON_PATHS[name]).toBe(path);
  });
});
