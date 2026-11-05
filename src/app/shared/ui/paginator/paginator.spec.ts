import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { text } from '../../../../testing/dom';
import { Paginator } from './paginator';

@Component({
  imports: [Paginator],
  template: `<ws-paginator
    [page]="page()"
    [totalPages]="total()"
    (pageChange)="emitted.push($event)"
  />`,
})
class Host {
  readonly page = signal(1);
  readonly total = signal(3);
  readonly emitted: number[] = [];
}

async function render(page: number, total: number) {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.page.set(page);
  fixture.componentInstance.total.set(total);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const [previous, next] = Array.from(root.querySelectorAll<HTMLButtonElement>('.ws-pager button'));
  return { root, previous, next, emitted: fixture.componentInstance.emitted };
}

describe('Paginator (paginador)', () => {
  it('primeira página', async () => {
    const { root, previous, next, emitted } = await render(1, 3);
    expect(text(root.querySelector('.ws-pager > span'))).toBe('Página 1 de 3');
    expect(text(previous)).toBe('Anterior');
    expect(text(next)).toBe('Próxima');
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(false);
    expect(previous.classList).toContain('btn-ghost');
    next.click();
    expect(emitted).toEqual([2]);
  });

  it('última página', async () => {
    const { previous, next, emitted } = await render(3, 3);
    expect(next.disabled).toBe(true);
    previous.click();
    expect(emitted).toEqual([2]);
  });
});
