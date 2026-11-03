/**
 * expired: refresh refused and nobody else renewed (RN-09); logged-out: no session in the storage (another tab
 * logged out); unavailable: network, 5xx or lock wait timed out (the session stays).
 */
export class RefreshError extends Error {
  constructor(readonly kind: 'expired' | 'logged-out' | 'unavailable') {
    super(kind);
    this.name = 'RefreshError';
  }
}

/** Protected call without a session in the storage: the request is not sent. */
export class LoggedOutError extends Error {
  constructor() {
    super('logged-out');
    this.name = 'LoggedOutError';
  }
}
