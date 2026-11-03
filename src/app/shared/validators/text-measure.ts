/** Size in UTF-8 bytes (the API limits e-mail and password in bytes). */
export const utf8Bytes = (text: string): number => new TextEncoder().encode(text).length;

/** Unicode code points (the API counts name characters as runes). */
export const codePoints = (text: string): number => Array.from(text).length;
