import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SoonDirective } from './soon';

@Component({
  imports: [SoonDirective],
  template: `
    <button id="labeled" type="button" wsSoon wsSoonLabel="Compras">Compras</button>
    <button id="tagged" type="button" wsSoon>
      Compras <span class="ws-badge-soon">em breve</span>
    </button>
    <form (submit)="submitted = submitted + 1">
      <button id="in-form" type="button" wsSoon wsSoonLabel="Nova compra">Nova compra</button>
    </form>
    <div
      tabindex="-1"
      (click)="parentClicks = parentClicks + 1"
      (keydown)="parentKeys = parentKeys + 1"
    >
      <button id="in-parent" type="button" wsSoon wsSoonLabel="Sino">Sino</button>
    </div>
  `,
})
class Host {
  submitted = 0;
  parentClicks = 0;
  parentKeys = 0;
}

async function render() {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  return { fixture, button: (id: string) => root.querySelector<HTMLButtonElement>(`#${id}`)! };
}

describe('SoonDirective', () => {
  it('em breve com rótulo', async () => {
    const { button } = await render();
    const el = button('labeled');
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.getAttribute('title')).toBe('Em breve');
    expect(el.getAttribute('aria-label')).toBe('Compras, em breve');
    expect(el.classList).toContain('is-soon');
    expect(el.hasAttribute('disabled')).toBe(false);
  });

  it('em breve sem rótulo', async () => {
    const { button } = await render();
    const el = button('tagged');
    expect(el.hasAttribute('aria-label')).toBe(false);
    expect(el.textContent!.replace(/\s+/g, ' ').trim()).toBe('Compras em breve');
  });

  it('em breve não age', async () => {
    const { fixture, button } = await render();
    for (const id of ['in-form', 'in-parent']) {
      const el = button(id);
      const click = new MouseEvent('click', { bubbles: true, cancelable: true });
      el.dispatchEvent(click);
      expect(click.defaultPrevented).toBe(true);
      for (const key of ['Enter', ' ']) {
        const keydown = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        el.dispatchEvent(keydown);
        expect(keydown.defaultPrevented, `${id} ${key}`).toBe(true);
      }
    }
    expect(fixture.componentInstance.parentClicks).toBe(0);
    expect(fixture.componentInstance.parentKeys).toBe(0);
    expect(fixture.componentInstance.submitted).toBe(0);
  });
});
