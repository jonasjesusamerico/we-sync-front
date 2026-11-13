import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import {
  ERROR_INTERNAL,
  SUMMARY_FULL_MONTH_EXAMPLE,
  SUMMARY_NO_BASE_EXAMPLE,
  SUMMARY_SHORTER_MONTH_EXAMPLE,
  SUMMARY_UNTIL_DAY_EXAMPLE,
} from '../../../../testing/api-examples';
import { text } from '../../../../testing/dom';
import { API, httpTestingProviders } from '../../../../testing/http';
import { settle } from '../../../../testing/session';
import { MSG_SERVER } from '../../../core/http/error-messages';
import { TODAY } from '../../../core/navigation/today';
import type { PlainDate, YearMonth } from '../../../shared/date/plain-date';
import { ICON_PATHS } from '../../../shared/ui/icon/icons';
import type { MonthSummary } from '../../purchases/data/purchase.models';
import { SpendingCard } from './spending-card';

@Component({
  imports: [SpendingCard],
  template: `<ws-spending-card [month]="month()" />`,
})
class Host {
  readonly month = signal<YearMonth>({ year: 2026, month: 11 });
}

@Component({ template: '<h1>Outra</h1>' })
class Blank {}

const SUMMARY = `${API}/purchases/summary`;

describe('SpendingCard (cartão do gasto)', () => {
  let http: HttpTestingController;

  async function render(
    month: YearMonth = { year: 2026, month: 11 },
    today: PlainDate = { year: 2026, month: 11, day: 10 },
  ) {
    TestBed.configureTestingModule({
      providers: [
        ...httpTestingProviders(),
        { provide: TODAY, useValue: () => today },
        provideRouter([
          { path: 'compras', component: Blank },
          { path: 'compras/nova', component: Blank },
        ]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.month.set(month);
    await fixture.whenStable();
    await settle();
    const root = fixture.nativeElement as HTMLElement;
    const stable = async () => {
      await settle();
      await fixture.whenStable();
    };
    const request = (): TestRequest => {
      const requests = http.match((r) => r.url === SUMMARY);
      expect(requests).toHaveLength(1);
      return requests[0];
    };
    const respond = async (summary: MonthSummary) => {
      request().flush(summary);
      await stable();
    };
    return { fixture, root, stable, request, respond };
  }

  afterEach(() => http.verify());

  it('carregando', async () => {
    const { root, request } = await render();
    expect(text(root.querySelector('#hero-label'))).toBe('Gasto em novembro');
    expect(root.querySelector('.ws-hero [role="status"] .spinner-border')).not.toBeNull();
    expect(root.querySelector('.ws-empty')).toBeNull();
    expect(request().request.urlWithParams).toBe(`${SUMMARY}?year=2026&month=11&today=2026-11-10`);
  });

  it('cartão do mês (CA-03)', async () => {
    const { root, respond } = await render();
    await respond(SUMMARY_UNTIL_DAY_EXAMPLE);
    expect(text(root.querySelector('#kpi-total'))).toBe('R$ 150,00');
    const chip = root.querySelector('.ws-hero-chip')!;
    expect(text(chip)).toBe('50% a menos que outubro até o dia 10');
    expect(chip.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS.arrowDown);
    const link = root.querySelector<HTMLAnchorElement>('.ws-hero-progress a')!;
    expect(text(link)).toBe('Ver compras');
    expect(link.getAttribute('href')).toBe('/compras?ano=2026&mes=11');
    expect(root.querySelector('.ws-hero')!.getAttribute('aria-labelledby')).toBe('hero-label');
  });

  it('outro mês (CA-04)', async () => {
    const { root, respond } = await render({ year: 2026, month: 9 });
    await respond(SUMMARY_FULL_MONTH_EXAMPLE);
    expect(text(root.querySelector('#hero-label'))).toBe('Gasto em setembro');
    const chip = root.querySelector('.ws-hero-chip')!;
    expect(text(chip)).toBe('10% a mais que agosto');
    expect(chip.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS.arrowUp);
    expect(root.querySelector('.ws-hero-progress a')!.getAttribute('href')).toBe(
      '/compras?ano=2026&mes=9',
    );
  });

  it('sem base (CA-05)', async () => {
    const { root, respond } = await render({ year: 2026, month: 9 });
    await respond({ ...SUMMARY_NO_BASE_EXAMPLE, purchase_count: 2 });
    expect(text(root.querySelector('#kpi-total'))).toBe('R$ 0,00');
    const chip = root.querySelector('.ws-hero-chip')!;
    expect(text(chip)).toBe('Sem compras em agosto para comparar.');
    expect(chip.querySelector('ws-icon')).toBeNull();
  });

  it('mês vazio (CA-07)', async () => {
    const { root, respond } = await render({ year: 2026, month: 9 });
    await respond(SUMMARY_NO_BASE_EXAMPLE);
    const progress = root.querySelector('.ws-hero-progress')!;
    expect(text(progress.querySelector('p'))).toBe('Nenhuma compra em setembro.');
    const button = progress.querySelector<HTMLAnchorElement>('a.btn')!;
    expect(text(button)).toBe('Nova compra');
    expect(button.getAttribute('href')).toBe('/compras/nova');
    expect(text(progress)).not.toContain('Ver compras');
  });

  it('Nova compra do cartão leva a origem', async () => {
    const { root, respond, stable } = await render({ year: 2026, month: 9 });
    await respond(SUMMARY_NO_BASE_EXAMPLE);
    root.querySelector<HTMLAnchorElement>('.ws-hero-progress a.btn')!.click();
    await stable();
    const router = TestBed.inject(Router);
    expect(router.url).toBe('/compras/nova');
    expect(router.lastSuccessfulNavigation()?.extras.state).toEqual({
      wsOrigin: { screen: 'inicio', year: 2026, month: 9 },
    });
  });

  it('só canceladas: R$ 0,00 e Ver compras', async () => {
    const { root, respond } = await render();
    await respond({ ...SUMMARY_UNTIL_DAY_EXAMPLE, purchase_count: 1, spent: '0' });
    expect(text(root.querySelector('#kpi-total'))).toBe('R$ 0,00');
    expect(text(root.querySelector('.ws-hero-progress a'))).toBe('Ver compras');
  });

  it('erro e Tentar novamente (RN-26)', async () => {
    const { root, request, stable, respond } = await render();
    request().flush(ERROR_INTERNAL, { status: 500, statusText: 'x' });
    await stable();
    const alert = root.querySelector('.ws-hero [role="alert"]')!;
    expect(text(alert.querySelector('p'))).toBe(MSG_SERVER);
    expect(text(root.querySelector('#hero-label'))).toBe('Gasto em novembro');
    expect(root.querySelector('.ws-hero-progress')).toBeNull();
    alert.querySelector<HTMLButtonElement>('button')!.click();
    await stable();
    await respond(SUMMARY_UNTIL_DAY_EXAMPLE);
    expect(text(root.querySelector('#kpi-total'))).toBe('R$ 150,00');
  });

  describe('feature 007', () => {
    const DECEMBER = { year: 2026, month: 12 };

    it('mês futuro sem selo (CA-10)', async () => {
      const { root, respond } = await render(DECEMBER);
      await respond({
        ...SUMMARY_FULL_MONTH_EXAMPLE,
        year: 2026,
        month: 12,
        purchase_count: 1,
        spent: '70',
        comparison: { ...SUMMARY_FULL_MONTH_EXAMPLE.comparison, result: 'LESS', percent: 50 },
      });
      expect(text(root.querySelector('#kpi-total'))).toBe('R$ 70,00');
      expect(root.querySelector('.ws-hero-chip')).toBeNull();
      const link = root.querySelector<HTMLAnchorElement>('.ws-hero-progress a')!;
      expect(text(link)).toBe('Ver compras');
      expect(link.getAttribute('href')).toBe('/compras?ano=2026&mes=12');
    });

    it('mês futuro vazio (CA-11)', async () => {
      const { root, respond } = await render(DECEMBER);
      await respond({ ...SUMMARY_NO_BASE_EXAMPLE, year: 2026, month: 12 });
      expect(text(root.querySelector('#kpi-total'))).toBe('R$ 0,00');
      const progress = root.querySelector('.ws-hero-progress')!;
      expect(text(progress.querySelector('p'))).toBe('Nenhuma compra em dezembro.');
      expect(text(progress.querySelector('a.btn'))).toBe('Nova compra');
      expect(root.querySelector('.ws-hero-chip')).toBeNull();
    });

    it('mês mais curto (CA-13)', async () => {
      const { root, respond } = await render(
        { year: 2026, month: 10 },
        { year: 2026, month: 10, day: 31 },
      );
      await respond(SUMMARY_SHORTER_MONTH_EXAMPLE);
      const chip = root.querySelector('.ws-hero-chip')!;
      expect(text(chip)).toBe('5% a menos que setembro (até o dia 31; setembro até o dia 30)');
      expect(chip.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS.arrowDown);
    });

    it('mês passado continua com selo', async () => {
      const { root, respond } = await render({ year: 2026, month: 9 });
      await respond(SUMMARY_FULL_MONTH_EXAMPLE);
      expect(text(root.querySelector('.ws-hero-chip'))).toBe('10% a mais que agosto');
    });
  });
});
