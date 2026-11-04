import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ICON_PATHS } from '../icon/icons';
import { CategoryBubble } from './category-bubble';

@Component({
  imports: [CategoryBubble],
  template: `<ws-category-bubble icon="food" color="var(--ws-cat-food)" />`,
})
class Host {}

describe('CategoryBubble (bolha)', () => {
  it('bolha com --cat e o ícone', async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const bubble = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      'ws-category-bubble',
    )!;
    expect(bubble.classList).toContain('ws-cat');
    expect(bubble.getAttribute('aria-hidden')).toBe('true');
    expect(bubble.style.getPropertyValue('--cat')).toBe('var(--ws-cat-food)');
    expect(bubble.querySelector('path')!.getAttribute('d')).toBe(ICON_PATHS.food);
  });
});
