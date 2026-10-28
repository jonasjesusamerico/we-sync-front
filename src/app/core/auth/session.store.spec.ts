import { TestBed } from '@angular/core/testing';

import { TokenResponse } from './auth.models';
import { SESSION_KEY, SessionStore } from './session.store';

describe('SessionStore', () => {
  let store: SessionStore;

  beforeEach(() => {
    localStorage.clear();
    store = TestBed.inject(SessionStore);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('save e read', () => {
    expect(store.save({ access_token: 'A1', refresh_token: 'R1' })).toBe(true);
    expect(store.read()).toEqual({ access_token: 'A1', refresh_token: 'R1' });
    expect(JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null')).toEqual({
      access_token: 'A1',
      refresh_token: 'R1',
    });
  });

  it('save não grava token_type', () => {
    const tokens: TokenResponse = { access_token: 'A1', refresh_token: 'R1', token_type: 'Bearer' };
    store.save(tokens);
    expect(Object.keys(JSON.parse(localStorage.getItem(SESSION_KEY) ?? '{}')).sort()).toEqual([
      'access_token',
      'refresh_token',
    ]);
  });

  it('read reflete outra aba', () => {
    store.save({ access_token: 'A1', refresh_token: 'R1' });
    expect(store.read()?.access_token).toBe('A1');
    localStorage.setItem(SESSION_KEY, JSON.stringify({ access_token: 'A2', refresh_token: 'R2' }));
    expect(store.read()).toEqual({ access_token: 'A2', refresh_token: 'R2' });
  });

  it('JSON quebrado', () => {
    localStorage.setItem(SESSION_KEY, '{x');
    expect(store.read()).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('campo faltando', () => {
    localStorage.setItem(SESSION_KEY, '{"access_token":"A1"}');
    expect(store.read()).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('campo vazio', () => {
    localStorage.setItem(SESSION_KEY, '{"access_token":"A1","refresh_token":""}');
    expect(store.read()).toBeNull();
  });

  it('campos extras são ignorados', () => {
    localStorage.setItem(
      SESSION_KEY,
      '{"access_token":"A1","refresh_token":"R1","token_type":"Bearer"}',
    );
    expect(store.read()).toEqual({ access_token: 'A1', refresh_token: 'R1' });
  });

  it('storage lança no getItem', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('negado', 'SecurityError');
    });
    expect(() => store.read()).not.toThrow();
    expect(store.read()).toBeNull();
  });

  it('storage lança no setItem', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('cheio', 'QuotaExceededError');
    });
    expect(store.save({ access_token: 'A1', refresh_token: 'R1' })).toBe(false);
    expect(store.isAuthenticated()).toBe(false);
  });

  it('clear', () => {
    store.save({ access_token: 'A1', refresh_token: 'R1' });
    store.clear();
    expect(store.read()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
  });

  it('clear engole exceção do storage', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('negado', 'SecurityError');
    });
    expect(() => store.clear()).not.toThrow();
  });

  it('isAuthenticated', () => {
    expect(store.isAuthenticated()).toBe(false);
    store.save({ access_token: 'A1', refresh_token: 'R1' });
    expect(store.isAuthenticated()).toBe(true);
  });

  it('isAuthenticated segue syncFromStorage', () => {
    store.save({ access_token: 'A1', refresh_token: 'R1' });
    localStorage.removeItem(SESSION_KEY);
    store.syncFromStorage();
    expect(store.isAuthenticated()).toBe(false);
  });

  it('hasSession', () => {
    expect(store.hasSession()).toBe(false);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ access_token: 'A1', refresh_token: 'R1' }));
    expect(store.hasSession()).toBe(true);
  });
});
