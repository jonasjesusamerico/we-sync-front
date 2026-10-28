import { BreakpointState } from '@angular/cdk/layout';
import { BehaviorSubject, Observable, map } from 'rxjs';

/**
 * Substitui o `BreakpointObserver` nos testes: a query passada a `observe`/`isMatched` é ignorada e o modo (largo ou estreito) vem de `setWide`.
 * Uso: `{ provide: BreakpointObserver, useClass: FakeBreakpointObserver }`.
 */
export class FakeBreakpointObserver {
  private readonly wide = new BehaviorSubject<boolean>(true);

  observe(): Observable<BreakpointState> {
    return this.wide.pipe(map((matches) => ({ matches, breakpoints: {} })));
  }

  isMatched(): boolean {
    return this.wide.value;
  }

  setWide(value: boolean): void {
    this.wide.next(value);
  }
}
