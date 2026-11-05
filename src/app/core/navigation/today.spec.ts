import { TestBed } from '@angular/core/testing';
import { TODAY } from './today';

describe('TODAY', () => {
  afterEach(() => vi.useRealTimers());

  it('padrão: a data local do navegador', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 10, 23, 59));
    const today = TestBed.inject(TODAY);
    expect(today()).toEqual({ year: 2026, month: 11, day: 10 });
  });

  it('pode ser trocado nos testes', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: TODAY, useValue: () => ({ year: 2026, month: 1, day: 31 }) }],
    });
    expect(TestBed.inject(TODAY)()).toEqual({ year: 2026, month: 1, day: 31 });
  });
});
