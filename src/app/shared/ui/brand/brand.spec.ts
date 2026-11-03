import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ICON_PATHS } from '../icon/icons';
import { Brand } from './brand';

@Component({
  imports: [Brand],
  template: `<div id="plain"><ws-brand /></div>
    <div id="link"><ws-brand [link]="true" /></div>`,
})
class Host {}

describe('Brand (marca)', () => {
  it('renders as text or as a link to the home page', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    const plain = root.querySelector('#plain .ws-brand')!;
    expect(plain.tagName).toBe('SPAN');
    expect(plain.textContent!.trim()).toBe('we-sync');
    expect(plain.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS.sync);
    expect(root.querySelector('#plain a')).toBeNull();

    const link = root.querySelector('#link a.ws-brand')!;
    expect(link.getAttribute('href')).toBe('/inicio');
    expect(link.textContent!.trim()).toBe('we-sync');
  });
});
