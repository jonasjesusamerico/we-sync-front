import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  CATEGORIES_EXAMPLE,
  ERROR_CATALOG_NOT_FOUND,
  ERROR_DEFAULT_NAME_CONFLICT,
  ERROR_INTERNAL,
  ERROR_NAME_CONFLICT,
  PAYMENT_METHODS_EXAMPLE,
} from '../../../../testing/api-examples';
import { installDialogStub } from '../../../../testing/dialog';
import { text, typeInto } from '../../../../testing/dom';
import { API, httpTestingProviders } from '../../../../testing/http';
import { settle } from '../../../../testing/session';
import type { CatalogKind, Category } from '../../../core/catalog/catalog.models';
import { ConfirmService } from '../../../shared/ui/confirm/confirm';
import { ICON_PATHS } from '../../../shared/ui/icon/icons';
import { ToastService } from '../../../shared/ui/toast/toast';
import * as t from '../settings.messages';
import { CatalogSection } from './catalog-section';

const CATEGORIES = `${API}/categories`;
const PAYMENTS = `${API}/payment-methods`;
const failure = (status: number) => ({ status, statusText: 'Error' });
const ok201 = { status: 201, statusText: 'Created' };
const noContent = { status: 204, statusText: 'No Content' };
const cat = (id: number) => CATEGORIES_EXAMPLE.find((c) => c.id === id)!;

