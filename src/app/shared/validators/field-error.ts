import { ValidationErrors } from '@angular/forms';

/** Error key → text shown under the field. */
export type FieldErrorMessages = Readonly<Record<string, string>>;

/** First error of the control that has a text in `messages`, in the key order of `messages`; null without error. */
export function fieldError(
  errors: ValidationErrors | null,
  messages: FieldErrorMessages,
): string | null {
  if (!errors) {
    return null;
  }
  for (const key of Object.keys(messages)) {
    if (errors[key]) {
      return messages[key];
    }
  }
  return null;
}
