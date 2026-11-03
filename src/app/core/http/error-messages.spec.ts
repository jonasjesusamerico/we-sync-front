import { MSG_CONNECTION, MSG_INVALID_DATA, MSG_SERVER } from './error-messages';

describe('error-messages (textos)', () => {
  it('has the texts of RN-19', () => {
    expect(MSG_CONNECTION).toBe(
      'Não foi possível conectar. Verifique sua internet e tente novamente.',
    );
    expect(MSG_SERVER).toBe('Algo deu errado. Tente novamente em instantes.');
    expect(MSG_INVALID_DATA).toBe('Verifique os dados informados.');
  });
});
