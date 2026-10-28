import { BreakpointObserver } from '@angular/cdk/layout';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatSidenavHarness } from '@angular/material/sidenav/testing';
import { provideRouter, Router } from '@angular/router';

import { FakeBreakpointObserver } from '../../testing/fake-breakpoint-observer';
import { SESSION_KEY } from '../core/auth/session.store';
import { API_BASE_URL } from '../core/http/api-base-url';
import { LABEL_ACCOUNT, LABEL_HOME, LABEL_LOGOUT, LABEL_OPEN_MENU } from './layout.messages';
import { ShellComponent } from './shell.component';

const LOGOUT = '/api/v1/auth/logout';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class StubPage {}

describe('ShellComponent', () => {
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '', component: StubPage }]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        { provide: BreakpointObserver, useClass: FakeBreakpointObserver },
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    http.verify();
    localStorage.clear();
  });

  const fake = () => TestBed.inject(BreakpointObserver) as unknown as FakeBreakpointObserver;

  async function render({ withSession = true, wide = true } = {}) {
    if (withSession) {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ access_token: 'A1', refresh_token: 'R1' }),
      );
    }
    fake().setWide(wide);
    const fixture = TestBed.createComponent(ShellComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const loader = TestbedHarnessEnvironment.loader(fixture);
    return {
      fixture,
      el,
      sidenav: () => loader.getHarness(MatSidenavHarness),
      menuButton: () =>
        el.querySelector(`button[aria-label="${LABEL_OPEN_MENU}"]`) as HTMLButtonElement | null,
      navLinks: () => Array.from(el.querySelectorAll<HTMLAnchorElement>('a[mat-list-item]')),
    };
  }

  /** Abre o menu de conta e devolve o item `Sair`, que fica no overlay (fora do fixture). */
  async function openAccountMenu(fixture: ComponentFixture<ShellComponent>) {
    const el = fixture.nativeElement as HTMLElement;
    (el.querySelector(`button[aria-label="${LABEL_ACCOUNT}"]`) as HTMLButtonElement).click();
    await fixture.whenStable();
    return document.querySelector('[mat-menu-item]') as HTMLButtonElement;
  }

  async function clickLogout(fixture: ComponentFixture<ShellComponent>) {
    (await openAccountMenu(fixture)).click();
    await fixture.whenStable();
  }

  function expectLoggedOut(el: HTMLElement) {
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
    expect(el.querySelector('[role=alert], [role=status], mat-snack-bar-container')).toBeNull();
    expect(document.querySelector('mat-snack-bar-container')).toBeNull();
  }

  // Casos da 001 ajustados: o Sair passa pelo menu de conta.

  it('mostra o topo', async () => {
    const { el, menuButton } = await render();
    const toolbar = el.querySelector('mat-toolbar') as HTMLElement;
    expect(toolbar.querySelector('app-brand')?.textContent).toContain('we-sync');
    expect(toolbar.querySelector(`button[aria-label="${LABEL_ACCOUNT}"]`)).not.toBeNull();
    expect(menuButton()).toBeNull();
    expect(el.querySelector('main router-outlet')).not.toBeNull();
  });

  it('Sair com 204', async () => {
    const { fixture, el } = await render();
    await clickLogout(fixture);

    const req = http.expectOne(LOGOUT);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refresh_token: 'R1' });
    expect(navigate).not.toHaveBeenCalled();
    req.flush(null, { status: 204, statusText: 'No Content' });

    expectLoggedOut(el);
  });

  it('Sair com 500', async () => {
    const { fixture, el } = await render();
    await clickLogout(fixture);

    http
      .expectOne(LOGOUT)
      .flush(
        { code: 'INTERNAL_SERVER_ERROR', message: 'internal server error' },
        { status: 500, statusText: 'Internal Server Error' },
      );
    await fixture.whenStable();

    expectLoggedOut(el);
    expect(el.textContent).not.toContain('internal server error');
    expect(document.body.textContent).not.toContain('internal server error');
  });

  it('Sair sem rede', async () => {
    const { fixture, el } = await render();
    await clickLogout(fixture);

    http.expectOne(LOGOUT).error(new ProgressEvent('error'));
    await fixture.whenStable();

    expectLoggedOut(el);
  });

  it('Sair com timeout', async () => {
    const { fixture, el } = await render();
    const item = await openAccountMenu(fixture);
    vi.useFakeTimers();
    item.click();

    const req = http.expectOne(LOGOUT);
    vi.advanceTimersByTime(5_000);

    expect(req.cancelled).toBe(true);
    expectLoggedOut(el);
  });

  it('Sair duas vezes', async () => {
    const { fixture } = await render();
    await clickLogout(fixture);
    const item = await openAccountMenu(fixture);
    item.click();
    await fixture.whenStable();

    const req = http.expectOne(LOGOUT);
    expect(item.disabled).toBe(true);
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('Sair sem sessão', async () => {
    const { fixture, el } = await render({ withSession: false });
    await clickLogout(fixture);

    http.expectNone(LOGOUT);
    expectLoggedOut(el);
  });

  // Casos novos (feature 002).

  it('menu fixo no modo largo', async () => {
    const { sidenav, menuButton } = await render({ wide: true });
    const harness = await sidenav();
    expect(await harness.getMode()).toBe('side');
    expect(await harness.isOpen()).toBe(true);
    expect(menuButton()).toBeNull();
  });

  it('menu escondido no modo estreito', async () => {
    const { sidenav, menuButton } = await render({ wide: false });
    const harness = await sidenav();
    expect(await harness.getMode()).toBe('over');
    expect(await harness.isOpen()).toBe(false);
    expect(menuButton()?.getAttribute('aria-expanded')).toBe('false');
    expect(menuButton()?.getAttribute('aria-controls')).toBe('app-sidenav');
  });

  it('☰ abre o menu', async () => {
    const { fixture, sidenav, menuButton } = await render({ wide: false });
    menuButton()!.click();
    await fixture.whenStable();
    expect(await (await sidenav()).isOpen()).toBe(true);
    expect(menuButton()?.getAttribute('aria-expanded')).toBe('true');
  });

  it('escolher o item fecha', async () => {
    const { fixture, sidenav, menuButton, navLinks } = await render({ wide: false });
    menuButton()!.click();
    await fixture.whenStable();
    navLinks()[0].click();
    await fixture.whenStable();
    expect(await (await sidenav()).isOpen()).toBe(false);
  });

  it('cruza o breakpoint', async () => {
    const { fixture, sidenav, menuButton } = await render({ wide: false });
    menuButton()!.click();
    await fixture.whenStable();

    fake().setWide(true);
    await fixture.whenStable();
    let harness = await sidenav();
    expect(await harness.getMode()).toBe('side');
    expect(await harness.isOpen()).toBe(true);

    fake().setWide(false);
    await fixture.whenStable();
    harness = await sidenav();
    expect(await harness.getMode()).toBe('over');
    expect(await harness.isOpen()).toBe(false);
  });

  it('clique no item no modo largo', async () => {
    const { fixture, sidenav, navLinks } = await render({ wide: true });
    navLinks()[0].click();
    await fixture.whenStable();
    expect(await (await sidenav()).isOpen()).toBe(true);
  });

  it('menu com um item', async () => {
    const { el, navLinks } = await render();
    const links = navLinks();
    expect(links).toHaveLength(1);
    expect(links[0].querySelector('[matListItemTitle]')?.textContent).toBe(LABEL_HOME);
    expect(links[0].querySelector('[matListItemIcon]')?.textContent).toBe('home');
    expect(links[0].getAttribute('href')).toBe('/');
    expect(el.querySelector('nav[aria-label="Navegação principal"] a[mat-list-item]')).toBe(
      links[0],
    );
  });

  it('item ativo', async () => {
    const { fixture, navLinks } = await render();
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    const link = navLinks()[0];
    expect(link.classList).toContain('nav-active');
    expect(link.getAttribute('aria-current')).toBe('page');
  });

  it('menu de conta', async () => {
    const { fixture } = await render();
    await openAccountMenu(fixture);
    const items = document.querySelectorAll<HTMLButtonElement>('[mat-menu-item]');
    expect(items).toHaveLength(1);
    expect(items[0].textContent?.trim()).toBe(LABEL_LOGOUT);
    expect(items[0].disabled).toBe(false);
  });
});
