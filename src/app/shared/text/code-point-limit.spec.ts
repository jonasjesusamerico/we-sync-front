import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CodePointLimitDirective, limitCodePoints } from './code-point-limit';

const points = (text: string) => Array.from(text).length;

describe('limitCodePoints', () => {
  it('até o limite passa como digitado', () => {
    expect(limitCodePoints('', 'a'.repeat(40), 40)).toBe('a'.repeat(40));
  });

  it('41º emoji é recusado', () => {
    const forty = '😀'.repeat(40);
    expect(limitCodePoints(forty, forty + '😀', 40)).toBe(forty);
  });

  it('colar preenche até o limite', () => {
    expect(limitCodePoints('', 'b'.repeat(50), 40)).toBe('b'.repeat(40));
  });

  it('valor antigo maior só diminui', () => {
    const old = 'a'.repeat(45);
    expect(points(limitCodePoints(old, 'a'.repeat(44), 40))).toBe(44);
    expect(limitCodePoints(old, old + 'b', 40)).toBe(old);
  });
});

@Component({
  imports: [ReactiveFormsModule, CodePointLimitDirective],
  template: `<input [formControl]="control" [wsCodePointLimit]="5" />`,
})
class Host {
  readonly control = new FormControl('', { nonNullable: true });
}

describe('CodePointLimitDirective', () => {
  async function render() {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const type = (value: string) => {
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    return { fixture, input, type };
  }

  it('limita o campo e o valor do formulário', async () => {
    const { fixture, input, type } = await render();
    type('abcdefg');
    expect(input.value).toBe('abcde');
    expect(fixture.componentInstance.control.value).toBe('abcde');
  });

  it('valor inicial maior só diminui', async () => {
    const { fixture, input, type } = await render();
    fixture.componentInstance.control.setValue('abcdefgh');
    expect(input.value).toBe('abcdefgh');
    type('abcdefghi');
    expect(input.value).toBe('abcdefgh');
    type('abcdefg');
    expect(fixture.componentInstance.control.value).toBe('abcdefg');
  });
});
