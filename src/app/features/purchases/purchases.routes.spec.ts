import { BreakpointObserver } from '@angular/cdk/layout';
import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import localePt from '@angular/common/locales/pt';
import { TestBed } from '@angular/core/testing';
import { DateAdapter, MATERIAL_ANIMATIONS } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { FakeBreakpointObserver } from '../../../testing/fake-breakpoint-observer';
import { routes } from '../../app.routes';
import { SESSION_KEY } from '../../core/auth/session.store';
import { API_BASE_URL } from '../../core/http/api-base-url';
import { BrDateAdapter } from './br-date-adapter';
import { PurchaseFormPage } from './form/purchase-form.page';
import { PurchaseListPage } from './list/purchase-list.page';

registerLocaleData(localePt);

describe('PURCHASE_ROUTES', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ access_token: 'A1', refresh_token: 'R1' }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        { provide: BreakpointObserver, useClass: FakeBreakpointObserver },
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => localStorage.clear());

  /** O componente da rota mais funda (o harness devolve o Shell, que é a rota de cima). */
  async function open(url: string) {
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
    const root = harness.fixture.debugElement;
    const page =
      root.query((d) => d.componentInstance instanceof PurchaseListPage) ??
      root.query((d) => d.componentInstance instanceof PurchaseFormPage);
    return page;
  }

  it('rotas da feature', async () => {
    const cases = [
      ['/lancamentos', PurchaseListPage, 'Lançamentos · we-sync', 'Lançamentos'],
      ['/lancamentos/novo', PurchaseFormPage, 'Novo lançamento · we-sync', 'Novo lançamento'],
      ['/lancamentos/42', PurchaseFormPage, 'Editar lançamento · we-sync', 'Editar lançamento'],
    ] as const;
    for (const [url, component, title, heading] of cases) {
      const page = await open(url);
      expect(page.componentInstance).toBeInstanceOf(component);
      expect(document.title).toBe(title);
      expect((page.nativeElement as HTMLElement).querySelector('h1')?.textContent).toBe(heading);
    }
  });

  it('adapter da feature', async () => {
    const page = await open('/lancamentos/novo');
    expect(page.injector.get(DateAdapter)).toBeInstanceOf(BrDateAdapter);
  });
});
