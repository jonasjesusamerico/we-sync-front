import { DESCRIPTION_MAX, limitDescription } from './purchase-description';

const points = (text: string) => Array.from(text).length;

describe('limitDescription', () => {
  it('até 120 passa como digitado', () => {
    expect(DESCRIPTION_MAX).toBe(120);
    expect(limitDescription('', 'a'.repeat(120))).toBe('a'.repeat(120));
  });

  it('colar preenche até o limite', () => {
    const result = limitDescription('a'.repeat(100), 'a'.repeat(100) + 'b'.repeat(50));
    expect(points(result)).toBe(120);
    expect(result.endsWith('b'.repeat(20))).toBe(true);
  });

  it('descrição antiga: dá para apagar, não para crescer', () => {
    const old = 'a'.repeat(200);
    expect(points(limitDescription(old, 'a'.repeat(199)))).toBe(199);
    expect(limitDescription(old, old + 'b')).toBe(old);
  });

  it('conta pontos de código (emoji)', () => {
    const result = limitDescription('a'.repeat(119), 'a'.repeat(119) + '😀😀');
    expect(points(result)).toBe(120);
    expect(result.endsWith('😀')).toBe(true);
  });
});
