import { initials } from './initials';

describe('initials (iniciais)', () => {
  it.each([
    ['Jonas Silva', 'JS'],
    ['Jonas', 'J'],
    ['  ana  maria  souza ', 'AS'],
    ['jonas.silva', 'J'],
    ['élio', 'É'],
    ['', ''],
  ])('%j → %j', (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});
