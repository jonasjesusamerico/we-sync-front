import { utf8ByteLength } from './utf8';

describe('utf8ByteLength', () => {
  it('utf8ByteLength conta ASCII', () => {
    expect(utf8ByteLength('senha123')).toBe(8);
  });

  it('utf8ByteLength conta acentos como 2 bytes', () => {
    expect(utf8ByteLength('á'.repeat(40))).toBe(80);
  });

  it('utf8ByteLength conta emoji como 4 bytes', () => {
    expect(utf8ByteLength('😀')).toBe(4);
  });
});
