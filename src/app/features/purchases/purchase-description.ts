import { limitCodePoints } from '../../shared/text/code-point-limit';

/** RN-08: the form accepts up to 120 characters (code points); the API accepts 255. */
export const DESCRIPTION_MAX = 120;

/** RN-08, RN-09 of feature 005: the description field is an `input[wsCodePointLimit]` with this limit. */
export function limitDescription(previous: string, next: string): string {
  return limitCodePoints(previous, next, DESCRIPTION_MAX);
}
