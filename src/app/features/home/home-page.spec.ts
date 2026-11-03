import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { USER_RESPONSE_EXAMPLE } from '../../../testing/api-examples';
import { text } from '../../../testing/dom';
import { API, httpTestingProviders } from '../../../testing/http';
import { CurrentUserStore } from '../../core/user/current-user-store';
import { HomePage } from './home-page';
import { HOME_SOON, HOME_SUBTITLE } from './home.messages';

describe('HomePage', () => {
  async function render(name: string | null) {
    TestBed.configureTestingModule({ providers: httpTestingProviders() });
    const http = TestBed.inject(HttpTestingController);
    const loading = TestBed.inject(CurrentUserStore).load();
    const req = http.expectOne(`${API}/users/me`);
    if (name === null) {
      req.flush({}, { status: 500, statusText: 'x' });
    } else {
      req.flush({ ...USER_RESPONSE_EXAMPLE, name });
    }
    await loading;
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('com usuário', async () => {
    const root = await render('Ana Souza');
    expect(text(root.querySelector('h1'))).toBe('Olá, Ana Souza');
    expect(text(root.querySelector('.ws-page-head p'))).toBe(HOME_SUBTITLE);
    expect(text(root.querySelector('.ws-callout'))).toBe(HOME_SOON);
  });

  it('sem usuário', async () => {
    const root = await render(null);
    expect(text(root.querySelector('h1'))).toBe('Olá!');
  });

  it('conta antiga', async () => {
    const root = await render('jonas.silva');
    expect(text(root.querySelector('h1'))).toBe('Olá, jonas.silva');
  });

  it('nome longo inteiro', async () => {
    const name = 'Maria'.padEnd(60, 'a');
    const root = await render(name);
    expect(text(root.querySelector('h1'))).toBe(`Olá, ${name}`);
  });

  it('sem dados do mês', async () => {
    const root = await render('Ana Souza');
    expect(root.querySelector('.ws-month, .ws-hero, .ws-kpi')).toBeNull();
  });
});
