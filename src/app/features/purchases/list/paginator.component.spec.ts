import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LABEL_NEXT_PAGE, LABEL_PAGINATION, LABEL_PREVIOUS_PAGE } from '../purchase.messages';
import { PaginatorComponent } from './paginator.component';

describe('PaginatorComponent', () => {
  let fixture: ComponentFixture<PaginatorComponent>;
  let pages: number[];

  async function render(page: number, total: number, pageSize = 20) {
    fixture = TestBed.createComponent(PaginatorComponent);
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('total', total);
    fixture.componentRef.setInput('pageSize', pageSize);
    pages = [];
    fixture.componentInstance.pageChange.subscribe((p) => pages.push(p));
    await fixture.whenStable();
  }

  const host = () => fixture.nativeElement as HTMLElement;
  const range = () => host().querySelector('.range-label')?.textContent?.trim();
  const button = (name: string) =>
    host().querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!;

  it('intervalo 1–20 de 47', async () => {
    await render(1, 47);
    expect(range()).toBe('1–20 de 47');
    expect(host().querySelector('nav')?.getAttribute('aria-label')).toBe(LABEL_PAGINATION);
    await render(3, 47);
    expect(range()).toBe('41–47 de 47');
    await render(1, 0);
    expect(range()).toBe('0–0 de 0');
  });

  it('setas e limites', async () => {
    await render(1, 47);
    expect(button(LABEL_PREVIOUS_PAGE).disabled).toBe(true);
    button(LABEL_NEXT_PAGE).click();
    expect(pages).toEqual([2]);

    await render(3, 47);
    expect(button(LABEL_NEXT_PAGE).disabled).toBe(true);
    button(LABEL_PREVIOUS_PAGE).click();
    expect(pages).toEqual([2]);
  });
});
