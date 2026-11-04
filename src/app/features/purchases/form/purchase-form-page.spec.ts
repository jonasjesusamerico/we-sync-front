import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  CATEGORIES_EXAMPLE,
  ERROR_CATEGORY_NOT_FOUND,
  ERROR_INTERNAL,
  ERROR_PAYMENT_METHOD_NOT_FOUND,
  ERROR_PURCHASE_NOT_FOUND,
  PAYMENT_METHODS_EXAMPLE,
  PURCHASE_EXAMPLE,
} from '../../../../testing/api-examples';
import { text, typeInto } from '../../../../testing/dom';
import { API, httpTestingProviders } from '../../../../testing/http';
import { seedSession, settle } from '../../../../testing/session';
import { MSG_CONNECTION } from '../../../core/http/error-messages';
import { TODAY } from '../../../core/navigation/today';
import { unsavedChangesGuard } from '../../../core/navigation/unsaved-changes.guard';
import { ConfirmService } from '../../../shared/ui/confirm/confirm';
import { ICON_PATHS } from '../../../shared/ui/icon/icons';
import { ToastService } from '../../../shared/ui/toast/toast';
import type { Purchase } from '../data/purchase.models';
import { originState, type PurchaseOrigin } from '../purchase-links';
import * as t from '../purchases.messages';
import { PurchaseFormPage } from './purchase-form-page';

@Component({ template: '<h1>Outra</h1>' })
class Blank {}

const PURCHASES = `${API}/purchases`;
const FROM_NOVEMBER: PurchaseOrigin = {
  screen: 'compras',
  query: { year: 2026, month: 11, search: '', categoryId: null, status: null, page: 1 },
};
const FROM_SEPTEMBER: PurchaseOrigin = {
  screen: 'compras',
  query: { ...FROM_NOVEMBER.query, month: 9 },
};
const saved = (date: string): Purchase => ({ ...PURCHASE_EXAMPLE, purchase_date: date });

