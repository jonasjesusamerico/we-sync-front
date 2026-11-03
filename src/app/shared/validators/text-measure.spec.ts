import { codePoints, utf8Bytes } from './text-measure';

describe('utf8Bytes e codePoints', () => {
  it.each([
    ['Jô', 3, 2],
    ['😀', 4, 1],
    ['á'.repeat(40), 80, 40],
  ])('%s', (text, bytes, points) => {
    expect(utf8Bytes(text)).toBe(bytes);
    expect(codePoints(text)).toBe(points);
  });
});
