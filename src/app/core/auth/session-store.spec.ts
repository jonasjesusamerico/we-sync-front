import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TOKEN_RESPONSE_EXAMPLE } from '../../../testing/api-examples';
import { SESSION_KEY } from './session.models';
import { SessionStore } from './session-store';

describe('SessionStore', () => {
  let store: SessionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    store = TestBed.inject(SessionStore);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('sessão gravada', () => {
    expect(store.save(TOKEN_RESPONSE_EXAMPLE)).toBe(true);
    expect(Object.keys(JSON.parse(localStorage.getItem(SESSION_KEY)!))).toEqual([
      'access_token',
      'refresh_token',
    ]);
    expect(store.read()).toEqual({
      access_token: TOKEN_RESPONSE_EXAMPLE.access_token,
      refresh_token: TOKEN_RESPONSE_EXAMPLE.refresh_token,
    });
  });

  it.each([null, '{', '{"access_token":""}', '[]', '{"access_token":1,"refresh_token":"x"}'])(
    'sessão ausente ou corrompida: %j',
    (raw) => {
      if (raw !== null) {
        localStorage.setItem(SESSION_KEY, raw);
      }
      expect(store.read()).toBeNull();
    },
  );

  it('storage recusado', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(store.save(TOKEN_RESPONSE_EXAMPLE)).toBe(false);
    expect(store.read()).toBeNull();
  });

  it('clear', () => {
    store.save(TOKEN_RESPONSE_EXAMPLE);
    store.clear();
    expect(store.read()).toBeNull();
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => store.clear()).not.toThrow();
  });
});
