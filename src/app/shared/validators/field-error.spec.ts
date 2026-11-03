import { MSG_NAME_LENGTH, MSG_NAME_REQUIRED } from '../../features/auth/auth.messages';
import { fieldError } from './field-error';

describe('fieldError', () => {
  const messages = { required: MSG_NAME_REQUIRED, nameLength: MSG_NAME_LENGTH };

  it('returns the text of the error', () => {
    expect(fieldError({ nameLength: true }, messages)).toBe(MSG_NAME_LENGTH);
  });

  it('returns null without error', () => {
    expect(fieldError(null, messages)).toBeNull();
    expect(fieldError({ other: true }, messages)).toBeNull();
  });
});
