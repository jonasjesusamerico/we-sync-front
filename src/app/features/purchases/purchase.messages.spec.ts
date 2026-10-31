import * as m from './purchase.messages';

describe('purchase.messages', () => {
  it('textos', () => {
    expect(m.LABEL_NEW_PURCHASE).toBe('Novo lançamento');
    expect(m.TITLE_EDIT_PURCHASE).toBe('Editar lançamento');
    expect([m.LABEL_PREVIOUS_MONTH, m.LABEL_NEXT_MONTH, m.LABEL_CURRENT_MONTH]).toEqual([
      'Mês anterior',
      'Próximo mês',
      'Mês atual',
    ]);
    expect(m.pickMonthLabel('outubro de 2026')).toBe('Escolher mês: outubro de 2026');
    expect(m.LABEL_FILTERS).toBe('Filtros');
    expect([
      m.LABEL_DATE,
      m.LABEL_DESCRIPTION,
      m.LABEL_AMOUNT,
      m.LABEL_CATEGORY,
      m.LABEL_PAYMENT_METHOD,
      m.LABEL_STATUS,
    ]).toEqual(['Data', 'Descrição', 'Valor', 'Categoria', 'Forma de pagamento', 'Status']);
    expect(m.LABEL_ALL_STATUSES).toBe('Todos');
    expect(m.LABEL_ALL_OPTIONS).toBe('Todas');
    expect(m.LABEL_CLEAR_FILTERS).toBe('Limpar filtros');
    expect(m.STATUS_LABELS).toEqual({ PENDING: 'Pendente', PAID: 'Pago', CANCELED: 'Cancelado' });
    expect(m.LABEL_ACTIONS).toBe('Ações');
    expect(m.LABEL_DELETE).toBe('Excluir');
    expect(m.deleteLabel('Mercado')).toBe('Excluir Mercado');
    expect(m.emptyMonthMessage('outubro de 2026')).toBe('Nenhum lançamento em outubro de 2026.');
    expect(m.MSG_EMPTY_FILTERED).toBe('Nenhum lançamento encontrado com esses filtros.');
    expect(m.LABEL_RETRY).toBe('Tentar novamente');
    expect(m.LABEL_LOADING).toBe('Carregando');
    expect(m.rangeLabel(1, 20, 47)).toBe('1–20 de 47');
    expect(m.LABEL_NEXT_PAGE).toBe('Próxima página');
    expect(m.LABEL_PREVIOUS_PAGE).toBe('Página anterior');
    expect(m.DATE_HINT).toBe('dd/mm/aaaa');
    expect([m.LABEL_SAVE, m.LABEL_SAVE_AND_NEW, m.LABEL_CANCEL]).toEqual([
      'Salvar',
      'Salvar e criar outro',
      'Cancelar',
    ]);
    expect(m.DELETE_DIALOG_TITLE).toBe('Excluir lançamento?');
    expect(m.DELETE_DIALOG_WARNING).toBe('Esta ação não pode ser desfeita.');
    expect(m.DISCARD_DIALOG_TITLE).toBe('Descartar alterações?');
    expect(m.LABEL_KEEP_EDITING).toBe('Continuar editando');
    expect(m.LABEL_DISCARD).toBe('Descartar');
    expect([
      m.MSG_DATE_REQUIRED,
      m.MSG_DATE_INVALID,
      m.MSG_DESCRIPTION_REQUIRED,
      m.MSG_DESCRIPTION_MAX,
      m.MSG_AMOUNT_REQUIRED,
      m.MSG_AMOUNT_POSITIVE,
      m.MSG_AMOUNT_MAX,
      m.MSG_CATEGORY_REQUIRED,
      m.MSG_PAYMENT_METHOD_REQUIRED,
    ]).toEqual([
      'Informe a data.',
      'Data inválida.',
      'Informe a descrição.',
      'Use no máximo 255 caracteres.',
      'Informe o valor.',
      'O valor deve ser maior que zero.',
      'O valor máximo é R$ 99.999.999,99.',
      'Escolha a categoria.',
      'Escolha a forma de pagamento.',
    ]);
    expect(m.MSG_CATEGORY_GONE).toBe('A categoria escolhida não existe mais. Escolha outra.');
    expect(m.MSG_PAYMENT_METHOD_GONE).toBe(
      'A forma de pagamento escolhida não existe mais. Escolha outra.',
    );
    expect(m.MSG_PURCHASE_GONE).toBe('Este lançamento não existe mais.');
    expect(m.MSG_SAVED).toBe('Lançamento salvo.');
    expect(m.savedInMonthMessage('setembro de 2026')).toBe('Lançamento salvo em setembro de 2026.');
    expect(m.MSG_DELETED).toBe('Lançamento excluído.');
    expect(m.MSG_NOT_FOUND).toBe('Lançamento não encontrado.');
    expect(m.CALENDAR_LABELS).toEqual({
      open: 'Abrir calendário',
      calendar: 'Calendário',
      previous: { days: 'Mês anterior', months: 'Ano anterior', years: '24 anos anteriores' },
      next: { days: 'Próximo mês', months: 'Próximo ano', years: 'Próximos 24 anos' },
    });
    expect(m.yearRangeLabel('2016', '2039')).toBe('2016 a 2039');
  });
});
