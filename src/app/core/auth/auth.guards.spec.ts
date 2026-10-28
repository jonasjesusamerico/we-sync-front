import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet, Routes } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from '../../app.routes';
import { API_BASE_URL } from '../http/api-base-url';
import { authGuard, guestGuard } from './auth.guards';
import { SESSION_KEY } from './session.store';

@Component({ selector: 'app-stub-page', template: 'stub' })
class StubPage {}

@Component({ selector: 'app-stub-shell', imports: [RouterOutlet], template: '<router-outlet />' })
class StubShell {}

/** Rotas de teste com mais filhas sob o Shell, como as telas futuras. */
const deepRoutes: Routes = [
  { path: 'login', canActivate: [guestGuard], component: StubPage },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    component: StubShell,
    children: [
      { path: '', component: StubPage },
      { path: 'compras', component: StubPage },
      { path: 'outra', component: StubPage },
    ],
  },
];

const seed = () =>
  localStorage.setItem(SESSION_KEY, JSON.stringify({ access_token: 'A1', refresh_token: 'R1' }));

async function navigate(url: string, routeConfig: Routes = routes) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routeConfig),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: '/api/v1' },
    ],
  });
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(url);
  return { harness, router: TestBed.inject(Router) };
}

describe('authGuard e guestGuard', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('visitante em rota interna', async () => {
    const { router } = await navigate('/');
    expect(router.url).toBe('/login?returnUrl=%2F');
  });

  it('visitante em rota interna profunda', async () => {
    const { router } = await navigate('/compras?mes=10', deepRoutes);
    expect(router.url).toBe('/login?returnUrl=%2Fcompras%3Fmes%3D10');
    expect(router.parseUrl(router.url).queryParams['returnUrl']).toBe('/compras?mes=10');
  });

  it('autenticado em rota interna', async () => {
    seed();
    const { router } = await navigate('/');
    expect(router.url).toBe('/');
  });

  it('autenticado abre /login', async () => {
    seed();
    const { router } = await navigate('/login');
    expect(router.url).toBe('/');
  });

  it('autenticado abre /cadastro', async () => {
    seed();
    const { router } = await navigate('/cadastro');
    expect(router.url).toBe('/');
  });

  it('visitante abre /login', async () => {
    const { router } = await navigate('/login');
    expect(router.url).toBe('/login');
  });

  it('visitante abre /cadastro', async () => {
    const { router } = await navigate('/cadastro');
    expect(router.url).toBe('/cadastro');
  });

  it('rota desconhecida', async () => {
    const { router } = await navigate('/xyz');
    expect(router.url).toBe('/login?returnUrl=%2F');
  });

  it('canActivateChild relê o storage', async () => {
    seed();
    const { harness, router } = await navigate('/', deepRoutes);
    expect(router.url).toBe('/');

    localStorage.removeItem(SESSION_KEY);
    await harness.navigateByUrl('/outra');

    expect(router.url).toBe('/login?returnUrl=%2Foutra');
  });

  it('com sessão, / abre o Shell', async () => {
    seed();
    const { harness, router } = await navigate('/');
    await harness.fixture.whenStable();
    const el = harness.fixture.nativeElement as HTMLElement;
    expect(router.url).toBe('/');
    expect(el.querySelector('app-shell')).not.toBeNull();
    expect(el.querySelector('app-auth-layout')).toBeNull();
  });

  it('títulos das abas', async () => {
    const { harness } = await navigate('/login');
    expect(document.title).toBe('Entrar · we-sync');
    await harness.navigateByUrl('/cadastro');
    expect(document.title).toBe('Criar conta · we-sync');
    seed();
    await harness.navigateByUrl('/');
    expect(document.title).toBe('Início · we-sync');
  });
});
