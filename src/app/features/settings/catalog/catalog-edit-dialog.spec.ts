import { HttpTestingController } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  CATEGORIES_EXAMPLE,
  ERROR_ARCHIVED_NAME_CONFLICT,
  ERROR_DEFAULT_NAME_CONFLICT,
  ERROR_FORBIDDEN,
  ERROR_NAME_CONFLICT,
  PAYMENT_METHODS_EXAMPLE,
} from '../../../../testing/api-examples';
import { installDialogStub } from '../../../../testing/dialog';
import { text, typeInto } from '../../../../testing/dom';
import { API, httpTestingProviders } from '../../../../testing/http';
import { settle } from '../../../../testing/session';
import type { CatalogKind, Category, PaymentMethod } from '../../../core/catalog/catalog.models';
import * as t from '../settings.messages';
import { CatalogEditDialog } from './catalog-edit-dialog';

const cat = (id: number) => CATEGORIES_EXAMPLE.find((c) => c.id === id)!;
const failure = (status: number) => ({ status, statusText: 'Error' });

@Component({
  imports: [CatalogEditDialog],
  template: `
    @if (open()) {
      <ws-catalog-edit-dialog
        [kind]="kind()"
        [item]="item()"
        (saved)="events.push('saved'); open.set(false)"
        (gone)="events.push('gone'); open.set(false)"
        (closed)="events.push('closed'); open.set(false)"
      />
    }
  `,
})
class Host {
  readonly open = signal(true);
  readonly kind = signal<CatalogKind>('category');
  readonly item = signal<Category | PaymentMethod>(cat(31));
  readonly events: string[] = [];
}

describe('CatalogEditDialog', () => {
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
  });

  async function render(configure?: (host: Host) => void) {
    const fixture = TestBed.createComponent(Host);
    configure?.(fixture.componentInstance);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    return {
      host: fixture.componentInstance,
      root,
      dialog: () => root.querySelector('dialog'),
      name: () => root.querySelector<HTMLInputElement>('#edit-name')!,
      submit: () => root.querySelector<HTMLButtonElement>('button[type=submit]')!,
      close: () => root.querySelector<HTMLButtonElement>('.modal-header button')!,
      cancel: () => root.querySelector<HTMLButtonElement>('.modal-footer .btn-ghost')!,
      nameError: () => text(root.querySelector('#edit-name-error')),
      stable: async () => {
        await settle();
        await fixture.whenStable();
      },
    };
  }

  it('estrutura', async () => {
    const view = await render();
    expect(stub.showModal).toHaveBeenCalledTimes(1);
    expect(view.dialog()!.classList).toContain('is-default');
    expect(view.dialog()!.getAttribute('aria-labelledby')).toBe('edit-title');
    expect(text(view.root.querySelector('#edit-title'))).toBe('Editar categoria');
    expect(view.close().getAttribute('aria-label')).toBe(t.LABEL_CLOSE);
    expect(view.name().hasAttribute('autofocus')).toBe(true);
    expect(view.name().value).toBe('Pets');
    expect(view.root.querySelector<HTMLInputElement>('#ei-HEART')!.checked).toBe(true);
    expect(view.root.querySelector<HTMLInputElement>('#ec-LEISURE')!.checked).toBe(true);
    expect(view.root.querySelector('.modal-body')!.classList).toContain('d-grid');
  });

  it('editar arquivada com o nome', async () => {
    const view = await render();
    typeInto(view.name(), 'academia');
    view.submit().click();
    http.expectOne(`${API}/categories/31`).flush(ERROR_ARCHIVED_NAME_CONFLICT, failure(409));
    await view.stable();
    expect(view.nameError()).toBe(
      'Você tem uma categoria arquivada com esse nome. Reative-a em Arquivadas.',
    );
    expect(document.activeElement).toBe(view.name());
    expect(view.dialog()).not.toBeNull();
    expect(view.host.events).toEqual([]);
  });

  it.each([
    [ERROR_DEFAULT_NAME_CONFLICT, 'Já existe uma categoria padrão com esse nome.'],
    [ERROR_NAME_CONFLICT, 'Você já tem uma categoria com esse nome.'],
  ])('editar com nome repetido: %o', async (error, message) => {
    const view = await render();
    view.submit().click();
    http.expectOne(`${API}/categories/31`).flush(error, failure(409));
    await view.stable();
    expect(view.nameError()).toBe(message);
  });

  it('403 e outros: aviso geral', async () => {
    const view = await render();
    view.submit().click();
    http.expectOne(`${API}/categories/31`).flush(ERROR_FORBIDDEN, failure(403));
    await view.stable();
    expect(text(view.root.querySelector('.alert'))).toBe(t.MSG_SERVER);
    expect(view.root.querySelector('#edit-name-error')).toBeNull();
    expect(view.dialog()).not.toBeNull();
  });

  it('editar nome antigo longo', async () => {
    const long = 'x'.repeat(45);
    const view = await render((h) => h.item.set({ ...cat(31), name: long }));
    expect(view.name().value).toBe(long);
    view.submit().click();
    await view.stable();
    expect(view.nameError()).toBe(t.ERR_CATALOG_NAME_MAX);
    http.expectNone(`${API}/categories/31`);
    typeInto(view.name(), 'x'.repeat(46));
    expect(view.name().value).toBe(long);
    typeInto(view.name(), 'x'.repeat(44));
    expect(view.name().value).toBe('x'.repeat(44));
  });

  it('editar cancelar: Cancelar, × e Esc', async () => {
    const view = await render();
    view.cancel().click();
    await view.stable();
    view.host.open.set(true);
    await view.stable();
    view.close().click();
    await view.stable();
    view.host.open.set(true);
    await view.stable();
    const event = new Event('cancel', { cancelable: true });
    view.dialog()!.dispatchEvent(event);
    await view.stable();
    expect(event.defaultPrevented).toBe(true);
    expect(view.host.events).toEqual(['closed', 'closed', 'closed']);
    http.expectNone(`${API}/categories/31`);
  });

  it('envio único e botões travados', async () => {
    const view = await render();
    view.submit().click();
    await view.stable();
    view.root.querySelector('form')!.dispatchEvent(new Event('submit'));
    expect(view.submit().disabled).toBe(true);
    expect(view.submit().getAttribute('aria-busy')).toBe('true');
    expect(view.close().disabled).toBe(true);
    expect(view.cancel().disabled).toBe(true);
    const event = new Event('cancel', { cancelable: true });
    view.dialog()!.dispatchEvent(event);
    expect(view.host.events).toEqual([]);
    http.expectOne(`${API}/categories/31`).flush(cat(31));
    await view.stable();
    expect(view.host.events).toEqual(['saved']);
  });

  it('forma: só o nome, neutra sem ícone', async () => {
    const view = await render((h) => {
      h.kind.set('payment');
      h.item.set(PAYMENT_METHODS_EXAMPLE[7]);
    });
    expect(view.root.querySelector('fieldset')).toBeNull();
    typeInto(view.name(), '  VR  ');
    view.submit().click();
    const req = http.expectOne(`${API}/payment-methods/40`);
    expect(req.request.body).toEqual({ name: 'VR' });
    req.flush({ ...PAYMENT_METHODS_EXAMPLE[7], name: 'VR' });
    await view.stable();
    expect(view.host.events).toEqual(['saved']);
  });
});
