import { readLoginNotice, withoutLoginNotice } from './login-notice';

describe('readLoginNotice', () => {
  it('reads the two notices', () => {
    expect(readLoginNotice({ notice: 'session-expired' })).toEqual({ kind: 'session-expired' });
    expect(readLoginNotice({ notice: 'account-created', email: 'ana@exemplo.com' })).toEqual({
      kind: 'account-created',
      email: 'ana@exemplo.com',
    });
  });

  it('reads the account-deleted notice (feature 006)', () => {
    expect(readLoginNotice({ notice: 'account-deleted' })).toEqual({ kind: 'account-deleted' });
  });

  it.each([
    null,
    undefined,
    'x',
    {},
    { notice: 'outro' },
    { notice: 'account-created' },
    { notice: 'account-created', email: 42 },
  ])('readLoginNotice inválido: %j', (state) => {
    expect(readLoginNotice(state)).toBeNull();
  });
});

describe('withoutLoginNotice', () => {
  it('keeps the router keys', () => {
    expect(
      withoutLoginNotice({
        navigationId: 3,
        ɵrouterPageId: 2,
        notice: 'account-created',
        email: 'a@b.co',
      }),
    ).toEqual({ navigationId: 3, ɵrouterPageId: 2 });
  });
});
