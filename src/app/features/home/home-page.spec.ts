import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  SUMMARY_FULL_MONTH_EXAMPLE,
  SUMMARY_UNTIL_DAY_EXAMPLE,
  USER_RESPONSE_EXAMPLE,
} from '../../../testing/api-examples';
import { text } from '../../../testing/dom';
import { API, httpTestingProviders } from '../../../testing/http';
import { settle } from '../../../testing/session';
import { TODAY } from '../../core/navigation/today';
import { CurrentUserStore } from '../../core/user/current-user-store';
import { HomePage } from './home-page';
import { HOME_SUBTITLE } from './home.messages';

const SUMMARY = `${API}/purchases/summary`;

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

  afterEach(() => http.verify());

  it('com usuário, seletor e cartão', async () => {
    const root = await render('Ana Souza');
    expect(text(root.querySelector('h1'))).toBe('Olá, Ana Souza');
    expect(text(root.querySelector('.ws-page-head p'))).toBe(HOME_SUBTITLE);
    expect(text(root.querySelector('.ws-month-label'))).toBe('novembro 2026');
    expect(root.querySelector('.ws-hero')).not.toBeNull();
    summaryRequest().flush(SUMMARY_UNTIL_DAY_EXAMPLE);
  });

  it('sem o aviso "em breve" (CA-09)', async () => {
    const root = await render('Ana Souza');
    expect(root.querySelector('.ws-callout')).toBeNull();
    expect(text(root)).not.toContain('O resumo do seu mês vai aparecer aqui em breve.');
    summaryRequest().flush(SUMMARY_UNTIL_DAY_EXAMPLE);
  });

  it('sem usuário', async () => {
    const root = await render(null);
    expect(text(root.querySelector('h1'))).toBe('Olá!');
    summaryRequest().flush(SUMMARY_UNTIL_DAY_EXAMPLE);
  });

  it('conta antiga e nome longo inteiro', async () => {
    const name = 'Maria'.padEnd(60, 'a');
    const root = await render(name);
    expect(text(root.querySelector('h1'))).toBe(`Olá, ${name}`);
    summaryRequest().flush(SUMMARY_UNTIL_DAY_EXAMPLE);
  });

  it('abre no mês atual', async () => {
    await render('Ana Souza', '/inicio');
    expect(router.url).toBe('/inicio?ano=2026&mes=11');
    expect(summaryRequest().request.urlWithParams).toBe(
      `${SUMMARY}?year=2026&month=11&today=2026-11-10`,
    );
  });

  it('endereço inválido vai para o mês atual', async () => {
    await render('Ana Souza', '/inicio?ano=2026&mes=13&x=1');
    expect(router.url).toBe('/inicio?ano=2026&mes=11');
    summaryRequest().flush(SUMMARY_UNTIL_DAY_EXAMPLE);
  });

  it('outro mês mostra "Mês atual"', async () => {
    const root = await render('Ana Souza', '/inicio?ano=2026&mes=9');
    expect(text(root.querySelector('.ws-month-label'))).toBe('setembro 2026');
    const current = Array.from(root.querySelectorAll('button')).find(
      (b) => text(b) === 'Mês atual',
    );
    expect(current).toBeDefined();
    summaryRequest().flush(SUMMARY_FULL_MONTH_EXAMPLE);
  });

  it('trocar mês: nova chamada e a anterior cancelada', async () => {
    const root = await render('Ana Souza');
    const first = summaryRequest();
    root.querySelector<HTMLButtonElement>('button[aria-label="Mês anterior"]')!.click();
    await stable();
    expect(router.url).toBe('/inicio?ano=2026&mes=10');
    expect(first.cancelled).toBe(true);
    const second = summaryRequest();
    expect(second.request.params.get('month')).toBe('10');
    second.flush(SUMMARY_UNTIL_DAY_EXAMPLE);
  });
});