describe('PurchaseFormPage', () => {
  let http: HttpTestingController;
  let router: Router;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    seedSession('a', 'r');
    TestBed.configureTestingModule({
      providers: [
        ...httpTestingProviders(),
        { provide: TODAY, useValue: () => ({ year: 2026, month: 11, day: 10 }) },
        provideRouter(
          [
            { path: 'inicio', component: Blank },
            { path: 'compras', component: Blank },
            {
              path: 'compras/nova',
              component: PurchaseFormPage,
              data: { mode: 'create' },
              canDeactivate: [unsavedChangesGuard],
            },
            {
              path: 'compras/:id',
              component: PurchaseFormPage,
              data: { mode: 'edit' },
              canDeactivate: [unsavedChangesGuard],
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const stable = async () => {
    await settle();
    await harness.fixture.whenStable();
  };
  const root = () => harness.fixture.nativeElement as HTMLElement;
  const $ = <T extends Element = HTMLInputElement>(selector: string) =>
    root().querySelector<T>(selector)!;
  const page = () => harness.routeDebugElement!.componentInstance as PurchaseFormPage;
  const toast = () => TestBed.inject(ToastService).current();

  function respondOptions(payments = PAYMENT_METHODS_EXAMPLE, categories = CATEGORIES_EXAMPLE) {
    http.expectOne(`${API}/categories`).flush(categories);
    http.expectOne(`${API}/payment-methods`).flush(payments);
  }

  async function openNew(
    origin: PurchaseOrigin | null = FROM_NOVEMBER,
    payments?: typeof PAYMENT_METHODS_EXAMPLE,
  ) {
    await router.navigateByUrl('/compras/nova', { state: originState(origin) });
    await stable();
    respondOptions(payments);
    await stable();
  }

  async function openEdit(purchase: Purchase = PURCHASE_EXAMPLE) {
    await router.navigateByUrl(`/compras/${purchase.id}`, { state: originState(FROM_NOVEMBER) });
    await stable();
    respondOptions();
    http.expectOne(`${PURCHASES}/${purchase.id}`).flush(purchase);
    await stable();
  }

  async function fillValid() {
    typeInto($('#amount'), '1.234,56');
    typeInto($('#description'), '  Mercado  ');
    $('#c-1').click();
    await stable();
  }

  async function submit(): Promise<TestRequest> {
    $<HTMLFormElement>('form').dispatchEvent(new Event('submit'));
    await stable();
    return http.expectOne((r) => r.url.startsWith(PURCHASES) && r.method !== 'GET');
  }

  const button = (label: string) =>
    Array.from(root().querySelectorAll<HTMLElement>('button, a')).find((b) => text(b) === label);

  it('valores iniciais', async () => {
    await openNew();
    expect(text($('h1'))).toBe('Nova compra');
    expect(text($('.ws-page-head p'))).toBe(t.NEW_PURCHASE_SUBTITLE);
    expect($('#amount').value).toBe('0,00');
    expect($('#description').value).toBe('');
    expect($('#date').value).toBe('2026-11-10');
    expect(root().querySelector('#categories input:checked')).toBeNull();
    expect($('#p-4').checked).toBe(true);
    expect($('#s-paid').checked).toBe(true);
    expect(root().querySelector('#s-canceled')).toBeNull();
    expect(Array.from(root().querySelectorAll('.d-grid > *')).map(text)).toEqual([
      'Salvar compra',
      'Salvar e criar outra',
      'Cancelar',
    ]);
    expect($('a.ws-back').getAttribute('href')).toBe('/compras?ano=2026&mes=11');
  });

  it('data no dia 1 quando a origem é outro mês', async () => {
    await openNew(FROM_SEPTEMBER);
    expect($('#date').value).toBe('2026-09-01');
  });

  it('sem Pix, nenhuma forma escolhida', async () => {
    await openNew(
      FROM_NOVEMBER,
      PAYMENT_METHODS_EXAMPLE.filter((m) => m.name !== 'Pix'),
    );
    expect(root().querySelector('#payments input:checked')).toBeNull();
  });

  it('campos e ordem', async () => {
    await openNew();
    const labels = Array.from(root().querySelectorAll('form label.form-label, form legend')).map(
      text,
    );
    expect(labels).toEqual([
      'Quanto foi?',
      'Descrição',
      'Data',
      'Categoria',
      'Forma de pagamento',
      'Situação',
    ]);
    expect(Array.from(root().querySelectorAll('#payments label')).map(text)).toEqual([
      'Dinheiro',
      'Cartão de crédito',
      'Cartão de débito',
      'Pix',
      'Transferência bancária',
      'Boleto',
    ]);
    expect(text(root().querySelector('form'))).not.toContain('Repetir');
  });

  it('ícones das categorias', async () => {
    await openNew();
    const food = $<HTMLElement>('#categories .ws-chip:first-child');
    expect(food.style.getPropertyValue('--cat')).toBe('var(--ws-cat-food)');
    expect(food.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS.food);
    const pets = $('#c-31').closest<HTMLElement>('.ws-chip')!;
    expect(pets.style.getPropertyValue('--cat')).toBe('var(--ws-muted)');
    expect(pets.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS.tag);
  });

  it('resumo ao vivo', async () => {
    await openNew();
    expect(text($('#preview-desc'))).toBe('Sem descrição');
    expect($('aside ws-category-bubble path').getAttribute('d')).toBe(ICON_PATHS.tag);
    typeInto($('#amount'), '123');
    typeInto($('#description'), 'Feira');
    $('#c-1').click();
    await stable();
    expect(text($('#preview-desc'))).toBe('Feira');
    expect(text($('#preview-meta'))).toBe('Alimentação · 10/11/2026 · Pix');
    expect(text($('#preview-amount'))).toBe('R$ 1,23');
    expect($('aside ws-category-bubble path').getAttribute('d')).toBe(ICON_PATHS.food);
  });

  it('validação: nada é enviado e o foco vai para o valor', async () => {
    await openNew();
    $<HTMLFormElement>('form').dispatchEvent(new Event('submit'));
    await stable();
    expect(text($('#amount-error'))).toBe(t.ERR_AMOUNT);
    expect(text($('#description-error'))).toBe(t.ERR_DESCRIPTION_REQUIRED);
    expect(text($('#category-error'))).toBe(t.ERR_CATEGORY);
    expect(root().querySelector('#date-error')).toBeNull();
    expect($('#amount-box').classList).toContain('is-invalid');
    expect($('#categories').classList).toContain('is-invalid');
    expect($('#amount').getAttribute('aria-describedby')).toBe('amount-error');
    expect(document.activeElement).toBe($('#amount'));
  });

  it('ano inválido (D-20)', async () => {
    await openNew();
    await fillValid();
    page().form.controls.date.setValue('20266-11-05');
    $<HTMLFormElement>('form').dispatchEvent(new Event('submit'));
    await stable();
    expect(text($('#date-error'))).toBe(t.ERR_DATE);
    expect(document.activeElement).toBe($('#date'));
  });

  it('corpo do POST, com trim', async () => {
    await openNew();
    await fillValid();
    const req = await submit();
    expect(req.request.method).toBe('POST');
    expect(req.request.url).toBe(PURCHASES);
    expect(req.request.body).toEqual({
      purchase_date: '2026-11-10',
      description: 'Mercado',
      category_id: 1,
      payment_method_id: 4,
      amount: '1234.56',
      status: 'PAID',
    });
    req.flush(saved('2026-11-10'), { status: 201, statusText: 'Created' });
    await stable();
  });

  it('121º caractere recusado', async () => {
    await openNew();
    typeInto($('#description'), 'a'.repeat(130));
    expect($('#description').value).toHaveLength(120);
    expect(page().form.controls.description.value).toHaveLength(120);
  });

  it('salvar volta à origem com o aviso', async () => {
    await openNew();
    await fillValid();
    (await submit()).flush(saved('2026-11-05'), { status: 201, statusText: 'Created' });
    await stable();
    expect(toast()?.text).toBe('Compra salva com sucesso');
    expect(router.url).toBe('/compras?ano=2026&mes=11');
  });

  it('aviso com o mês quando a data é de outro mês', async () => {
    await openNew();
    await fillValid();
    (await submit()).flush(saved('2026-09-10'), { status: 201, statusText: 'Created' });
    await stable();
    expect(toast()?.text).toBe('Compra salva em setembro de 2026');
    expect(router.url).toBe('/compras?ano=2026&mes=11');
  });

  it('salvar e criar outra', async () => {
    await openNew();
    await fillValid();
    $('#s-pending').click();
    button('Salvar e criar outra')!.click();
    await stable();
    http
      .expectOne((r) => r.method === 'POST')
      .flush(saved('2026-11-10'), { status: 201, statusText: 'Created' });
    await stable();
    expect(toast()?.text).toBe('Compra salva com sucesso');
    expect(router.url).toBe('/compras/nova');
    expect($('#amount').value).toBe('0,00');
    expect($('#description').value).toBe('');
    expect($('#date').value).toBe('2026-11-10');
    expect($('#c-1').checked).toBe(true);
    expect($('#p-4').checked).toBe(true);
    expect($('#s-pending').checked).toBe(true);
    expect(root().querySelector('#amount-error')).toBeNull();
    expect(document.activeElement).toBe($('#amount'));
    expect(page().hasUnsavedChanges()).toBe(false);
  });

  it('envio único', async () => {
    await openNew();
    await fillValid();
    const form = $<HTMLFormElement>('form');
    form.dispatchEvent(new Event('submit'));
    form.dispatchEvent(new Event('submit'));
    button('Salvar e criar outra')!.click();
    await stable();
    const requests = http.match((r) => r.method === 'POST');
    expect(requests).toHaveLength(1);
    const save = $<HTMLButtonElement>('button[type=submit]');
    expect(save.disabled).toBe(true);
    expect(save.getAttribute('aria-busy')).toBe('true');
    expect(save.querySelector('.spinner-border')).not.toBeNull();
    expect(button('Salvar e criar outra')!.hasAttribute('disabled')).toBe(true);
    requests[0].flush(saved('2026-11-10'), { status: 201, statusText: 'Created' });
    await stable();
  });

  it('edição carrega', async () => {
    await openEdit();
    expect(text($('h1'))).toBe('Editar compra');
    expect(root().querySelector('.ws-page-head p')).toBeNull();
    expect($('#amount').value).toBe('1.234,56');
    expect($('#description').value).toBe('Padária São João');
    expect($('#date').value).toBe('2026-11-05');
    expect($('#c-1').checked).toBe(true);
    expect($('#p-4').checked).toBe(true);
    expect($('#s-paid').checked).toBe(true);
    expect(root().querySelector('#s-canceled')).not.toBeNull();
    expect(Array.from(root().querySelectorAll('.d-grid > *')).map(text)).toEqual([
      'Salvar alterações',
      'Excluir',
      'Cancelar',
    ]);
    expect(page().hasUnsavedChanges()).toBe(false);
  });

  it('edição salva com PUT', async () => {
    await openEdit();
    $('#s-canceled').click();
    await stable();
    const req = await submit();
    expect(req.request.method).toBe('PUT');
    expect(req.request.url).toBe(`${PURCHASES}/42`);
    expect(req.request.body).toMatchObject({ amount: '1234.56', status: 'CANCELED' });
    req.flush({ ...PURCHASE_EXAMPLE, status: 'CANCELED' });
    await stable();
    expect(toast()?.text).toBe('Compra salva com sucesso');
    expect(router.url).toBe('/compras?ano=2026&mes=11');
  });

  it('edição com descrição longa', async () => {
    const long = 'a'.repeat(200);
    await openEdit({ ...PURCHASE_EXAMPLE, description: long });
    expect($('#description').value).toBe(long);
    $<HTMLFormElement>('form').dispatchEvent(new Event('submit'));
    await stable();
    expect(text($('#description-error'))).toBe(t.ERR_DESCRIPTION_MAX);
    typeInto($('#description'), long + 'b');
    expect($('#description').value).toBe(long);
  });

  it.each(['abc', '0', '-1'])('id inválido %j: sem chamada', async (id) => {
    const navigate = vi.spyOn(router, 'navigate');
    await router.navigateByUrl(`/compras/${id}`);
    await stable();
    // The page leaves at once: the option requests were cancelled and there is no GET of the purchase.
    const requests = http.match(() => true);
    expect(requests.filter((r) => r.request.url.startsWith(`${PURCHASES}/`))).toHaveLength(0);
    expect(requests.every((r) => r.cancelled)).toBe(true);
    expect(toast()).toMatchObject({ text: 'Compra não encontrada', kind: 'warning' });
    expect(router.url).toBe('/compras?ano=2026&mes=11');
    expect(navigate.mock.calls[0][1]).toMatchObject({ replaceUrl: true });
  });

  it('id 404', async () => {
    await router.navigateByUrl('/compras/77');
    await stable();
    respondOptions();
    http
      .expectOne(`${PURCHASES}/77`)
      .flush(ERROR_PURCHASE_NOT_FOUND, { status: 404, statusText: 'Not Found' });
    await stable();
    expect(toast()?.text).toBe('Compra não encontrada');
    expect(router.url).toBe('/compras?ano=2026&mes=11');
  });

  it('edição: falha ao carregar e Tentar novamente', async () => {
    await router.navigateByUrl('/compras/42');
    await stable();
    respondOptions();
    http.expectOne(`${PURCHASES}/42`).flush(ERROR_INTERNAL, { status: 500, statusText: 'x' });
    await stable();
    expect(root().querySelector('form')).toBeNull();
    button('Tentar novamente')!.click();
    await stable();
    http.expectOne(`${PURCHASES}/42`).flush(PURCHASE_EXAMPLE);
    await stable();
    expect($('#description').value).toBe('Padária São João');
  });

  it('PUT 404: a compra não existe mais', async () => {
    await openEdit();
    (await submit()).flush(ERROR_PURCHASE_NOT_FOUND, { status: 404, statusText: 'Not Found' });
    await stable();
    expect(toast()).toMatchObject({ text: 'Esta compra não existe mais', kind: 'warning' });
    expect(router.url).toBe('/compras?ano=2026&mes=11');
    expect(TestBed.inject(ConfirmService).active()).toBeNull();
  });

  it('categoria sumiu', async () => {
    await openNew();
    await fillValid();
    (await submit()).flush(ERROR_CATEGORY_NOT_FOUND, { status: 404, statusText: 'Not Found' });
    await stable();
    respondOptions(
      PAYMENT_METHODS_EXAMPLE,
      CATEGORIES_EXAMPLE.filter((c) => c.id !== 1),
    );
    await stable();
    await stable();
    expect($('#description').value).toBe('  Mercado  ');
    expect(root().querySelector('#categories input:checked')).toBeNull();
    expect(text($('#category-error'))).toBe(t.ERR_CATEGORY_GONE);
    expect(root().querySelector('#c-1')).toBeNull();
    expect(document.activeElement?.closest('#categories')).not.toBeNull();
    $('#c-2').click();
    await stable();
    expect(root().querySelector('#category-error')).toBeNull();
  });

  it('forma sumiu', async () => {
    await openNew();
    await fillValid();
    (await submit()).flush(ERROR_PAYMENT_METHOD_NOT_FOUND, { status: 404, statusText: 'x' });
    await stable();
    respondOptions();
    await stable();
    expect(root().querySelector('#payments input:checked')).toBeNull();
    expect(text($('#payment-error'))).toBe(t.ERR_PAYMENT_GONE);
  });

  it('sem conexão: mensagem e campos mantidos', async () => {
    await openNew();
    await fillValid();
    (await submit()).error(new ProgressEvent('error'));
    await stable();
    expect(text($('.alert'))).toBe(MSG_CONNECTION);
    expect($('#amount').value).toBe('1.234,56');
    expect($<HTMLButtonElement>('button[type=submit]').disabled).toBe(false);
    expect(router.url).toBe('/compras/nova');
  });

  it('opções falham: erro e salvar desabilitado', async () => {
    await router.navigateByUrl('/compras/nova');
    await stable();
    http.expectOne(`${API}/categories`).flush(CATEGORIES_EXAMPLE);
    http
      .expectOne(`${API}/payment-methods`)
      .flush(ERROR_INTERNAL, { status: 500, statusText: 'x' });
    await stable();
    expect(root().querySelectorAll('[role="alert"]').length).toBeGreaterThan(0);
    expect($<HTMLButtonElement>('button[type=submit]').disabled).toBe(true);
    root().querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    await stable();
    respondOptions();
    await stable();
    expect($<HTMLButtonElement>('button[type=submit]').disabled).toBe(false);
  });

  it('excluir na edição', async () => {
    await openEdit();
    const confirm = TestBed.inject(ConfirmService);
    button('Excluir')!.click();
    await stable();
    expect(confirm.active()?.lines).toEqual([
      'Padária São João',
      '05/11/2026 · R$ 1.234,56',
      'Esta ação não pode ser desfeita.',
    ]);
    confirm.confirm();
    http.expectOne(`${PURCHASES}/42`).flush(null, { status: 204, statusText: 'No Content' });
    await stable();
    expect(toast()?.text).toBe('Compra excluída');
    expect(router.url).toBe('/compras?ano=2026&mes=11');
  });

  it('alterado e desfeito à mão', async () => {
    await openNew();
    expect(page().hasUnsavedChanges()).toBe(false);
    typeInto($('#description'), 'Pão');
    expect(page().hasUnsavedChanges()).toBe(true);
    typeInto($('#description'), '');
    expect(page().hasUnsavedChanges()).toBe(false);
    typeInto($('#description'), '  ');
    expect(page().hasUnsavedChanges()).toBe(false);
  });

  it('depois de salvar não pergunta', async () => {
    await openNew();
    await fillValid();
    const req = await submit();
    expect(page().hasUnsavedChanges()).toBe(true);
    req.flush(saved('2026-11-10'), { status: 201, statusText: 'Created' });
    await stable();
    expect(router.url).toBe('/compras?ano=2026&mes=11');
    expect(TestBed.inject(ConfirmService).active()).toBeNull();
  });

  it('beforeunload', async () => {
    await openNew();
    const event = () => new Event('beforeunload', { cancelable: true });
    const clean = event();
    window.dispatchEvent(clean);
    expect(clean.defaultPrevented).toBe(false);
    typeInto($('#description'), 'Pão');
    const changed = event();
    window.dispatchEvent(changed);
    expect(changed.defaultPrevented).toBe(true);
  });
});
