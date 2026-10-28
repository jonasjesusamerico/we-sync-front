import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { BrandComponent } from './brand.component';

@Component({
  imports: [BrandComponent],
  template: `<app-brand [size]="size()" [tone]="tone()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostComponent {
  readonly size = signal<'small' | 'large'>('small');
  readonly tone = signal<'on-primary' | 'primary'>('on-primary');
}

@Component({
  imports: [BrandComponent],
  template: `<app-brand />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DefaultHostComponent {}

describe('BrandComponent', () => {
  async function render(size: 'small' | 'large', tone: 'on-primary' | 'primary') {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.size.set(size);
    fixture.componentInstance.tone.set(tone);
    await fixture.whenStable();
    return (fixture.nativeElement as HTMLElement).querySelector('app-brand') as HTMLElement;
  }

  it('marca pequena no topo', async () => {
    const fixture = TestBed.createComponent(DefaultHostComponent);
    await fixture.whenStable();
    const host = (fixture.nativeElement as HTMLElement).querySelector('app-brand') as HTMLElement;
    const icon = host.querySelector('mat-icon');
    expect(icon?.textContent?.trim()).toBe('sync');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(host.querySelector('.name')?.textContent).toBe('we-sync');
    expect(host.classList).not.toContain('large');
    expect(host.classList).not.toContain('primary');
  });

  it('marca grande na cor do topo', async () => {
    const host = await render('large', 'on-primary');
    expect(host.classList).toContain('large');
    expect(host.classList).not.toContain('primary');
  });

  it('marca na primária', async () => {
    const host = await render('small', 'primary');
    expect(host.classList).toContain('primary');
    expect(host.classList).not.toContain('large');
  });
});
