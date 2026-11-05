import { HttpTestingController } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { USER_RESPONSE_EXAMPLE } from '../../../testing/api-examples';
import { text } from '../../../testing/dom';
import { API, httpTestingProviders } from '../../../testing/http';
import { TODAY } from '../../core/navigation/today';
import { CurrentUserStore } from '../../core/user/current-user-store';
import { Shell } from './shell';
import * as t from './shell.messages';

@Component({ template: '<h1>Página</h1>' })
class Blank {}

describe('Shell', () => {
  let router: Router;

  async function render(url = '/inicio') {
    TestBed.configureTestingModule({
      providers: [
        ...httpTestingProviders(),
        { provide: TODAY, useValue: () => ({ year: 2026, month: 11, day: 10 }) },
        provideRouter([
          {
            path: '',
            component: Shell,
            children: [
              { path: 'inicio', component: Blank },
              { path: 'compras', component: Blank },
              { path: 'compras/nova', component: Blank },
              { path: 'compras/:id', component: Blank },
              { path: 'configuracoes/conta', component: Blank },
              { path: 'configuracoes/categorias', component: Blank },
            ],
          },
        ]),
      ],
    });
    router = TestBed.inject(Router);
    const http = TestBed.inject(HttpTestingController);
    const loading = TestBed.inject(CurrentUserStore).load();
    http.expectOne(`${API}/users/me`).flush(USER_RESPONSE_EXAMPLE);
    await loading;
    const harness = await RouterTestingHarness.create(url);
    const root = harness.fixture.nativeElement as HTMLElement;
    const newPurchaseLinks = () => ({
      topbar: root.querySelector<HTMLAnchorElement>('#ws-topbar a.btn-primary')!,
      card: root.querySelector<HTMLAnchorElement>('.ws-sidebar-card a.btn')!,
      fab: root.querySelector<HTMLAnchorElement>('#ws-bottomnav a.ws-fab')!,
    });
    return { root, harness, newPurchaseLinks };
  }

  const lastState = () => router.lastSuccessfulNavigation()?.extras.state;
  const purchasesLink = (root: HTMLElement, where: string) =>
    Array.from(root.querySelectorAll<HTMLAnchorElement>(`${where} a`)).find(
      (a) => text(a) === 'Compras',
    )!;

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
    const links = Array.from(aside.querySelectorAll('a.ws-nav-link'));
    expect(links.map(text)).toEqual(['Início', 'Compras', 'Configurações']);
    expect(links[2].getAttribute('href')).toBe('/configuracoes');
    expect(links[0].getAttribute('aria-current')).toBe('page');
    expect(links[1].getAttribute('href')).toBe('/compras');
    expect(links[1].getAttribute('aria-current')).toBeNull();
    const soon = Array.from(aside.querySelectorAll<HTMLButtonElement>('button.ws-nav-link'));
    expect(soon.map(text)).toEqual([
      'Nossa casa em breve',
      'Metas e relatórios em breve',
      'Investimentos em breve',
    ]);
    soon.forEach((b) => expect(b.getAttribute('aria-disabled')).toBe('true'));
    const card = aside.querySelector('.ws-sidebar-card')!;
    expect(text(card.querySelector('strong'))).toBe(t.SIDEBAR_CARD_TITLE);
    const cardLink = card.querySelector('a.btn')!;
    expect(text(cardLink)).toBe('Nova compra');
    expect(cardLink.getAttribute('href')).toBe('/compras/nova');
    expect(cardLink.hasAttribute('aria-disabled')).toBe(false);
  });

  it('barra superior', async () => {
    const { root, newPurchaseLinks } = await render();
    const bar = root.querySelector('header#ws-topbar')!;
    const labels = Array.from(bar.querySelectorAll('button')).map((b) =>
      b.getAttribute('aria-label'),
    );
    expect(labels).toEqual(['Usar tema escuro', 'Notificações, em breve', null, null]);
    expect(
      Array.from(bar.querySelectorAll<HTMLAnchorElement>('.dropdown-menu a')).map((a) => [
        text(a),
        a.getAttribute('href'),
      ]),
    ).toEqual([
      ['Meu perfil', '/configuracoes/conta'],
      ['Configurações', '/configuracoes'],
    ]);
    const topbar = newPurchaseLinks().topbar;
    expect(text(topbar)).toBe('Nova compra');
    expect(topbar.getAttribute('href')).toBe('/compras/nova');
    expect(topbar.classList).toContain('d-lg-inline-flex');
    expect(text(bar.querySelector('#ws-user-btn'))).toBe('AS Ana Souza Menu da conta');
    expect(bar.querySelector('[aria-label*="Ajuda"]')).toBeNull();
  });

  it('menu inferior', async () => {
    const { root } = await render();
    const nav = root.querySelector('nav#ws-bottomnav')!;
    expect(nav.getAttribute('aria-label')).toBe(t.LABEL_BOTTOM_NAV);
    const items = Array.from(nav.children) as HTMLElement[];
    expect(items.map((el) => el.tagName)).toEqual(['A', 'A', 'A', 'BUTTON', 'A']);
    expect(items.slice(0, 2).map(text)).toEqual(['Início', 'Compras']);
    expect(items[0].getAttribute('aria-current')).toBe('page');
    expect(items[1].getAttribute('href')).toBe('/compras');
    expect(items[2].classList).toContain('ws-fab');
    expect(items[2].getAttribute('aria-label')).toBe('Nova compra');
    expect(items[2].getAttribute('href')).toBe('/compras/nova');
    expect(items[3].getAttribute('aria-label')).toBe('Casa, em breve');
    expect(text(items[4])).toBe('Ajustes');
    expect(items[4].getAttribute('href')).toBe('/configuracoes');
  });

  it('Compras navega (lateral e inferior)', async () => {
    const { root, harness } = await render();
    purchasesLink(root, '#ws-sidebar').click();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/compras');
    await harness.navigateByUrl('/inicio');
    purchasesLink(root, '#ws-bottomnav').click();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/compras');
  });

  it.each(['topbar', 'card', 'fab'] as const)(
    'Nova compra navega com a origem do Início (%s)',
    async (which) => {
      const { harness, newPurchaseLinks } = await render('/inicio?ano=2026&mes=9');
      newPurchaseLinks()[which].click();
      await harness.fixture.whenStable();
      expect(router.url).toBe('/compras/nova');
      expect(lastState()).toEqual({ wsOrigin: { screen: 'inicio', year: 2026, month: 9 } });
    },
  );

  it('origem de Compras', async () => {
    const { harness, newPurchaseLinks } = await render('/compras?ano=2026&mes=9&busca=uber');
    newPurchaseLinks().fab.click();
    await harness.fixture.whenStable();
    expect(lastState()).toEqual({
      wsOrigin: {
        screen: 'compras',
        query: { year: 2026, month: 9, search: 'uber', categoryId: null, status: null, page: 1 },
      },
    });
  });

  it('sem origem a partir da edição', async () => {
    const { harness, newPurchaseLinks } = await render('/compras/42');
    newPurchaseLinks().topbar.click();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/compras/nova');
    expect(lastState()?.['wsOrigin']).toBeUndefined();
  });

  it.each(['/compras/nova', '/compras/42', '/compras?ano=2026&mes=9'])(
    'Compras ativo em %s',
    async (url) => {
      const { root } = await render(url);
      expect(purchasesLink(root, '#ws-sidebar').getAttribute('aria-current')).toBe('page');
      expect(purchasesLink(root, '#ws-bottomnav').getAttribute('aria-current')).toBe('page');
      const home = Array.from(root.querySelectorAll('#ws-sidebar a')).find(
        (a) => text(a) === 'Início',
      )!;
      expect(home.getAttribute('aria-current')).toBeNull();
    },
  );

  it('Início ativo com query', async () => {
    const { root } = await render('/inicio?ano=2026&mes=9');
    expect(root.querySelector('#ws-sidebar a.ws-nav-link')!.getAttribute('aria-current')).toBe(
      'page',
    );
  });

  it('hosts do aviso e da confirmação', async () => {
    const { root } = await render();
    expect(root.querySelector('ws-toast-host')).not.toBeNull();
    expect(root.querySelector('ws-confirm-host dialog.ws-dialog')).not.toBeNull();
  });

  it('em breve não navega', async () => {
    const { root, harness } = await render();
    const soon = Array.from(root.querySelectorAll<HTMLButtonElement>('.is-soon'));
    expect(soon.map((b) => b.getAttribute('aria-label') ?? text(b))).toEqual([
      'Nossa casa em breve',
      'Metas e relatórios em breve',
      'Investimentos em breve',
      'Notificações, em breve',
      'Casa, em breve',
    ]);
    for (const button of soon) {
      button.click();
    }
    await harness.fixture.whenStable();
    expect(router.url).toBe('/inicio');
    expect(root.querySelector('.dropdown-menu.show')).toBeNull();
  });

  it('menu lateral e inferior em Configurações', async () => {
    const { root } = await render('/configuracoes/categorias');
    const settings = Array.from(root.querySelectorAll<HTMLAnchorElement>('#ws-sidebar a')).find(
      (a) => text(a) === 'Configurações',
    )!;
    const short = Array.from(root.querySelectorAll<HTMLAnchorElement>('#ws-bottomnav a')).find(
      (a) => text(a) === 'Ajustes',
    )!;
    expect(settings.getAttribute('aria-current')).toBe('page');
    expect(short.getAttribute('aria-current')).toBe('page');
    expect(text(settings)).not.toContain('em breve');
    expect(short.getAttribute('aria-label')).toBeNull();
  });
});
