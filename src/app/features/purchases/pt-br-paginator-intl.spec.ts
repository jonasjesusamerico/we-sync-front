import { PtBrPaginatorIntl } from './pt-br-paginator-intl';

describe('PtBrPaginatorIntl', () => {
  it('paginador 1–20 de 47', () => {
    const intl = new PtBrPaginatorIntl();
    expect(intl.getRangeLabel(0, 20, 47)).toBe('1–20 de 47');
    expect(intl.getRangeLabel(2, 20, 47)).toBe('41–47 de 47');
    expect(intl.getRangeLabel(0, 20, 0)).toBe('0–0 de 0');
  });

  it('rótulos do paginador', () => {
    const intl = new PtBrPaginatorIntl();
    expect(intl.nextPageLabel).toBe('Próxima página');
    expect(intl.previousPageLabel).toBe('Página anterior');
  });
});
