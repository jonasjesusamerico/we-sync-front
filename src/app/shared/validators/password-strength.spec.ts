import { passwordStrength } from './password-strength';

describe('passwordStrength (força)', () => {
  it.each([
    ['', 'empty', 0],
    ['abcdefgh', 'weak', 25],
    ['Abcdefgh', 'fair', 50],
    ['Abcdefg1', 'strong', 75],
    ['Abcdef1!', 'strong', 100],
    ['a', 'weak', 25],
    ['Éabcdefg', 'fair', 50],
  ])('%j → %s/%i', (password, level, percent) => {
    const result = passwordStrength(password);
    expect(result.level).toBe(level);
    expect(result.percent).toBe(percent);
  });
});
