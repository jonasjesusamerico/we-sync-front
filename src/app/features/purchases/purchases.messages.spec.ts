import * as m from './purchases.messages';

describe('purchases.messages (textos)', () => {
  it('títulos e lista', () => {
    expect(m.TITLE_PURCHASES).toBe('Compras · we-sync');
    expect(m.TITLE_NEW_PURCHASE).toBe('Nova compra · we-sync');
    expect(m.TITLE_EDIT_PURCHASE).toBe('Editar compra · we-sync');
    expect(m.PURCHASES_HEADING).toBe('Compras');
    expect(m.purchasesSummary(1, 'R$ 23,90')).toBe('1 compra · R$ 23,90 no total');
    expect(m.purchasesSummary(11, 'R$ 263,40')).toBe('11 compras · R$ 263,40 no total');
    expect(m.purchasesSummary(0, 'R$ 0,00')).toBe('0 compras · R$ 0,00 no total');
    expect([
      m.LABEL_FILTERS,
      m.LABEL_SEARCH,
      m.SEARCH_PLACEHOLDER,
      m.LABEL_CATEGORY,
      m.LABEL_ALL,
      m.LABEL_STATUS,
      m.LABEL_CLEAR_FILTERS,
    ]).toEqual([
      'Filtros',
      'Buscar',
      'Descrição da compra',
      'Categoria',
      'Todas',
      'Situação',
      'Limpar filtros',
    ]);
    expect(m.STATUS_LABELS).toEqual({ PAID: 'Paga', PENDING: 'Pendente', CANCELED: 'Cancelada' });
    expect([
      m.LABEL_LIST,
      m.COLUMN_DESCRIPTION,
      m.COLUMN_DATE,
      m.COLUMN_PAYMENT,
      m.COLUMN_STATUS,
      m.COLUMN_AMOUNT,
      m.COLUMN_ACTIONS,
    ]).toEqual([
      'Lista de compras',
      'Descrição',
      'Data',
      'Pagamento',
      'Situação',
      'Valor',
      'Ações',
    ]);
    expect(m.editLabel('Uber')).toBe('Editar Uber');
    expect(m.deleteLabel('Uber')).toBe('Excluir Uber');
    expect(m.emptyMonth('setembro de 2026')).toBe('Nenhuma compra em setembro de 2026.');
    expect(m.EMPTY_FILTERED_TITLE).toBe('Nenhuma compra encontrada');
    expect(m.EMPTY_FILTERED_TEXT).toBe('Tente mudar os filtros ou o mês.');
  });

  it('formulário', () => {
    expect([
      m.BACK_TO_PURCHASES,
      m.NEW_PURCHASE_HEADING,
      m.NEW_PURCHASE_SUBTITLE,
      m.EDIT_PURCHASE_HEADING,
    ]).toEqual([
      'Compras',
      'Nova compra',
      'Registre o que você gastou. Leva menos de um minuto.',
      'Editar compra',
    ]);
    expect([
      m.LABEL_AMOUNT,
      m.CURRENCY_SYMBOL,
      m.LABEL_DESCRIPTION,
      m.DESCRIPTION_PLACEHOLDER,
      m.LABEL_DATE,
      m.LABEL_PAYMENT,
    ]).toEqual([
      'Quanto foi?',
      'R$',
      'Descrição',
      'Ex.: Supermercado',
      'Data',
      'Forma de pagamento',
    ]);
    expect([m.SUMMARY_HEADING, m.NO_DESCRIPTION, m.LABEL_VALUE]).toEqual([
      'Resumo',
      'Sem descrição',
      'Valor',
    ]);
    expect([m.SAVE_PURCHASE, m.SAVE_AND_NEW, m.CANCEL, m.SAVE_CHANGES, m.DELETE]).toEqual([
      'Salvar compra',
      'Salvar e criar outra',
      'Cancelar',
      'Salvar alterações',
      'Excluir',
    ]);
    expect([
      m.ERR_AMOUNT,
      m.ERR_DESCRIPTION_REQUIRED,
      m.ERR_DESCRIPTION_MAX,
      m.ERR_DATE,
      m.ERR_CATEGORY,
      m.ERR_PAYMENT,
      m.ERR_CATEGORY_GONE,
      m.ERR_PAYMENT_GONE,
    ]).toEqual([
      'Informe um valor maior que zero.',
      'Informe a descrição.',
      'Use no máximo 120 caracteres.',
      'Informe a data.',
      'Escolha uma categoria.',
      'Escolha a forma de pagamento.',
      'A categoria escolhida não existe mais. Escolha outra.',
      'A forma de pagamento escolhida não existe mais. Escolha outra.',
    ]);
  });

  it('avisos e exclusão', () => {
    expect(m.TOAST_SAVED).toBe('Compra salva com sucesso');
    expect(m.toastSavedIn('setembro de 2026')).toBe('Compra salva em setembro de 2026');
    expect(m.TOAST_DELETED).toBe('Compra excluída');
    expect(m.TOAST_NOT_FOUND).toBe('Compra não encontrada');
    expect(m.TOAST_GONE).toBe('Esta compra não existe mais');
    expect(m.DELETE_TITLE).toBe('Excluir compra?');
    expect(m.DELETE_WARNING).toBe('Esta ação não pode ser desfeita.');
  });
});
