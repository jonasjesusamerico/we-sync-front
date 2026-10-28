export type RefreshFailure = 'expired' | 'logged-out';

/** Falha da renovação que encerra a sessão. O interceptor já navegou; a tela não mostra mensagem. */
export class RefreshError extends Error {
  constructor(readonly reason: RefreshFailure) {
    super(reason);
    this.name = 'RefreshError';
  }
}
