import { utf8Bytes } from '../../shared/validators/text-measure';

export type LoginNotice =
  | { kind: 'session-expired' }
  | { kind: 'account-created'; email: string }
  | { kind: 'account-deleted' };
export type LoginNoticeState =
  | { notice: 'session-expired' }
  | { notice: 'account-created'; email: string }
  | { notice: 'account-deleted' };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Validates the navigation state (ADR-15). Unknown shape → null. 'account-created' needs an e-mail of 1 to 254 bytes. */
export function readLoginNotice(state: unknown): LoginNotice | null {
  if (!isRecord(state)) {
    return null;
  }
  if (state['notice'] === 'session-expired') {
    return { kind: 'session-expired' };
  }
  if (state['notice'] === 'account-deleted') {
    return { kind: 'account-deleted' };
  }
  if (state['notice'] === 'account-created') {
    const email = state['email'];
    if (typeof email === 'string' && email.length > 0 && utf8Bytes(email) <= 254) {
      return { kind: 'account-created', email };
    }
  }
  return null;
}

/** Copy of the state without `notice` and `email` (keeps the router keys, like navigationId and ɵrouterPageId). */
export function withoutLoginNotice(state: unknown): Record<string, unknown> | null {
  if (!isRecord(state)) {
    return null;
  }
  const copy: Record<string, unknown> = { ...state };
  delete copy['notice'];
  delete copy['email'];
  return copy;
}
