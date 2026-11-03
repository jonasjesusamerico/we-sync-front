export type StrengthLevel = 'empty' | 'weak' | 'fair' | 'strong';

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  level: StrengthLevel;
  percent: 0 | 25 | 50 | 75 | 100;
}

/**
 * RN-04. Points: at least 8 code points; an uppercase letter; a number; a symbol.
 * '' → empty/0%; 0–1 → weak/25%; 2 → fair/50%; 3 → strong/75%; 4 → strong/100%.
 */
export function passwordStrength(password: string): PasswordStrength {
  if (password === '') {
    return { score: 0, level: 'empty', percent: 0 };
  }
  const score = ((Array.from(password).length >= 8 ? 1 : 0) +
    (/\p{Lu}/u.test(password) ? 1 : 0) +
    (/\p{N}/u.test(password) ? 1 : 0) +
    (/[^\p{L}\p{N}\s]/u.test(password) ? 1 : 0)) as PasswordStrength['score'];
  switch (score) {
    case 0:
    case 1:
      return { score, level: 'weak', percent: 25 };
    case 2:
      return { score, level: 'fair', percent: 50 };
    case 3:
      return { score, level: 'strong', percent: 75 };
    default:
      return { score, level: 'strong', percent: 100 };
  }
}
