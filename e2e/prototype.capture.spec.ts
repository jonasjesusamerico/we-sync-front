// Captures of each screen of features 005 and 006 and of the same screen of the prototype, at 1280 and 360 px,
// light and dark, saved in test-results/capture/<tela>-<largura>-<tema>-{app,prototipo}.png (D-17). No pixel
// assertion.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Page } from '@playwright/test';
import { ANA } from './support/api-mock';
import { expect, test } from './support/fixtures';
import { fixedToday, seedOctober } from './support/purchases';
import { seedSession, seedTheme } from './support/session';
import { JONAS, seedCatalog } from './support/settings';

const OUT = 'test-results/capture';
const PROTOTYPE = resolve(__dirname, '../../we-sync-requirements/prototype');
/** Prototype data: today 31/10/2026, the 18 purchases of October and September = R$ 4.120,00. */
const TODAY = new Date(2026, 9, 31, 12);

interface Screen {
  name: string;
  /** App path; `aluguel` is replaced by the id of the "Aluguel" purchase. */
  app: string;
  /** File of the prototype, with an optional `?query` and then an optional `#fragment`. */
  prototype: string;
  ready: (page: Page) => Promise<void>;
  /** Feature 006: the prototype's user (Jonas) with its own categories and payment methods (seedCatalog). */
  settings?: boolean;
}

const SCREENS: Screen[] = [
  {
    name: 'compras',
    app: '/compras?ano=2026&mes=10',
    prototype: 'compras.html',
    ready: (page) => expect(page.locator('#rows tr, #cards li').first()).toBeAttached(),
  },
  {
    name: 'nova',
    app: '/compras/nova',
    prototype: 'nova-compra.html',
    ready: (page) => expect(page.locator('#categories input').first()).toBeAttached(),
  },
  {
    name: 'editar',
    app: '/compras/aluguel',
    prototype: 'nova-compra.html?editar=esta',
    ready: (page) => expect(page.locator('#description')).toHaveValue('Aluguel'),
  },
  {
    name: 'inicio',
    app: '/inicio?ano=2026&mes=10',
    prototype: 'dashboard.html',
    ready: (page) => expect(page.locator('#kpi-total')).toBeVisible(),
  },
  {
    name: 'conta',
    app: '/configuracoes/conta',
    prototype: 'configuracoes.html#conta',
    ready: (page) => expect(page.locator('#acc-name')).toHaveValue('Jonas'),
    settings: true,
  },
  {
    name: 'categorias',
    app: '/configuracoes/categorias',
    prototype: 'configuracoes.html#categorias',
    ready: (page) => expect(page.locator('li.ws-tx').first()).toBeVisible(),
    settings: true,
  },
  {
    name: 'pagamentos',
    app: '/configuracoes/formas-de-pagamento',
    prototype: 'configuracoes.html#pagamentos',
    ready: (page) => expect(page.locator('li.ws-tx').first()).toBeVisible(),
    settings: true,
  },
];

for (const screen of SCREENS) {
  for (const width of [1280, 360]) {
    for (const theme of ['light', 'dark'] as const) {
      test(`${screen.name} ${width}px ${theme}`, async ({ page, context, api }) => {
        const height = width === 1280 ? 800 : 740;
        const file = `${OUT}/${screen.name}-${width}-${theme}`;
        await page.setViewportSize({ width, height });
        await seedTheme(context, theme);
        const user = screen.settings ? JONAS : ANA;
        api.addUser(user);
        if (screen.settings) {
          seedCatalog(api, user.email);
        }
        const [aluguel] = seedOctober(api, user.email);
        api.addPurchase(user.email, {
          date: '2026-09-15',
          description: 'Setembro',
          categoryId: 3,
          paymentMethodId: 6,
          cents: 412000,
          status: 'PAID',
        });
        await fixedToday(page, TODAY);
        await seedSession(page, api.issueSession(user.email));
        await page.goto(screen.app.replace('aluguel', String(aluguel)));
        await screen.ready(page);
        await page.waitForFunction(() => document.getAnimations().length === 0);
        await page.screenshot({ path: `${file}-app.png`, fullPage: true });

        const proto = await context.newPage();
        await proto.setViewportSize({ width, height });
        await proto.clock.install({ time: TODAY });
        await proto.addInitScript((value) => localStorage.setItem('ws-theme', value), theme);
        const [path, fragment = ''] = screen.prototype.split('#');
        const [htmlFile, query = ''] = path.split('?');
        const url = pathToFileURL(`${PROTOTYPE}/${htmlFile}`);
        url.search = new URLSearchParams(query).toString();
        url.searchParams.set('semtour', '1');
        url.hash = fragment;
        await proto.goto(url.href);
        await proto.waitForTimeout(300);
        await proto.screenshot({ path: `${file}-prototipo.png`, fullPage: true });
      });
    }
  }
}
