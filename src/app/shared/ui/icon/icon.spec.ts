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
