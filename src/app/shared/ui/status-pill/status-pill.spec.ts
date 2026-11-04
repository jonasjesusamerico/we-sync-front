import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { text } from '../../../../testing/dom';
import { StatusPill, StatusPillKind } from './status-pill';

@Component({
  imports: [StatusPill],
  template: `<ws-status-pill [kind]="kind()" [label]="label()" />`,
})
class Host {
  readonly kind = signal<StatusPillKind>('paid');
  readonly label = signal('Paga');
}

describe('StatusPill (pílula)', () => {
  it.each([
    ['paid', 'Paga', 'is-paid'],
    ['pending', 'Pendente', 'is-pending'],
    ['canceled', 'Cancelada', 'is-canceled'],
  ] as const)('%s', async (kind, label, cls) => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.kind.set(kind);
    fixture.componentInstance.label.set(label);
    await fixture.whenStable();
    const pill = (fixture.nativeElement as HTMLElement).querySelector('span.ws-status')!;
    expect(pill.classList).toContain(cls);
    expect(pill.classList.length).toBe(2);
    expect(text(pill)).toBe(label);
  });
});
