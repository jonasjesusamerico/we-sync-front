import * as auth from '../auth/auth.messages';
import * as shell from '../../layout/shell/shell.messages';
import { archivedOptionLabel } from '../../core/catalog/catalog.messages';
import { TOAST_THEME_NOT_SAVED } from '../../core/theme/theme.messages';
import { COLOR_CHOICES, ICON_CHOICES } from '../../core/catalog/catalog-style';
import * as m from './settings.messages';

describe('settings.messages (textos)', () => {
  it('cabeçalho e menu', () => {
    expect(m.TITLE_SETTINGS).toBe('Configurações · we-sync');
    expect(m.SETTINGS_HEADING).toBe('Configurações');
    expect(m.SETTINGS_SUBTITLE).toBe('Cadastre suas rendas e ajuste o we-sync do seu jeito.');
    expect(m.LABEL_SECTIONS).toBe('Seções das configurações');
    expect(Object.values(m.SECTION_LABELS)).toEqual([
      'Rendas',
      'Orçamento',
      'Categorias',
      'Formas de pagamento',
      'Conta',
    ]);
  });

  it('textos', () => {
    expect(m.CATALOG_TEXTS.payment.archiveText('Vale-refeição')).toBe(
      'As compras feitas com "Vale-refeição" continuam salvas. Você pode reativá-la em Arquivadas.',
    );
    expect(m.CATALOG_TEXTS.category.archiveText('Pets')).toBe(
      'As compras de "Pets" continuam salvas. Você pode reativá-la em Arquivadas.',
    );
    expect(m.archivedSummary(3)).toBe('Arquivadas (3)');
    expect(m.colorLabel('FOOD')).toBe('Cor azul');
    expect(m.iconLabel('HEART')).toBe('Ícone coração');
    expect(m.editLabel('Pets')).toBe('Editar Pets');
    expect(m.archiveLabel('Pets')).toBe('Arquivar Pets');
    expect(m.reactivateLabel('Academia')).toBe('Reativar Academia');
    expect(archivedOptionLabel('Academia')).toBe('Academia (arquivada)');
    expect(TOAST_THEME_NOT_SAVED).toBe('Não foi possível salvar o tema na sua conta.');
    expect(auth.MSG_ACCOUNT_DELETED).toBe('Sua conta foi excluída.');
  });

  it('um rótulo para cada ícone e cor (ADR-17)', () => {
    expect(ICON_CHOICES.map(m.iconLabel)).toEqual([
      'Ícone etiqueta',
      'Ícone coração',
      'Ícone sorriso',
      'Ícone livro',
      'Ícone carro',
      'Ícone casa',
      'Ícone comida',
      'Ícone cartão',
      'Ícone presente',
      'Ícone brilho',
    ]);
    expect(COLOR_CHOICES.map(m.colorLabel)).toEqual([
      'Cor azul',
      'Cor verde-água',
      'Cor roxo',
      'Cor rosa',
      'Cor laranja',
      'Cor verde',
    ]);
  });

  it('formas de pagamento (RN-19)', () => {
    const t = m.CATALOG_TEXTS.payment;
    expect(t.hint).toBeNull();
    expect(t.submit).toBe('Adicionar');
    expect(t.toastGone).toBe('Esta forma de pagamento não existe mais.');
    expect(t.errArchivedName).toBe(
      'Você tem uma forma de pagamento arquivada com esse nome. Reative-a em Arquivadas.',
    );
  });

  it('textos iguais aos da 004', () => {
    expect(m.ERR_NAME_REQUIRED).toBe(auth.MSG_NAME_REQUIRED);
    expect(m.ERR_NAME_LENGTH).toBe(auth.MSG_NAME_LENGTH);
    expect(m.ERR_NEW_SHORT).toBe(auth.MSG_PASSWORD_SHORT);
    expect(m.ERR_NEW_LONG).toBe(auth.MSG_PASSWORD_LONG);
    expect(m.ERR_PASSWORD_REQUIRED).toBe(auth.MSG_PASSWORD_REQUIRED);
    expect(m.MSG_PROFILE_UNAVAILABLE).toBe(shell.MSG_USER_UNAVAILABLE);
    expect(m.LABEL_NAME).toBe(auth.LABEL_NAME);
    expect(m.LABEL_EMAIL).toBe(auth.LABEL_EMAIL);
  });
});
