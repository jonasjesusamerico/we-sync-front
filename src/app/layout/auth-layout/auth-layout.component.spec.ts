import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, Routes } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { API_BASE_URL } from '../../core/http/api-base-url';
import { LoginPage } from '../../features/auth/login/login.page';
import { RegisterPage } from '../../features/auth/register/register.page';
import { AuthLayoutComponent } from './auth-layout.component';

@Component({
  selector: 'app-stub-login',
  template: 'stub login',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StubLogin {}

@Component({
  selector: 'app-stub-register',
  template: 'stub cadastro',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StubRegister {}

const stubRoutes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: StubLogin },
      { path: 'cadastro', component: StubRegister },
    ],
  },
];

const realRoutes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginPage },
      { path: 'cadastro', component: RegisterPage },
    ],
  },
];

describe('AuthLayoutComponent', () => {
  async function open(url: string, routes: Routes = stubRoutes) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
    const el = harness.fixture.nativeElement as HTMLElement;
    return {
      harness,
      el,
      router: TestBed.inject(Router),
      tabs: () => Array.from(el.querySelectorAll<HTMLAnchorElement>('a[role="tab"]')),
      tab: (name: string) =>
        Array.from(el.querySelectorAll<HTMLAnchorElement>('a[role="tab"]')).find(
          (a) => a.textContent?.trim() === name,
        ) as HTMLAnchorElement,
    };
  }

  it('abas', async () => {
    const { el, tabs } = await open('/login');
    expect(el.querySelector('nav[aria-label="Acesso"]')).not.toBeNull();
    const links = tabs();
    expect(links).toHaveLength(2);
    expect(links.map((a) => a.getAttribute('role'))).toEqual(['tab', 'tab']);
    expect(links.map((a) => a.textContent?.trim())).toEqual(['Entrar', 'Criar conta']);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/login', '/cadastro']);
  });

  it('Entrar ativa em /login', async () => {
    const { el, tab } = await open('/login');
    expect(tab('Entrar').getAttribute('aria-selected')).toBe('true');
    expect(tab('Criar conta').getAttribute('aria-selected')).toBe('false');
    expect(el.querySelector('[role="tabpanel"] app-stub-login')).not.toBeNull();
  });

  it('Criar conta ativa em /cadastro', async () => {
    const { el, tab } = await open('/cadastro');
    expect(tab('Criar conta').getAttribute('aria-selected')).toBe('true');
    expect(tab('Entrar').getAttribute('aria-selected')).toBe('false');
    expect(el.querySelector('[role="tabpanel"] app-stub-register')).not.toBeNull();
  });

  it('trocar de aba troca a URL', async () => {
    const { harness, router, tab } = await open('/login');
    tab('Criar conta').click();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/cadastro');
    expect(tab('Criar conta').getAttribute('aria-selected')).toBe('true');
    expect(tab('Entrar').getAttribute('aria-selected')).toBe('false');
  });

  it('cartão sobre o degradê, com a marca', async () => {
    const { el } = await open('/login');
    const layout = el.querySelector('app-auth-layout') as HTMLElement;
    expect(layout.classList).toContain('bg-plum-plate');
    const brand = layout.querySelector('app-brand') as HTMLElement;
    expect(brand.classList).toContain('large');
    expect(brand.classList).not.toContain('primary');
    expect(layout.querySelector('.card [role="tablist"]')).not.toBeNull();
  });

  it('abas ligadas ao painel, foco só na ativa', async () => {
    const { el, tab } = await open('/login');
    const panel = el.querySelector('[role="tabpanel"]') as HTMLElement;
    expect(tab('Entrar').getAttribute('aria-controls')).toBe(panel.id);
    expect(tab('Entrar').getAttribute('tabindex')).toBe('0');
    expect(tab('Criar conta').getAttribute('tabindex')).toBe('-1');
  });

  it('setas movem o foco entre as abas', async () => {
    const { tab } = await open('/login');
    const press = (key: string) =>
      document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    tab('Entrar').focus();
    press('ArrowRight');
    expect(document.activeElement).toBe(tab('Criar conta'));
    press('ArrowRight');
    expect(document.activeElement).toBe(tab('Entrar'));
    press('End');
    expect(document.activeElement).toBe(tab('Criar conta'));
    press('Home');
    expect(document.activeElement).toBe(tab('Entrar'));
  });

  it('sem Google e sem esqueci a senha', async () => {
    const { harness, el, router } = await open('/login', realRoutes);
    expect(el.querySelector('app-login-page')).not.toBeNull();
    expect(el.textContent).not.toMatch(/google|esqueci/i);

    await router.navigateByUrl('/cadastro');
    await harness.fixture.whenStable();
    expect(el.querySelector('app-register-page')).not.toBeNull();
    expect(el.textContent).not.toMatch(/google|esqueci/i);
  });
});
