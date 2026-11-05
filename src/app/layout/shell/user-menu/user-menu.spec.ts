import { HttpTestingController } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { USER_RESPONSE_EXAMPLE } from '../../../../testing/api-examples';
import { text } from '../../../../testing/dom';
import { API, httpTestingProviders } from '../../../../testing/http';
import { SessionEnd } from '../../../core/auth/session-end';
import { CurrentUserStore } from '../../../core/user/current-user-store';
import { ICON_PATHS } from '../../../shared/ui/icon/icons';
import { MSG_USER_UNAVAILABLE } from '../shell.messages';
import { UserMenu } from './user-menu';

@Component({ template: '' })
class Blank {}

describe('UserMenu', () => {
  let logout: ReturnType<typeof vi.fn>;

  async function render(name: string | null) {
    logout = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        ...httpTestingProviders(),
        provideRouter([
          {
            path: 'configuracoes',
            children: [
              { path: '', pathMatch: 'full', redirectTo: 'conta' },
              { path: 'conta', component: Blank },
            ],
          },
        ]),
        { provide: SessionEnd, useValue: { logout } },
      ],
    });
    const http = TestBed.inject(HttpTestingController);
    const loading = TestBed.inject(CurrentUserStore).load();
    const req = http.expectOne(`${API}/users/me`);
    if (name === null) {
      req.flush({}, { status: 500, statusText: 'x' });
    } else {
      req.flush({ ...USER_RESPONSE_EXAMPLE, name });
    }
    await loading;
    const fixture = TestBed.createComponent(UserMenu);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const items = () => Array.from(root.querySelectorAll<HTMLElement>('[role=menuitem]'));
    const button = root.querySelector<HTMLButtonElement>('#ws-user-btn')!;
    const key = async (target: HTMLElement, k: string) => {
      target.dispatchEvent(
        new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }),
      );
      await fixture.whenStable();
    };
    return { fixture, root, items, button, key, menu: root.querySelector('.dropdown-menu')! };
  }

  it('avatar', async () => {
    const { root, button } = await render('Jonas Silva');
    expect(text(button)).toBe('JS Jonas Silva Menu da conta');
    expect(text(root.querySelector('.ws-avatar'))).toBe('JS');
    expect(text(root.querySelector('.ws-user-name'))).toBe('Jonas Silva');
  });

  it('avatar com uma palavra', async () => {
    const { root } = await render('Jonas');
    expect(text(root.querySelector('.ws-avatar'))).toBe('J');
  });

  it('menu aberto', async () => {
    const { fixture, root, items, button, menu } = await render('Ana Souza');
    expect(root.classList).toContain('ws-user-menu');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-haspopup')).toBe('menu');
    expect(button.getAttribute('aria-controls')).toBe('ws-user-menu-list');
    button.click();
    await fixture.whenStable();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(menu.classList).toContain('show');
    expect(text(menu.querySelector('.fw-bold'))).toBe('Ana Souza');
    expect(text(menu.querySelector('.small'))).toBe('ana@exemplo.com');
    expect(items().map(text)).toEqual(['Meu perfil', 'Configurações', 'Sair']);
    expect(items().map((i) => i.getAttribute('aria-disabled'))).toEqual([null, null, null]);
    expect(items().map((i) => [i.tagName, i.getAttribute('href')])).toEqual([
      ['A', '/configuracoes/conta'],
      ['A', '/configuracoes'],
      ['BUTTON', null],
    ]);
    expect(document.activeElement).toBe(items()[0]);
  });

  it('menu do usuário abre Conta', async () => {
    const { fixture, items, button, key, menu } = await render('Ana Souza');
    const router = TestBed.inject(Router);
    button.click();
    await fixture.whenStable();
    items()[0].click();
    await fixture.whenStable();
    expect(router.url).toBe('/configuracoes/conta');
    expect(menu.classList).not.toContain('show');

    await router.navigateByUrl('/');
    await key(button, 'ArrowDown');
    await key(items()[0], 'ArrowDown');
    expect(document.activeElement).toBe(items()[1]);
    // Enter on a link: the browser turns it into a click (the e2e presses the real key).
    items()[1].click();
    await fixture.whenStable();
    expect(router.url).toBe('/configuracoes/conta');
    expect(menu.classList).not.toContain('show');
  });

  it('teclado do menu', async () => {
    const { items, button, key, menu } = await render('Ana Souza');
    await key(button, 'ArrowDown');
    expect(menu.classList).toContain('show');
    expect(document.activeElement).toBe(items()[0]);
    await key(items()[0], 'ArrowDown');
    expect(document.activeElement).toBe(items()[1]);
    await key(items()[1], 'ArrowDown');
    await key(items()[2], 'ArrowDown');
    expect(document.activeElement).toBe(items()[0]);
    await key(items()[0], 'ArrowUp');
    expect(document.activeElement).toBe(items()[2]);
    await key(items()[2], 'Home');
    expect(document.activeElement).toBe(items()[0]);
    await key(items()[0], 'End');
    expect(document.activeElement).toBe(items()[2]);
    await key(items()[2], 'Escape');
    expect(menu.classList).not.toContain('show');
    expect(document.activeElement).toBe(button);
    await key(button, 'ArrowUp');
    expect(document.activeElement).toBe(items()[2]);
  });

  it('fecha com Tab e clique fora', async () => {
    const { fixture, items, button, key, menu } = await render('Ana Souza');
    button.click();
    await fixture.whenStable();
    await key(items()[0], 'Tab');
    expect(menu.classList).not.toContain('show');
    button.click();
    await fixture.whenStable();
    expect(menu.classList).toContain('show');
    document.body.click();
    await fixture.whenStable();
    expect(menu.classList).not.toContain('show');
  });

  it('dados indisponíveis', async () => {
    const { root, items, button } = await render(null);
    expect(text(button)).toBe('Menu da conta');
    const avatar = root.querySelector('.ws-avatar')!;
    expect(text(avatar)).toBe('');
    expect(avatar.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS.user);
    expect(root.querySelector('.ws-user-name')).toBeNull();
    expect(text(root.querySelector('.dropdown-menu .px-2'))).toBe(MSG_USER_UNAVAILABLE);
    expect(items().map(text)).toContain('Sair');
  });

  it('sair', async () => {
    const { fixture, items, button, menu } = await render('Ana Souza');
    button.click();
    await fixture.whenStable();
    items()[2].click();
    await fixture.whenStable();
    expect(logout).toHaveBeenCalledTimes(1);
    expect(menu.classList).not.toContain('show');
  });
});
