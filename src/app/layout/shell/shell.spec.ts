import { HttpTestingController } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { USER_RESPONSE_EXAMPLE } from '../../../testing/api-examples';
import { text } from '../../../testing/dom';
import { API, httpTestingProviders } from '../../../testing/http';
import { CurrentUserStore } from '../../core/user/current-user-store';
import { Shell } from './shell';
import * as t from './shell.messages';

@Component({ template: '<h1>Início</h1>' })
class Blank {}

describe('Shell', () => {
  let router: Router;

  async function render() {
    TestBed.configureTestingModule({
      providers: [
        ...httpTestingProviders(),
        provideRouter([
          { path: '', component: Shell, children: [{ path: 'inicio', component: Blank }] },
        ]),
      ],
    });
    router = TestBed.inject(Router);
    const http = TestBed.inject(HttpTestingController);
    const loading = TestBed.inject(CurrentUserStore).load();
    http.expectOne(`${API}/users/me`).flush(USER_RESPONSE_EXAMPLE);
    await loading;
    const harness = await RouterTestingHarness.create('/inicio');
    return { root: harness.fixture.nativeElement as HTMLElement, harness };
  }

  it('menu lateral', async () => {
    const { root } = await render();
    const aside = root.querySelector('aside#ws-sidebar')!;
    expect(aside.getAttribute('aria-label')).toBe(t.LABEL_MAIN_MENU);
    expect(Array.from(aside.querySelectorAll('.ws-nav-title')).map(text)).toEqual([
      'Menu',
      'Planejamento',
      'Administração',
    ]);
    expect(
      Array.from(aside.querySelectorAll('nav')).map((n) => n.getAttribute('aria-label')),
    ).toEqual(['Menu', 'Planejamento', 'Administração']);
    const home = aside.querySelector('a.ws-nav-link')!;
    expect(text(home)).toBe('Início');
    expect(home.getAttribute('aria-current')).toBe('page');
    const soon = Array.from(aside.querySelectorAll<HTMLButtonElement>('button.ws-nav-link'));
    expect(soon.map(text)).toEqual([
      'Compras em breve',
      'Nossa casa em breve',
      'Metas e relatórios em breve',
      'Investimentos em breve',
      'Configurações em breve',
    ]);
    soon.forEach((b) => expect(b.getAttribute('aria-disabled')).toBe('true'));
    const card = aside.querySelector('.ws-sidebar-card')!;
    expect(text(card.querySelector('strong'))).toBe(t.SIDEBAR_CARD_TITLE);
    const cardButton = card.querySelector('button')!;
    expect(cardButton.getAttribute('aria-label')).toBe('Nova compra, em breve');
  });

  it('barra superior', async () => {
    const { root } = await render();
    const bar = root.querySelector('header#ws-topbar')!;
    const labels = Array.from(bar.querySelectorAll('button')).map((b) =>
      b.getAttribute('aria-label'),
    );
    expect(labels).toEqual([
      'Nova compra, em breve',
      'Usar tema escuro',
      'Notificações, em breve',
      null,
      'Meu perfil, em breve',
      'Configurações, em breve',
      null,
    ]);
    expect(text(bar.querySelector('#ws-user-btn'))).toBe('AS Ana Souza Menu da conta');
    expect(bar.querySelector('[aria-label*="Ajuda"]')).toBeNull();
  });

  it('menu inferior', async () => {
    const { root } = await render();
    const nav = root.querySelector('nav#ws-bottomnav')!;
    expect(nav.getAttribute('aria-label')).toBe(t.LABEL_BOTTOM_NAV);
    const items = Array.from(nav.children) as HTMLElement[];
    expect(items.map((el) => el.tagName)).toEqual(['A', 'BUTTON', 'BUTTON', 'BUTTON', 'BUTTON']);
    expect(text(items[0])).toBe('Início');
    expect(items[0].getAttribute('aria-current')).toBe('page');
    expect(items.slice(1).map((el) => el.getAttribute('aria-label'))).toEqual([
      'Compras, em breve',
      'Nova compra, em breve',
      'Casa, em breve',
      'Ajustes, em breve',
    ]);
    expect(items[2].classList).toContain('ws-fab');
  });

  it('em breve não navega', async () => {
    const { root, harness } = await render();
    const soon = Array.from(root.querySelectorAll<HTMLButtonElement>('[wssoon], .is-soon'));
    expect(soon.length).toBeGreaterThan(10);
    for (const button of soon) {
      button.click();
    }
    await harness.fixture.whenStable();
    expect(router.url).toBe('/inicio');
    expect(root.querySelector('.dropdown-menu.show')).toBeNull();
  });
});
