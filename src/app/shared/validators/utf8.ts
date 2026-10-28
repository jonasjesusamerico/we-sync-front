const encoder = new TextEncoder();

/** Quantidade de bytes de `value` em UTF-8 (a API mede e-mail e senha em bytes). */
export function utf8ByteLength(value: string): number {
  return encoder.encode(value).length;
}
