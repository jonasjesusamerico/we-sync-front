import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HOME_TITLE, HomePage } from './home.page';

describe('HomePage', () => {
  beforeAll(() => registerLocaleData(localePt));

  it('Início mostra cabeçalho e boas-vindas', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }] });
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-page-header h1')?.textContent).toBe('Início');
    expect(el.querySelector(':scope > .main-card h2')?.textContent).toBe('Bem-vindo ao we-sync');
    expect(el.querySelectorAll('h1')).toHaveLength(1);
    expect(HOME_TITLE).toBe('Bem-vindo ao we-sync');
  });
});