describe('CatalogSection', () => {
  let http: HttpTestingController;
  let stub: ReturnType<typeof installDialogStub>;

  beforeEach(() => {
    stub = installDialogStub();
    TestBed.configureTestingModule({ providers: httpTestingProviders() });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    stub.restore();
    http.verify();
    vi.restoreAllMocks();
  });

  async function render(kind: CatalogKind = 'category', list?: unknown[] | 'pending') {
    const fixture = TestBed.createComponent(CatalogSection);
    fixture.componentRef.setInput('kind', kind);
    await fixture.whenStable();
    const url = kind === 'category' ? CATEGORIES : PAYMENTS;
    if (list !== 'pending') {
      http
        .expectOne(url)
        .flush(list ?? (kind === 'category' ? CATEGORIES_EXAMPLE : PAYMENT_METHODS_EXAMPLE));
      await fixture.whenStable();
    }
    const root = fixture.nativeElement as HTMLElement;
    const nameId = kind === 'category' ? 'cat-name' : 'pay-name';
    const stable = async () => {
      await settle();
      await fixture.whenStable();
    };
    const listCard = () => root.querySelectorAll<HTMLElement>('.ws-card')[1];
    return {
      fixture,
      root,
      url,
      stable,
      name: () => root.querySelector<HTMLInputElement>(`#${nameId}`)!,
      submit: () => root.querySelector<HTMLButtonElement>('.ws-card button[type=submit]')!,
      nameError: () => text(root.querySelector(`#${nameId}-error`)),
      alert: () => root.querySelector('.ws-card .alert'),
      rows: () =>
        Array.from(listCard().querySelectorAll<HTMLElement>(':scope > ul > li')).map((li) =>
          text(li.querySelector('.ws-tx-title')),
        ),
      row: (name: string) =>
        Array.from(listCard().querySelectorAll<HTMLElement>('li.ws-tx')).find(
          (li) => text(li.querySelector('.ws-tx-title')) === name,
        )!,
      archived: () => listCard().querySelector<HTMLDetailsElement>('details.ws-archived'),
      button: (label: string) =>
        root.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!,
      dialog: () => root.querySelector('ws-catalog-edit-dialog'),
    };
  }
  type View = Awaited<ReturnType<typeof render>>;

  const toast = () => TestBed.inject(ToastService).current();
  const bubblePath = (li: HTMLElement) =>
    li.querySelector('ws-category-bubble path')?.getAttribute('d');
  const bubbleColor = (li: HTMLElement) =>
    li.querySelector<HTMLElement>('ws-category-bubble')!.style.getPropertyValue('--cat');

  async function expectReload(view: View, list: unknown[] = CATEGORIES_EXAMPLE) {
    http.expectOne(view.url).flush(list);
    await view.stable();
  }

  it('lista', async () => {
    const view = await render();
    expect(view.rows()).toEqual([
      'Bar',
      'Pets',
      'Alimentação',
      'Transporte',
      'Moradia',
      'Saúde',
      'Educação',
      'Lazer',
    ]);
    const pets = view.row('Pets');
    expect(text(pets.querySelector('.ws-tag.is-primary'))).toBe(t.TAG_OWN);
    expect(pets.querySelectorAll('button').length).toBe(2);
    const food = view.row('Alimentação');
    expect(text(food.querySelector('.ws-tag'))).toBe(t.TAG_DEFAULT);
    expect(food.querySelector('.ws-tag path')!.getAttribute('d')).toBe(ICON_PATHS.lockSmall);
    expect(food.querySelectorAll('button').length).toBe(0);
    const archived = view.archived()!;
    expect(archived.open).toBe(false);
    expect(text(archived.querySelector('summary'))).toBe('Arquivadas (1)');
    expect(Array.from(archived.querySelectorAll('.ws-tx-title')).map((el) => text(el))).toEqual([
      'Academia',
    ]);
    expect(view.root.querySelector('.ws-tx-title')!.classList).toContain('text-wrap');
  });

  it('bolhas', async () => {
    const view = await render();
    expect(bubblePath(view.row('Pets'))).toBe(ICON_PATHS.heart);
    expect(bubbleColor(view.row('Pets'))).toBe('var(--ws-cat-leisure)');
    expect(bubblePath(view.row('Bar'))).toBe(ICON_PATHS.tag);
    expect(bubbleColor(view.row('Bar'))).toBe('var(--ws-muted)');
    expect(bubblePath(view.row('Alimentação'))).toBe(ICON_PATHS.food);
  });

  it('sem arquivadas', async () => {
    const view = await render(
      'category',
      CATEGORIES_EXAMPLE.filter((c) => c.id !== 32),
    );
    expect(view.archived()).toBeNull();
  });

  it('carregando e erro', async () => {
    const view = await render('category', 'pending');
    expect(view.root.querySelector('ws-area-status [role=status]')).not.toBeNull();
    expect(view.submit().disabled).toBe(true);
    http.expectOne(CATEGORIES).flush(ERROR_INTERNAL, failure(500));
    await view.stable();
    const status = view.root.querySelector('ws-area-status')!;
    expect(text(status)).toContain(t.MSG_SERVER);
    status.querySelector('button')!.click();
    await view.stable();
    expect(view.root.querySelector('ws-area-status [role=status]')).not.toBeNull();
    await expectReload(view);
    expect(view.root.querySelector('ws-area-status')).toBeNull();
    expect(view.rows().length).toBe(8);
  });

  it('cria', async () => {
    const view = await render();
    typeInto(view.name(), 'Pets 2');
    view.root.querySelector<HTMLInputElement>('#ci-HEART')!.click();
    view.root.querySelector<HTMLInputElement>('#cc-LEISURE')!.click();
    view.submit().click();
    const req = http.expectOne(CATEGORIES);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Pets 2', icon: 'HEART', color: 'LEISURE' });
    req.flush({ ...cat(31), id: 33, name: 'Pets 2' }, ok201);
    await view.stable();
    expect(toast()).toMatchObject({ text: 'Categoria adicionada' });
    expect(view.name().value).toBe('');
    expect(view.root.querySelector<HTMLInputElement>('#ci-TAG')!.checked).toBe(true);
    expect(view.root.querySelector<HTMLInputElement>('#cc-FOOD')!.checked).toBe(true);
    expect(view.root.querySelector('#cat-name-error')).toBeNull();
    const reload = http.expectOne(CATEGORIES);
    expect(reload.request.method).toBe('GET');
    // The list stays while reloading (no flicker).
    expect(view.rows().length).toBe(8);
    reload.flush([...CATEGORIES_EXAMPLE, { ...cat(31), id: 33, name: 'Pets 2' }]);
    await view.stable();
    expect(view.rows()).toContain('Pets 2');
  });

  it('reativa ao criar', async () => {
    const view = await render();
    typeInto(view.name(), 'academia');
    view.root.querySelector<HTMLInputElement>('#ci-GIFT')!.click();
    view.submit().click();
    http.expectOne(CATEGORIES).flush({ ...cat(32), archived_at: null, icon: 'GIFT' });
    await view.stable();
    expect(toast()).toMatchObject({ text: 'Categoria reativada' });
    await expectReload(view);
  });

  it.each([
    ['saude', ERROR_DEFAULT_NAME_CONFLICT, 'Já existe uma categoria padrão com esse nome.'],
    ['pets', ERROR_NAME_CONFLICT, 'Você já tem uma categoria com esse nome.'],
  ])('nome repetido: %s', async (name, error, message) => {
    const view = await render();
    typeInto(view.name(), name);
    view.submit().click();
    http.expectOne(CATEGORIES).flush(error, failure(409));
    await view.stable();
    expect(view.nameError()).toBe(message);
    expect(document.activeElement).toBe(view.name());
    expect(view.alert()).toBeNull();
    typeInto(view.name(), name + 'x');
    await view.stable();
    expect(view.root.querySelector('#cat-name-error')).toBeNull();
  });

  it('nome vazio', async () => {
    const view = await render();
    typeInto(view.name(), '   ');
    view.submit().click();
    await view.stable();
    expect(view.nameError()).toBe(t.ERR_CATALOG_NAME_REQUIRED);
    expect(view.name().getAttribute('aria-describedby')).toBe('cat-name-error cat-name-hint');
    expect(document.activeElement).toBe(view.name());
    http.expectNone(CATEGORIES);
  });

  it('41 caracteres', async () => {
    const view = await render();
    typeInto(view.name(), 'a'.repeat(40));
    typeInto(view.name(), 'a'.repeat(41));
    await view.stable();
    expect(view.name().value).toBe('a'.repeat(40));
    view.submit().click();
    const req = http.expectOne(CATEGORIES);
    expect(req.request.body.name).toBe('a'.repeat(40));
    req.flush(cat(31), ok201);
    await view.stable();
    await expectReload(view);
  });

  it('erro ao criar', async () => {
    const view = await render();
    typeInto(view.name(), 'Viagem');
    view.submit().click();
    http.expectOne(CATEGORIES).error(new ProgressEvent('error'), { status: 0 });
    await view.stable();
    expect(text(view.alert())).toBe(t.MSG_CONNECTION);
    expect(view.name().value).toBe('Viagem');
  });

  it('editar abre e cancela', async () => {
    const view = await render();
    const pencil = view.button('Editar Bar');
    pencil.focus();
    pencil.click();
    await view.stable();
    expect(stub.showModal).toHaveBeenCalledTimes(1);
    const dialog = view.dialog()!;
    expect(dialog.querySelector<HTMLInputElement>('#edit-name')!.value).toBe('Bar');
    expect(dialog.querySelector<HTMLInputElement>('#ei-TAG')!.checked).toBe(true);
    expect(dialog.querySelector<HTMLInputElement>('#ec-FOOD')!.checked).toBe(true);
    dialog.querySelector<HTMLButtonElement>('.modal-footer .btn-ghost')!.click();
    await view.stable();
    expect(view.dialog()).toBeNull();
    expect(document.activeElement).toBe(pencil);
    http.expectNone(`${CATEGORIES}/30`);
  });

  it('editar salva', async () => {
    const view = await render();
    view.button('Editar Bar').click();
    await view.stable();
    const dialog = view.dialog()!;
    typeInto(dialog.querySelector<HTMLInputElement>('#edit-name')!, 'Animais');
    dialog.querySelector<HTMLInputElement>('#ei-HOUSE')!.click();
    dialog.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    const req = http.expectOne(`${CATEGORIES}/30`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'Animais', icon: 'HOUSE', color: 'FOOD' });
    req.flush({ ...cat(30), name: 'Animais', icon: 'HOUSE', color: 'FOOD' });
    await view.stable();
    expect(view.dialog()).toBeNull();
    expect(toast()).toMatchObject({ text: 'Categoria atualizada' });
    await expectReload(view);
  });

  it('editar sumiu', async () => {
    const view = await render();
    view.button('Editar Pets').click();
    await view.stable();
    view.dialog()!.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    http.expectOne(`${CATEGORIES}/31`).flush(ERROR_CATALOG_NOT_FOUND, failure(404));
    await view.stable();
    expect(view.dialog()).toBeNull();
    expect(toast()).toMatchObject({ text: 'Esta categoria não existe mais.', kind: 'warning' });
    await expectReload(view);
  });

  it('arquivar', async () => {
    const view = await render();
    const confirm = TestBed.inject(ConfirmService);
    const ask = vi.spyOn(confirm, 'ask');
    view.button('Arquivar Pets').click();
    await view.stable();
    expect(ask).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: 'archive',
        title: 'Arquivar categoria?',
        lines: ['As compras de "Pets" continuam salvas. Você pode reativá-la em Arquivadas.'],
        confirmLabel: t.ARCHIVE,
        cancelLabel: t.CANCEL,
      }),
    );
    confirm.confirm();
    const req = http.expectOne(`${CATEGORIES}/31/archive`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toBeNull();
    req.flush(null, noContent);
    await view.stable();
    expect(toast()).toMatchObject({ text: 'Categoria arquivada', kind: 'success' });
    await expectReload(view);
    expect(document.activeElement).toBe(view.root.querySelector('#catalog-list-title'));
  });

  it('arquivar cancelado', async () => {
    const view = await render();
    const confirm = TestBed.inject(ConfirmService);
    view.button('Arquivar Pets').click();
    await view.stable();
    confirm.cancel();
    await view.stable();
    http.expectNone(`${CATEGORIES}/31/archive`);
    http.expectNone(CATEGORIES);
    expect(toast()).toBeNull();
  });

  it('arquivar sumiu', async () => {
    const view = await render();
    const confirm = TestBed.inject(ConfirmService);
    view.button('Arquivar Pets').click();
    await view.stable();
    confirm.confirm();
    http.expectOne(`${CATEGORIES}/31/archive`).flush(ERROR_CATALOG_NOT_FOUND, failure(404));
    await view.stable();
    expect(toast()).toMatchObject({ text: 'Esta categoria não existe mais.', kind: 'warning' });
    await expectReload(view);
  });

  it('arquivar erro fica na confirmação', async () => {
    const view = await render();
    const confirm = TestBed.inject(ConfirmService);
    view.button('Arquivar Pets').click();
    await view.stable();
    confirm.confirm();
    http.expectOne(`${CATEGORIES}/31/archive`).flush(ERROR_INTERNAL, failure(500));
    await view.stable();
    expect(confirm.error()).toBe(t.MSG_SERVER);
    expect(confirm.active()).not.toBeNull();
    confirm.cancel();
    await view.stable();
    http.expectNone(CATEGORIES);
  });

  it('reativar', async () => {
    const view = await render();
    const button = view.button('Reativar Academia');
    button.click();
    await view.stable();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    button.click();
    const req = http.expectOne(`${CATEGORIES}/32/archive`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, noContent);
    await view.stable();
    expect(toast()).toMatchObject({ text: 'Categoria reativada', kind: 'success' });
    await expectReload(view);
    expect(document.activeElement).toBe(view.root.querySelector('#catalog-list-title'));
  });

  it.each([
    [404, 'Esta categoria não existe mais.'],
    [500, t.MSG_SERVER],
  ])('reativar erro: %i', async (status, message) => {
    const view = await render();
    view.button('Reativar Academia').click();
    http
      .expectOne(`${CATEGORIES}/32/archive`)
      .flush(status === 404 ? ERROR_CATALOG_NOT_FOUND : ERROR_INTERNAL, failure(status));
    await view.stable();
    expect(toast()).toMatchObject({ text: message, kind: 'warning' });
    await expectReload(view);
  });

  it('envio único ao criar', async () => {
    const view = await render();
    typeInto(view.name(), 'Viagem');
    view.submit().click();
    await view.stable();
    view.root.querySelector('form')!.dispatchEvent(new Event('submit'));
    expect(view.submit().disabled).toBe(true);
    expect(view.submit().getAttribute('aria-busy')).toBe('true');
    http.expectOne(CATEGORIES).flush(cat(31), ok201);
    await view.stable();
    await expectReload(view);
  });

  it('formas', async () => {
    const view = await render('payment');
    expect(view.root.querySelector('section')!.id).toBe('tab-pagamentos');
    expect(text(view.root.querySelector('h2'))).toBe('Nova forma de pagamento');
    expect(view.root.querySelector('fieldset')).toBeNull();
    expect(view.root.querySelector('#pay-name')!.getAttribute('placeholder')).toBe(
      'Ex.: Vale-refeição',
    );
    expect(text(view.root.querySelector('label[for=pay-name]'))).toBe(t.LABEL_NAME);
    expect(view.root.querySelector('label[for=pay-name]')!.classList).toContain('visually-hidden');
    expect(view.rows()).toEqual([
      'Vale-refeição',
      'Dinheiro',
      'Cartão de crédito',
      'Cartão de débito',
      'Pix',
      'Transferência bancária',
      'Boleto',
    ]);
    for (const li of Array.from(view.root.querySelectorAll<HTMLElement>('li.ws-tx'))) {
      expect(bubblePath(li)).toBe(ICON_PATHS.card);
      expect(bubbleColor(li)).toBe('var(--ws-primary)');
    }
    expect(text(view.archived()!.querySelector('summary'))).toBe('Arquivadas (1)');
    expect(text(view.archived()!.querySelector('.ws-tx-title'))).toBe('Cartão antigo');
    expect(text(view.root.querySelectorAll('h2')[1])).toBe('Suas formas de pagamento');
  });

  it('formas cria e edita', async () => {
    const view = await render('payment');
    typeInto(view.name(), 'Vale-refeição 2');
    view.submit().click();
    const create = http.expectOne(PAYMENTS);
    expect(create.request.body).toEqual({ name: 'Vale-refeição 2' });
    create.flush(PAYMENT_METHODS_EXAMPLE[7], ok201);
    await view.stable();
    expect(toast()).toMatchObject({ text: 'Forma de pagamento adicionada' });
    await expectReload(view, PAYMENT_METHODS_EXAMPLE);

    view.button('Editar Vale-refeição').click();
    await view.stable();
    const dialog = view.dialog()!;
    expect(dialog.querySelector('fieldset')).toBeNull();
    expect(text(dialog.querySelector('#edit-title'))).toBe('Editar forma de pagamento');
    typeInto(dialog.querySelector<HTMLInputElement>('#edit-name')!, 'VR');
    dialog.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    const update = http.expectOne(`${PAYMENTS}/40`);
    expect(update.request.body).toEqual({ name: 'VR' });
    update.flush({ ...PAYMENT_METHODS_EXAMPLE[7], name: 'VR' });
    await view.stable();
    expect(toast()).toMatchObject({ text: 'Forma de pagamento atualizada' });
    await expectReload(view, PAYMENT_METHODS_EXAMPLE);
  });

  it('rótulos', async () => {
    const view = await render();
    for (const label of ['Editar Pets', 'Arquivar Pets', 'Reativar Academia']) {
      expect(view.button(label)).not.toBeNull();
    }
    // The name is hidden text inside the label (axe refuses aria-label on <label>, D-15).
    const heart = view.root.querySelector('label[for=ci-HEART]')!;
    expect(text(heart)).toBe('Ícone coração');
    expect(heart.querySelector('.visually-hidden')).not.toBeNull();
    expect(heart.hasAttribute('aria-label')).toBe(false);
    expect(text(view.root.querySelector('label[for=cc-FOOD] .visually-hidden'))).toBe('Cor azul');
    const swatch = view.root.querySelector<HTMLElement>('label[for=cc-HOME]')!;
    expect(swatch.style.getPropertyValue('--sw')).toBe('var(--ws-cat-home)');
    expect(view.root.querySelectorAll('.ws-chips input[type=radio]').length).toBe(10);
    expect(view.root.querySelectorAll('.ws-swatches input[type=radio]').length).toBe(6);
  });

  it('nome antigo longo na lista aparece inteiro', async () => {
    const long = 'n'.repeat(45);
    const view = await render('category', [
      ...CATEGORIES_EXAMPLE,
      { ...cat(31), id: 34, name: long } satisfies Category,
    ]);
    expect(view.rows()).toContain(long);
  });
});
