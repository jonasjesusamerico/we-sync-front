import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  ERROR_INTERNAL,
  OVERVIEW_EMPTY_EXAMPLE,
  OVERVIEW_EXAMPLE,
  SUMMARY_FULL_MONTH_EXAMPLE,
  SUMMARY_UNTIL_DAY_EXAMPLE,
  USER_RESPONSE_EXAMPLE,
} from '../../../testing/api-examples';
import { text } from '../../../testing/dom';
import { API, httpTestingProviders } from '../../../testing/http';
import { settle } from '../../../testing/session';
import { MSG_CONNECTION, MSG_SERVER } from '../../core/http/error-messages';
import { TODAY } from '../../core/navigation/today';
import { CurrentUserStore } from '../../core/user/current-user-store';
import { HomePage } from './home-page';
import { HOME_SUBTITLE } from './home.messages';

const SUMMARY = `${API}/purchases/summary`;
const OVERVIEW = `${API}/purchases/overview`;

describe('HomePage', () => {
  let http: HttpTestingController;
  let router: Router;
  let harness: RouterTestingHarness;

  async function render(name: string | null, url = '/inicio?ano=2026&mes=11') {
    TestBed.configureTestingModule({
      providers: [
        ...httpTestingProviders(),
        { provide: TODAY, useValue: () => ({ year: 2026, month: 11, day: 10 }) },
        provideRouter([{ path: 'inicio', component: HomePage }]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    const loading = TestBed.inject(CurrentUserStore).load();
    const req = http.expectOne(`${API}/users/me`);
    if (name === null) {
      req.flush({}, { status: 500, statusText: 'x' });
    } else {
      req.flush({ ...USER_RESPONSE_EXAMPLE, name });
    }
    await loading;
    harness = await RouterTestingHarness.create(url);
    await stable();
    return harness.fixture.nativeElement as HTMLElement;
  }

  const stable = async () => {
    await settle();
    await harness.fixture.whenStable();
  };
  const summaryRequest = () => {
    const requests = http.match((r) => r.url === SUMMARY);
    expect(requests).toHaveLength(1);
    return requests[0];
  };

  const overviewRequest = () => {
    const requests = http.match((r) => r.url === OVERVIEW);
    expect(requests).toHaveLength(1);
    return requests[0];
  };

  afterEach(() => http.verify());

  it('com usuário, seletor e cartão', async () => {
    const root = await render('Ana Souza');
    expect(text(root.querySelector('h1'))).toBe('Olá, Ana Souza');
    expect(text(root.querySelector('.ws-page-head p'))).toBe(HOME_SUBTITLE);
    expect(text(root.querySelector('.ws-month-label'))).toBe('novembro 2026');
    expect(root.querySelector('.ws-hero')).not.toBeNull();
    summaryRequest().flush(SUMMARY_UNTIL_DAY_EXAMPLE);
    overviewRequest().flush(OVERVIEW_EXAMPLE);
  });

  it('sem o aviso "em breve" (CA-09)', async () => {
    const root = await render('Ana Souza');
    expect(root.querySelector('.ws-callout')).toBeNull();
    expect(text(root)).not.toContain('O resumo do seu mês vai aparecer aqui em breve.');
    summaryRequest().flush(SUMMARY_UNTIL_DAY_EXAMPLE);
    overviewRequest().flush(OVERVIEW_EXAMPLE);
  });

  it('sem usuário', async () => {
    const root = await render(null);
    expect(text(root.querySelector('h1'))).toBe('Olá!');
    summaryRequest().flush(SUMMARY_UNTIL_DAY_EXAMPLE);
    overviewRequest().flush(OVERVIEW_EXAMPLE);
  });

  it('conta antiga e nome longo inteiro', async () => {
    const name = 'Maria'.padEnd(60, 'a');
    const root = await render(name);
    expect(text(root.querySelector('h1'))).toBe(`Olá, ${name}`);
    summaryRequest().flush(SUMMARY_UNTIL_DAY_EXAMPLE);
    overviewRequest().flush(OVERVIEW_EXAMPLE);
  });

  it('abre no mês atual', async () => {
    await render('Ana Souza', '/inicio');
    expect(router.url).toBe('/inicio?ano=2026&mes=11');
    expect(summaryRequest().request.urlWithParams).toBe(
      `${SUMMARY}?year=2026&month=11&today=2026-11-10`,
    );
    overviewRequest();
  });

  it('endereço inválido vai para o mês atual', async () => {
    await render('Ana Souza', '/inicio?ano=2026&mes=13&x=1');
    expect(router.url).toBe('/inicio?ano=2026&mes=11');
    summaryRequest().flush(SUMMARY_UNTIL_DAY_EXAMPLE);
    overviewRequest().flush(OVERVIEW_EXAMPLE);
  });

  it('outro mês mostra "Mês atual"', async () => {
    const root = await render('Ana Souza', '/inicio?ano=2026&mes=9');
    expect(text(root.querySelector('.ws-month-label'))).toBe('setembro 2026');
    const current = Array.from(root.querySelectorAll('button')).find(
      (b) => text(b) === 'Mês atual',
    );
    expect(current).toBeDefined();
    summaryRequest().flush(SUMMARY_FULL_MONTH_EXAMPLE);
    overviewRequest().flush({ ...OVERVIEW_EXAMPLE, month: 9, is_current_month: false });
  });

  it('trocar mês: nova chamada e a anterior cancelada', async () => {
    const root = await render('Ana Souza');
    const first = summaryRequest();
    const firstOverview = overviewRequest();
    root.querySelector<HTMLButtonElement>('button[aria-label="Mês anterior"]')!.click();
    await stable();
    expect(router.url).toBe('/inicio?ano=2026&mes=10');
    expect(first.cancelled).toBe(true);
    expect(firstOverview.cancelled).toBe(true);
    const second = summaryRequest();
    expect(second.request.params.get('month')).toBe('10');
    second.flush(SUMMARY_UNTIL_DAY_EXAMPLE);
    overviewRequest().flush({ ...OVERVIEW_EXAMPLE, month: 10 });
  });

  describe('blocos do mês (feature 007)', () => {
    const blockOrder = (root: HTMLElement) =>
      [
        ...root.querySelectorAll(
          'ws-month-kpis, ws-daily-bars, ws-category-donut, ws-latest-purchases, ws-payment-meters',
        ),
      ].map((el) => [el.tagName.toLowerCase(), el.parentElement!.className]);

    it('summary e overview em paralelo', async () => {
      await render('Ana Souza');
      expect(overviewRequest().request.urlWithParams).toBe(
        `${OVERVIEW}?year=2026&month=11&today=2026-11-10`,
      );
      summaryRequest();
    });

    it('carregando', async () => {
      const root = await render('Ana Souza');
      expect(root.querySelector('#hero-col')!.classList).toContain('col-xl-5');
      expect(root.querySelector('#kpi-cards .ws-card [role="status"]')).not.toBeNull();
      expect(root.querySelector('ws-daily-bars')).toBeNull();
      summaryRequest();
      overviewRequest();
    });

    it('blocos na ordem (RF-01)', async () => {
      const root = await render('Ana Souza');
      summaryRequest().flush(SUMMARY_UNTIL_DAY_EXAMPLE);
      overviewRequest().flush(OVERVIEW_EXAMPLE);
      await stable();
      expect(root.querySelector('#kpi-cards ws-month-kpis')).not.toBeNull();
      expect(root.querySelector('#kpi-cards')!.className).toBe('col-12 col-xl-7');
      expect(blockOrder(root)).toEqual([
        ['ws-month-kpis', 'col-12 col-xl-7'],
        ['ws-daily-bars', 'col-12 col-lg-8'],
        ['ws-category-donut', 'col-12 col-lg-4'],
        ['ws-latest-purchases', 'col-12 col-lg-8'],
        ['ws-payment-meters', 'col-12 col-lg-4'],
      ]);
      expect(root.querySelector('#hero-col')!.classList).toContain('col-xl-5');
    });

    it('sem Paga nem Pendente: só o cartão (CA-11, CA-12)', async () => {
      const root = await render('Ana Souza', '/inicio?ano=2026&mes=12');
      summaryRequest().flush({ ...SUMMARY_FULL_MONTH_EXAMPLE, month: 12, purchase_count: 1 });
      overviewRequest().flush(OVERVIEW_EMPTY_EXAMPLE);
      await stable();
      expect(root.querySelector('#hero-col')!.className).toBe('col-12');
      for (const selector of ['#kpi-cards', '.ws-bars', '.ws-donut', '#last-list', '.ws-meter']) {
        expect(root.querySelector(selector), selector).toBeNull();
      }
    });

    it('erro uma vez e Tentar novamente (CA-17)', async () => {
      const root = await render('Ana Souza');
      summaryRequest().flush(SUMMARY_UNTIL_DAY_EXAMPLE);
      overviewRequest().flush(ERROR_INTERNAL, { status: 500, statusText: 'x' });
      await stable();
      const alerts = root.querySelectorAll('[role="alert"]');
      expect(alerts).toHaveLength(1);
      expect(alerts[0].closest('.ws-hero')).toBeNull();
      expect(alerts[0].closest('#kpi-cards')).not.toBeNull();
      expect(text(alerts[0].querySelector('.fw-bold'))).toBe(MSG_SERVER);
      expect(text(root.querySelector('#kpi-total'))).toBe('R$ 150,00');
      alerts[0].querySelector<HTMLButtonElement>('button')!.click();
      await stable();
      expect(http.match((r) => r.url === SUMMARY)).toHaveLength(0);
      overviewRequest().flush(OVERVIEW_EXAMPLE);
      await stable();
      expect(root.querySelector('[role="alert"]')).toBeNull();
      expect(root.querySelector('ws-month-kpis')).not.toBeNull();
      expect(root.querySelector('ws-payment-meters')).not.toBeNull();
    });

    it('sem conexão', async () => {
      const root = await render('Ana Souza');
      summaryRequest().flush(SUMMARY_UNTIL_DAY_EXAMPLE);
      overviewRequest().error(new ProgressEvent('error'));
      await stable();
      expect(text(root.querySelector('#kpi-cards [role="alert"] .fw-bold'))).toBe(MSG_CONNECTION);
    });

    it('resposta inesperada', async () => {
      const root = await render('Ana Souza');
      summaryRequest().flush(SUMMARY_UNTIL_DAY_EXAMPLE);
      overviewRequest().flush({});
      await stable();
      expect(text(root.querySelector('#kpi-cards [role="alert"] .fw-bold'))).toBe(MSG_SERVER);
    });

    it('troca de mês cancela a carga antiga (CA-19)', async () => {
      const root = await render('Ana Souza');
      summaryRequest();
      const november = overviewRequest();
      root.querySelector<HTMLButtonElement>('button[aria-label="Mês anterior"]')!.click();
      await stable();
      expect(november.cancelled).toBe(true);
      summaryRequest();
      const october = overviewRequest();
      expect(october.request.params.get('month')).toBe('10');
      october.flush({ ...OVERVIEW_EXAMPLE, month: 10, is_current_month: false });
      await stable();
      expect(root.querySelector('#daily-bars')!.getAttribute('aria-label')).toBe(
        'Gráfico de gastos por dia de outubro',
      );
    });

    it('cartão falha sozinho', async () => {
      const root = await render('Ana Souza');
      summaryRequest().flush(ERROR_INTERNAL, { status: 500, statusText: 'x' });
      overviewRequest().flush(OVERVIEW_EXAMPLE);
      await stable();
      expect(root.querySelector('.ws-hero [role="alert"]')).not.toBeNull();
      expect(root.querySelectorAll('[role="alert"]')).toHaveLength(1);
      expect(root.querySelector('ws-month-kpis')).not.toBeNull();
      expect(root.querySelector('ws-daily-bars')).not.toBeNull();
    });
  });
});
