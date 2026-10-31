import { Injectable, OnDestroy, signal } from '@angular/core';

export const NOTICE_DURATION_MS = 5_000;

export interface Notice {
  /** Muda a cada aviso, para o mesmo texto repetido aparecer de novo. */
  id: number;
  text: string;
}

/**
 * ADR-10 (003): aviso que sobrevive à navegação (serviço root, mostrado pelo `ToastHostComponent` do `App`). Some
 * em 5 s; um aviso novo substitui o anterior.
 */
@Injectable({ providedIn: 'root' })
export class Notifier implements OnDestroy {
  private readonly current = signal<Notice | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private nextId = 0;

  readonly notice = this.current.asReadonly();

  show(text: string): void {
    clearTimeout(this.timer);
    this.current.set({ id: this.nextId++, text });
    this.timer = setTimeout(() => this.current.set(null), NOTICE_DURATION_MS);
  }

  dismiss(): void {
    clearTimeout(this.timer);
    this.current.set(null);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }
}
