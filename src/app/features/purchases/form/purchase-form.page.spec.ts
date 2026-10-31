import { InteractivityChecker } from '@angular/cdk/a11y';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localePt from '@angular/common/locales/pt';
import { ApplicationRef, ChangeDetectionStrategy, Component, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import {
  CONTRACT_PURCHASE,
  CONTRACT_REQUEST,
  GLOBAL_CATEGORIES,
  GLOBAL_PAYMENT_METHODS,
  http404,
  PERSONAL_CATEGORIES,
} from '../../../../testing/purchases-contract';
import { SESSION_KEY } from '../../../core/auth/session.store';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import { MSG_CONNECTION, MSG_INVALID_DATA, MSG_SERVER } from '../../../core/http/error-messages';
import { ListQuery } from '../list-query';
import {
  DISCARD_DIALOG_TITLE,
  LABEL_CANCEL,
  LABEL_DELETE,
  LABEL_DISCARD,
  LABEL_KEEP_EDITING,
  LABEL_RETRY,
  LABEL_SAVE,
  LABEL_SAVE_AND_NEW,
  MSG_CATEGORY_GONE,
  MSG_DELETED,
  MSG_DESCRIPTION_REQUIRED,
  MSG_NOT_FOUND,
  MSG_PAYMENT_METHOD_GONE,
  MSG_PURCHASE_GONE,
  MSG_SAVED,
} from '../purchase.messages';
import { Option } from '../purchase.models';
import { PURCHASE_ROUTES } from '../purchases.routes';
import { PurchaseFormPage } from './purchase-form.page';

registerLocaleData(localePt);

const BASE = '/api/v1';

@Component({ template: 'lista', changeDetection: ChangeDetectionStrategy.OnPush })
class StubList {}

const origin = (patch: Partial<ListQuery> = {}): ListQuery => ({
  year: 2026,
  month: 10,
  status: null,
  categoryId: null,
  paymentMethodId: null,
  page: 1,
  ...patch,
});

describe('PurchaseFormPage', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let router: Router;
  let snack: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 22, 12, 0));
    localStorage.setItem(SESSION_KEY, JSON.stringify({ access_token: 'A1', refresh_token: 'R1' }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'lancamentos',
            children: [{ path: '', pathMatch: 'full', component: StubList }, ...PURCHASE_ROUTES],
          },
          { path: '**', component: StubList },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
        { provide: LOCALE_ID, useValue: 'pt-BR' },
      ],
    });
    vi.spyOn(TestBed.inject(InteractivityChecker), 'isVisible').mockReturnValue(true);
    harness = await RouterTestingHarness.create();
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    snack = vi.spyOn(TestBed.inject(MatSnackBar), 'open');
  });

  afterEach(() => {
    http.verify();
    TestBed.inject(MatSnackBar).dismiss();
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => el.remove());
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const settle = async () => {
    await harness.fixture.whenStable();
    await TestBed.inject(ApplicationRef).whenStable();
  };
  const root = () => harness.fixture.nativeElement as HTMLElement;
  const loader = () => TestbedHarnessEnvironment.loader(harness.fixture);
  const page = () =>
    harness.fixture.debugElement.query((d) => d.componentInstance instanceof PurchaseFormPage)
      ?.componentInstance as PurchaseFormPage | undefined;

  async function open(url: string, from?: ListQuery) {
    await router.navigateByUrl(url, from ? { state: { origin: from } } : {});
    await settle();
  }

  function flushOptions(categories: Option[] = GLOBAL_CATEGORIES) {
    http.expectOne(`${BASE}/categories`).flush(categories);
    http.expectOne(`${BASE}/payment-methods`).flush(GLOBAL_PAYMENT_METHODS);
  }

  async function openNew(from?: ListQuery, categories?: Option[]) {
    await open('/lancamentos/novo', from);
    flushOptions(categories);
    await settle();
  }

  async function openEdit(from?: ListQuery) {
    await open('/lancamentos/42', from);
    http.expectOne(`${BASE}/purchases/42`).flush(CONTRACT_PURCHASE);
    flushOptions();
    await settle();
  }

  const inputs = () => Array.from(root().querySelectorAll<HTMLInputElement>('form input'));
  const dateInput = () => inputs()[0];
  const descriptionInput = () => inputs()[1];
  const amountInput = () => inputs()[2];
  const button = (label: string) =>
    Array.from(root().querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent?.trim() === label,
    );
  const fieldError = (index: number) =>
    root()
      .querySelectorAll('mat-form-field')
      .item(index)
      .querySelector('mat-error')
      ?.textContent?.trim() ?? null;
  const alert = () => root().querySelector('form app-form-alert')?.textContent?.trim() ?? null;
  const dialog = () => document.querySelector('mat-dialog-container') as HTMLElement | null;
  const dialogButton = (label: string) =>
    Array.from(dialog()?.querySelectorAll<HTMLButtonElement>('button') ?? []).find(
      (b) => b.textContent?.trim() === label,
    )!;

  function type(input: HTMLInputElement, value: string) {
    input.dispatchEvent(new Event('focus'));
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  }

  async function selects() {
    const [category, paymentMethod, status] = await loader().getAllHarnesses(MatSelectHarness);
    return { category, paymentMethod, status };
  }

  async function choose(select: MatSelectHarness, text: string) {
    await select.open();
    await select.clickOptions({ text });
    await settle();
  }

  async function fill({
    description = 'Mercado',
    amount = '1.234,56',
    category = 'Alimentação',
    paymentMethod = 'Pix',
  } = {}) {
    type(descriptionInput(), description);
    type(amountInput(), amount);
    const s = await selects();
    await choose(s.category, category);
    await choose(s.paymentMethod, paymentMethod);
  }

  const created = (patch = {}) => ({ ...CONTRACT_PURCHASE, id: 1000, ...patch });
  const saveRequest = (method: 'POST' | 'PUT') =>
    http.expectOne((r) => r.method === method && r.url.startsWith(`${BASE}/purchases`));

  it('novo carrega as opções', async () => {
    await open('/lancamentos/novo');
    expect(root().querySelector('mat-progress-spinner')).not.toBeNull();
    expect(root().querySelector('form')).toBeNull();
    expect(http.match((r) => r.url.startsWith(`${BASE}/purchases`))).toHaveLength(0);
    flushOptions();
    await settle();
    expect(root().querySelector('form')).not.toBeNull();
    expect(root().querySelector('h1')?.textContent?.trim()).toBe('Novo lançamento');
  });

  it('valores iniciais com origem no mês atual', async () => {
    await openNew(origin());
    expect(dateInput().value).toBe('22/10/2026');
    expect(descriptionInput().value).toBe('');
    expect(amountInput().value).toBe('');
    const s = await selects();
    expect(await s.status.getValueText()).toBe('Pago');
    expect(await s.category.getValueText()).toBe('');
    expect(await s.paymentMethod.getValueText()).toBe('');
  });

  it('origem em outro mês', async () => {
    await openNew(origin({ month: 9 }));
    expect(dateInput().value).toBe('01/09/2026');
  });

  it('sem origem', async () => {
    await openNew();
    expect(dateInput().value).toBe('22/10/2026');
  });

  it('edição carrega', async () => {
    await openEdit();
    expect(root().querySelector('h1')?.textContent?.trim()).toBe('Editar lançamento');
    expect(dateInput().value).toBe('05/10/2026');
    expect(descriptionInput().value).toBe('Mercado');
    expect(amountInput().value).toBe('1.234,56');
    const s = await selects();
    expect(await s.category.getValueText()).toBe('Alimentação');
    expect(await s.paymentMethod.getValueText()).toBe('Pix');
    expect(await s.status.getValueText()).toBe('Pago');
    expect(page()!.hasUnsavedChanges()).toBe(false);
  });

  it('id inválido', async () => {
    for (const id of ['abc', '0', '01']) {
      snack.mockClear();
      await open(`/lancamentos/${id}`);
      expect(http.match((r) => r.url.startsWith(`${BASE}/purchases`))).toHaveLength(0);
      expect(router.url).toBe('/lancamentos?ano=2026&mes=10');
      expect(snack).toHaveBeenCalledWith(MSG_NOT_FOUND, undefined, expect.anything());
      // As opções não são pedidas: a página sai antes.
      expect(http.match(() => true)).toHaveLength(0);
    }
  });

  it('404 no GET', async () => {
    await open('/lancamentos/999999');
    http
      .expectOne(`${BASE}/purchases/999999`)
      .flush(http404('NOT_FOUND').body, http404('NOT_FOUND').opts);
    http
      .expectOne(`${BASE}/categories`)
      .flush({ code: 'INTERNAL_SERVER_ERROR', message: 'x' }, { status: 500, statusText: 'E' });
    http.expectOne(`${BASE}/payment-methods`).flush(GLOBAL_PAYMENT_METHODS);
    await settle();
    expect(router.url).toBe('/lancamentos?ano=2026&mes=10');
    expect(snack).toHaveBeenCalledWith(MSG_NOT_FOUND, undefined, expect.anything());
  });

  it('400 no GET', async () => {
    const id = '9'.repeat(19);
    await open(`/lancamentos/${id}`);
    http
      .expectOne(`${BASE}/purchases/${id}`)
      .flush({ code: 'BAD_REQUEST', message: 'x' }, { status: 400, statusText: 'Bad Request' });
    flushOptions();
    await settle();
    expect(router.url).toBe('/lancamentos?ano=2026&mes=10');
    expect(snack).toHaveBeenCalledWith(MSG_NOT_FOUND, undefined, expect.anything());
  });

  it('opções não carregam', async () => {
    await open('/lancamentos/novo');
    http
      .expectOne(`${BASE}/categories`)
      .flush({ code: 'INTERNAL_SERVER_ERROR', message: 'x' }, { status: 500, statusText: 'E' });
    http.expectOne(`${BASE}/payment-methods`).flush(GLOBAL_PAYMENT_METHODS);
    await settle();
    expect(root().querySelector('app-form-alert')?.textContent?.trim()).toBe(MSG_SERVER);
    expect(button(LABEL_SAVE)).toBeUndefined();
    button(LABEL_RETRY)!.click();
    await settle();
    flushOptions();
    await settle();
    expect(button(LABEL_SAVE)).toBeDefined();
  });

  it('validação bloqueia', async () => {
    await openNew();
    type(descriptionInput(), '   ');
    button(LABEL_SAVE)!.click();
    await settle();
    expect(http.match((r) => r.method === 'POST')).toHaveLength(0);
    expect(fieldError(1)).toBe(MSG_DESCRIPTION_REQUIRED);
  });

  it('salvar novo', async () => {
    const navigate = vi.spyOn(router, 'navigate');
    await openNew(origin({ status: 'PENDING', page: 2 }));
    type(dateInput(), '05/10/2026');
    await fill({ description: '  Mercado  ' });
    button(LABEL_SAVE)!.click();
    await settle();
    const req = saveRequest('POST');
    expect(req.request.body).toEqual(CONTRACT_REQUEST);
    req.flush(created(), { status: 201, statusText: 'Created' });
    await settle();
    expect(router.url).toBe('/lancamentos?ano=2026&mes=10&status=PENDING&pagina=2');
    expect(navigate).toHaveBeenLastCalledWith(['/lancamentos'], {
      queryParams: { ano: '2026', mes: '10', status: 'PENDING', pagina: '2' },
      replaceUrl: true,
    });
    expect(snack).toHaveBeenCalledWith(MSG_SAVED, undefined, expect.anything());
  });

  it('salvo em outro mês', async () => {
    await openNew(origin());
    type(dateInput(), '10/09/2026');
    await fill();
    button(LABEL_SAVE)!.click();
    await settle();
    const req = saveRequest('POST');
    expect(req.request.body.purchase_date).toBe('2026-09-10');
    req.flush(created({ purchase_date: '2026-09-10' }), { status: 201, statusText: 'Created' });
    await settle();
    expect(router.url).toBe('/lancamentos?ano=2026&mes=10');
    expect(snack).toHaveBeenCalledWith(
      'Lançamento salvo em setembro de 2026.',
      undefined,
      expect.anything(),
    );
  });

  it('envio único', async () => {
    await openNew();
    await fill();
    button(LABEL_SAVE)!.click();
    await settle();
    // Um segundo envio pelo formulário (Enter) também é ignorado.
    root().querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle();
    expect(button(LABEL_SAVE)!.disabled).toBe(true);
    expect(button(LABEL_SAVE_AND_NEW)!.disabled).toBe(true);
    expect(button(LABEL_SAVE)!.querySelector('mat-progress-spinner')).not.toBeNull();
    const req = saveRequest('POST');
    req.flush(created(), { status: 201, statusText: 'Created' });
    await settle();
  });

  it('salvar e criar outro', async () => {
    await openNew(origin({ month: 9 }));
    await fill();
    button(LABEL_SAVE_AND_NEW)!.click();
    await settle();
    expect(button(LABEL_SAVE_AND_NEW)!.querySelector('mat-progress-spinner')).not.toBeNull();
    saveRequest('POST').flush(created({ purchase_date: '2026-09-01' }), {
      status: 201,
      statusText: 'Created',
    });
    await settle();
    expect(router.url).toBe('/lancamentos/novo');
    expect(dateInput().value).toBe('01/09/2026');
    expect(descriptionInput().value).toBe('');
    expect(amountInput().value).toBe('');
    const s = await selects();
    expect(await s.category.getValueText()).toBe('Alimentação');
    expect(await s.paymentMethod.getValueText()).toBe('Pix');
    expect(await s.status.getValueText()).toBe('Pago');
    expect(document.activeElement).toBe(descriptionInput());
    expect(snack).toHaveBeenCalledWith(MSG_SAVED, undefined, expect.anything());
    expect(button(LABEL_SAVE)!.disabled).toBe(false);
    expect(button(LABEL_SAVE_AND_NEW)!.disabled).toBe(false);
    expect(fieldError(1)).toBeNull();
    expect(page()!.hasUnsavedChanges()).toBe(false);
  });

  it('PUT completo', async () => {
    await openEdit();
    await choose((await selects()).status, 'Pendente');
    button(LABEL_SAVE)!.click();
    await settle();
    const req = http.expectOne((r) => r.method === 'PUT' && r.url === `${BASE}/purchases/42`);
    expect(req.request.body).toEqual({ ...CONTRACT_REQUEST, status: 'PENDING' });
    req.flush({ ...CONTRACT_PURCHASE, status: 'PENDING' });
    await settle();
    expect(router.url).toBe('/lancamentos?ano=2026&mes=10');
    expect(snack).toHaveBeenCalledWith(MSG_SAVED, undefined, expect.anything());
  });

  it('categoria sumiu', async () => {
    const all = [...GLOBAL_CATEGORIES, ...PERSONAL_CATEGORIES];
    await openNew(undefined, all);
    await fill({ category: 'Academia' });
    button(LABEL_SAVE)!.click();
    await settle();
    saveRequest('POST').flush(
      http404('CATEGORY_NOT_FOUND').body,
      http404('CATEGORY_NOT_FOUND').opts,
    );
    await settle();
    expect(router.url).toBe('/lancamentos/novo');
    expect(fieldError(3)).toBe(MSG_CATEGORY_GONE);
    expect(descriptionInput().value).toBe('Mercado');
    expect(amountInput().value).toBe('1.234,56');
    const s = await selects();
    expect(await s.category.getValueText()).toBe('');
    flushOptions(all.filter((o) => o.id !== 31));
    await settle();
    await s.category.open();
    const names = await Promise.all((await s.category.getOptions()).map((o) => o.getText()));
    expect(names).not.toContain('Academia');
    await s.category.close();
  });

  it('forma sumiu', async () => {
    await openNew();
    await fill();
    button(LABEL_SAVE)!.click();
    await settle();
    saveRequest('POST').flush(
      http404('PAYMENT_METHOD_NOT_FOUND').body,
      http404('PAYMENT_METHOD_NOT_FOUND').opts,
    );
    await settle();
    expect(fieldError(4)).toBe(MSG_PAYMENT_METHOD_GONE);
    expect(fieldError(3)).toBeNull();
    flushOptions();
    await settle();
  });

  it('erro some ao escolher', async () => {
    await openNew();
    await fill();
    button(LABEL_SAVE)!.click();
    await settle();
    saveRequest('POST').flush(
      http404('CATEGORY_NOT_FOUND').body,
      http404('CATEGORY_NOT_FOUND').opts,
    );
    await settle();
    flushOptions();
    await settle();
    await choose((await selects()).category, 'Moradia');
    expect(fieldError(3)).toBeFalsy();
  });

  it('lançamento sumiu', async () => {
    await openEdit(origin({ month: 9 }));
    button(LABEL_SAVE)!.click();
    await settle();
    saveRequest('PUT').flush(http404('NOT_FOUND').body, http404('NOT_FOUND').opts);
    await settle();
    expect(router.url).toBe('/lancamentos?ano=2026&mes=9');
    expect(snack).toHaveBeenCalledWith(MSG_PURCHASE_GONE, undefined, expect.anything());
  });

  it('404 de instância antiga', async () => {
    await openNew();
    await fill();
    button(LABEL_SAVE)!.click();
    await settle();
    saveRequest('POST').flush(http404('NOT_FOUND').body, http404('NOT_FOUND').opts);
    await settle();
    expect(alert()).toBe(MSG_SERVER);
    expect(descriptionInput().value).toBe('Mercado');
    flushOptions();
    await settle();
  });

  it('422 inesperado', async () => {
    await openNew();
    await fill();
    button(LABEL_SAVE)!.click();
    await settle();
    saveRequest('POST').flush(
      { code: 'VALIDATION_ERROR', message: 'x' },
      { status: 422, statusText: 'Unprocessable' },
    );
    await settle();
    expect(alert()).toBe(MSG_INVALID_DATA);
    expect(descriptionInput().value).toBe('Mercado');
  });

  it('sem conexão ao salvar', async () => {
    await openNew();
    await fill();
    button(LABEL_SAVE)!.click();
    await settle();
    saveRequest('POST').error(new ProgressEvent('error'), { status: 0 });
    await settle();
    expect(alert()).toBe(MSG_CONNECTION);
    expect(amountInput().value).toBe('1.234,56');
    expect(button(LABEL_SAVE)!.disabled).toBe(false);
    expect(button(LABEL_SAVE_AND_NEW)!.disabled).toBe(false);
  });

  it('cancelar volta à origem', async () => {
    await openNew(origin({ month: 9 }));
    button(LABEL_CANCEL)!.click();
    await settle();
    expect(router.url).toBe('/lancamentos?ano=2026&mes=9');
  });

  async function deleteFromEdit(status: number) {
    await openEdit(origin({ month: 9 }));
    button(LABEL_DELETE)!.click();
    await settle();
    const lines = Array.from(dialog()!.querySelectorAll('p')).map((p) =>
      p.textContent?.trim().replace(/\s/g, ' '),
    );
    expect(lines.slice(0, 3)).toEqual(['Mercado', '05/10/2026', 'R$ 1.234,56']);
    dialogButton(LABEL_DELETE).click();
    await settle();
    const req = http.expectOne((r) => r.method === 'DELETE' && r.url === `${BASE}/purchases/42`);
    if (status === 204) {
      req.flush(null, { status: 204, statusText: 'No Content' });
    } else {
      req.flush(http404('NOT_FOUND').body, http404('NOT_FOUND').opts);
    }
    await settle();
    expect(router.url).toBe('/lancamentos?ano=2026&mes=9');
    expect(snack).toHaveBeenCalledWith(MSG_DELETED, undefined, expect.anything());
  }

  it('excluir pela edição', async () => {
    await deleteFromEdit(204);
  });

  it('excluir 404 pela edição', async () => {
    await deleteFromEdit(404);
  });

  it('beforeunload', async () => {
    await openNew();
    const fire = () => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(fire()).toBe(false);
    type(descriptionInput(), 'Mercado');
    expect(fire()).toBe(true);
  });

  it('opções em ordem', async () => {
    const shuffled = [PERSONAL_CATEGORIES[1], ...GLOBAL_CATEGORIES, PERSONAL_CATEGORIES[0]];
    await openNew(undefined, shuffled);
    const { category } = await selects();
    await category.open();
    const names = await Promise.all((await category.getOptions()).map((o) => o.getText()));
    expect(names).toEqual([
      'Academia',
      'Alimentação',
      'Educação',
      'Lazer',
      'Moradia',
      'Pets',
      'Saúde',
      'Transporte',
    ]);
    await category.close();
  });

  it('o 404 do lançamento editado devolve ao mês da origem', async () => {
    await open('/lancamentos/42', origin({ year: 2025, month: 3 }));
    http
      .expectOne(`${BASE}/purchases/42`)
      .flush(http404('NOT_FOUND').body, http404('NOT_FOUND').opts);
    flushOptions();
    await settle();
    expect(router.url).toBe('/lancamentos?ano=2025&mes=3');
  });

  describe('com o guard de alterações (TF-12)', () => {
    /**
     * Com o diálogo do guard aberto, a navegação fica pendente e o `whenStable` só resolve quando ela termina.
     * Aqui o tempo passa por macrotarefas e a tela é atualizada com `tick()`.
     */
    const render = async () => {
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve));
        TestBed.inject(ApplicationRef).tick();
      }
    };
    const discardDialog = () =>
      dialog()?.querySelector('h2')?.textContent?.trim() === DISCARD_DIALOG_TITLE;

    it('Cancelar com alteração', async () => {
      await openNew(origin({ month: 9 }));
      type(descriptionInput(), 'Mercado');
      button(LABEL_CANCEL)!.click();
      await render();
      expect(discardDialog()).toBe(true);
      dialogButton(LABEL_KEEP_EDITING).click();
      await settle();
      expect(router.url).toBe('/lancamentos/novo');
      expect(descriptionInput().value).toBe('Mercado');

      button(LABEL_CANCEL)!.click();
      await render();
      dialogButton(LABEL_DISCARD).click();
      await settle();
      expect(router.url).toBe('/lancamentos?ano=2026&mes=9');
    });

    it('alterou e desfez', async () => {
      await openNew();
      type(descriptionInput(), 'Mercado');
      type(descriptionInput(), '');
      button(LABEL_CANCEL)!.click();
      await settle();
      expect(dialog()).toBeNull();
      expect(router.url).toBe('/lancamentos?ano=2026&mes=10');
    });

    it('salvar não pergunta', async () => {
      await openNew();
      await fill();
      button(LABEL_SAVE)!.click();
      await settle();
      saveRequest('POST').flush(created(), { status: 201, statusText: 'Created' });
      await settle();
      expect(dialog()).toBeNull();
      expect(router.url).toBe('/lancamentos?ano=2026&mes=10');
    });

    it('lançamento sumiu não pergunta', async () => {
      await openEdit();
      type(descriptionInput(), 'Outro');
      button(LABEL_SAVE)!.click();
      await settle();
      saveRequest('PUT').flush(http404('NOT_FOUND').body, http404('NOT_FOUND').opts);
      await settle();
      expect(dialog()).toBeNull();
      expect(router.url).toBe('/lancamentos?ano=2026&mes=10');
    });

    it('excluir com alteração não pergunta', async () => {
      await openEdit();
      type(descriptionInput(), 'Outro');
      button(LABEL_DELETE)!.click();
      await settle();
      dialogButton(LABEL_DELETE).click();
      await settle();
      http
        .expectOne((r) => r.method === 'DELETE')
        .flush(null, { status: 204, statusText: 'No Content' });
      await settle();
      expect(discardDialog()).toBe(false);
      expect(router.url).toBe('/lancamentos?ano=2026&mes=10');
    });
  });
});
