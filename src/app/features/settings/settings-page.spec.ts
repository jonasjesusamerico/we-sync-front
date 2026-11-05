import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { text } from '../../../testing/dom';
import { httpTestingProviders } from '../../../testing/http';
import { AccountSection } from './account/account-section';
import { CatalogSection } from './catalog/catalog-section';
import { SettingsPage } from './settings-page';
import { SETTINGS_ROUTES } from './settings.routes';
import * as t from './settings.messages';

describe('SettingsPage', () => {
  let router: Router;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        ...httpTestingProviders(),
        provideRouter(
          [{ path: 'configuracoes', children: SETTINGS_ROUTES }],
          withComponentInputBinding(),
        ),
      ],
    });
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
  });

  const root = () => harness.fixture.nativeElement as HTMLElement;
  const nav = () => root().querySelector<HTMLElement>('nav.ws-settings-nav')!;
  const current = () =>
    Array.from(nav().querySelectorAll('[aria-current="page"]')).map((el) => text(el));

  async function open(url: string) {
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
  }

  it('rotas', async () => {
    const [shell] = SETTINGS_ROUTES;
    expect(await shell.loadComponent!()).toBe(SettingsPage);
    expect(shell.children!.map((c) => [c.path, c.title, c.data?.['kind'], c.redirectTo])).toEqual([
      ['', undefined, undefined, 'conta'],
      ['conta', t.TITLE_SETTINGS, undefined, undefined],
      ['categorias', t.TITLE_SETTINGS, 'category', undefined],
      ['formas-de-pagamento', t.TITLE_SETTINGS, 'payment', undefined],
      ['**', undefined, undefined, 'conta'],
    ]);
    expect(shell.children!.every((c) => c.canDeactivate === undefined)).toBe(true);
    const components = await Promise.all(
      shell.children!.slice(1, 4).map((c) => c.loadComponent!()),
    );
    expect(components).toEqual([AccountSection, CatalogSection, CatalogSection]);
  });

  it('cabeçalho e menu', async () => {
    await open('/configuracoes/conta');
    expect(text(root().querySelector('.ws-page-head h1'))).toBe('Configurações');
    expect(text(root().querySelector('.ws-page-head p'))).toBe(t.SETTINGS_SUBTITLE);
    expect(nav().getAttribute('aria-label')).toBe('Seções das configurações');
    expect(Array.from(nav().children).map((el) => [el.tagName, text(el)])).toEqual([
      ['BUTTON', 'Rendas em breve'],
      ['BUTTON', 'Orçamento em breve'],
      ['A', 'Categorias'],
      ['A', 'Formas de pagamento'],
      ['A', 'Conta'],
    ]);
    expect(Array.from(nav().querySelectorAll('a')).map((a) => a.getAttribute('href'))).toEqual([
      '/configuracoes/categorias',
      '/configuracoes/formas-de-pagamento',
      '/configuracoes/conta',
    ]);
    expect(nav().closest('.col-12.col-lg-3')).not.toBeNull();
    expect(root().querySelector('.col-12.col-lg-9 ws-account-section')).not.toBeNull();
  });

  it.each([
    '/configuracoes',
    '/configuracoes/rendas',
    '/configuracoes/orcamento',
    '/configuracoes/xyz',
  ])('redirecionamento: %s', async (url) => {
    await open(url);
    expect(router.url).toBe('/configuracoes/conta');
    expect(current()).toEqual(['Conta']);
  });

  it('seção atual', async () => {
    await open('/configuracoes/formas-de-pagamento');
    expect(current()).toEqual(['Formas de pagamento']);
    expect(root().querySelector('ws-catalog-section section')!.id).toBe('tab-pagamentos');
    await open('/configuracoes/categorias');
    expect(current()).toEqual(['Categorias']);
  });

  it('em breve', async () => {
    await open('/configuracoes/categorias');
    for (const button of Array.from(nav().querySelectorAll<HTMLButtonElement>('button'))) {
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(button.getAttribute('aria-label')).toBeNull();
      button.click();
      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await harness.fixture.whenStable();
      expect(router.url).toBe('/configuracoes/categorias');
    }
  });

  it('título', async () => {
    for (const url of [
      '/configuracoes/conta',
      '/configuracoes/categorias',
      '/configuracoes/formas-de-pagamento',
    ]) {
      document.title = '';
      await open(url);
      expect(document.title).toBe('Configurações · we-sync');
    }
  });

  it('rola o menu até a seção atual', async () => {
    await open('/configuracoes/conta');
    const link = nav().querySelector<HTMLAnchorElement>('a[aria-current="page"]')!;
    Object.defineProperty(link, 'offsetLeft', { value: 300, configurable: true });
    Object.defineProperty(nav(), 'offsetLeft', { value: 20, configurable: true });
    await open('/configuracoes/categorias');
    const categories = nav().querySelector<HTMLAnchorElement>('a[aria-current="page"]')!;
    Object.defineProperty(categories, 'offsetLeft', { value: 120, configurable: true });
    await open('/configuracoes/conta');
    expect(nav().scrollLeft).toBe(272);
  });
});
