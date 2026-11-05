import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injectable,
  OnDestroy,
  Signal,
  signal,
} from '@angular/core';
import { Icon } from '../icon/icon';
import { LABEL_CLOSE_TOAST } from '../ui.messages';

export type ToastKind = 'success' | 'warning';

export interface ToastMessage {
  id: number;
  text: string;
  kind: ToastKind;
}

/** How long a toast stays on screen (ADR-08). */
export const TOAST_DURATION_MS = 5000;

/** One toast at a time (ADR-08, D-04): a new one replaces the current one and restarts the timer. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly message = signal<ToastMessage | null>(null);
  private nextId = 1;
  private timer: ReturnType<typeof setTimeout> | null = null;

  readonly current: Signal<ToastMessage | null> = this.message.asReadonly();

  show(text: string, kind: ToastKind = 'success'): void {
    this.stopTimer();
    this.message.set({ id: this.nextId++, text, kind });
    this.timer = setTimeout(() => this.dismiss(), TOAST_DURATION_MS);
  }

  dismiss(): void {
    this.stopTimer();
    this.message.set(null);
  }

  /** End of session: nothing of the previous user stays on screen. */
  clear(): void {
    this.dismiss();
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

/**
 * Where the toast appears (toast() of app.js + .ws-toast). The live region is always in the DOM, so screen readers
 * announce the text when it is inserted (D-04).
 */
@Component({
  selector: 'ws-toast-host',
  imports: [Icon],
  template: `
    <div role="status" aria-live="polite">
      @if (toast(); as t) {
        <div class="ws-toast">
          <ws-icon [name]="t.kind === 'success' ? 'check' : 'alert'" />
          <span>{{ t.text }}</span>
          <button
            type="button"
            class="btn btn-icon"
            [attr.aria-label]="LABEL_CLOSE_TOAST"
            (click)="dismiss()"
          >
            <ws-icon name="x" />
          </button>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastHost implements OnDestroy {
  private readonly service = inject(ToastService);
  protected readonly toast = computed(() => this.service.current());
  protected readonly LABEL_CLOSE_TOAST = LABEL_CLOSE_TOAST;

  protected dismiss(): void {
    this.service.dismiss();
  }

  ngOnDestroy(): void {
    this.service.clear();
  }
}
