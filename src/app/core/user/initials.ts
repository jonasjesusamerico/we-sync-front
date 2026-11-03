/** RN-17: first letter of the first and of the last word, upper case; one word → one letter. */
export function initials(name: string): string {
  const trimmed = name.trim();
  if (trimmed === '') {
    return '';
  }
  const words = trimmed.split(/\s+/);
  const first = (word: string) => (Array.from(word)[0] ?? '').toLocaleUpperCase('pt-BR');
  return words.length === 1 ? first(words[0]) : first(words[0]) + first(words[words.length - 1]);
}
