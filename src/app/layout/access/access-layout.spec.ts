import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AccessLayout } from './access-layout';

@Component({
  imports: [AccessLayout],
  template: `<ws-access-layout>
    <div wsAccessPanel id="panel">Painel</div>
    <h1>Formulário</h1>
  </ws-access-layout>`,
})
class Host {}

describe('AccessLayout', () => {
  it('projects the panel and the form', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const art = root.querySelector('section.ws-auth-art')!;
    expect(art.getAttribute('aria-hidden')).toBe('true');
    expect(art.querySelector('#panel')).not.toBeNull();
    expect(art.querySelector('.ws-brand')).not.toBeNull();
    const main = root.querySelector('main.ws-auth-form')!;
    expect(main.querySelector('h1')!.textContent).toBe('Formulário');
    expect(main.querySelector('.d-lg-none .ws-brand')).not.toBeNull();
    expect(root.querySelector('button.ws-auth-theme')).not.toBeNull();
  });
});
