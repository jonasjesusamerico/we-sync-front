import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  Injectable,
  Injector,
  OnDestroy,
  Signal,
  signal,
  viewChild,
} from '@angular/core';
import { Observable, Subscription, take } from 'rxjs';
import { FormAlert } from '../form-alert/form-alert';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';

export interface ConfirmRequest {
  title: string;
  lines?: readonly string[];
  /** 'trash' to delete, 'alert' to discard. */
  icon: IconName;
  /** The danger button. */
  confirmLabel: string;
  /** The ghost button, focused when the dialog opens. */
  cancelLabel: string;
  /** RN-13: runs while the buttons are locked; the first value or the completion confirms. */
  action?: () => Observable<unknown>;
  /** Text shown inside the dialog when the action fails. */
  errorMessage?: (error: unknown) => string;
}

/** Confirmation dialog (ADR-07, D-02): one request at a time, answered with true or false. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly request = signal<ConfirmRequest | null>(null);
  private readonly running = signal(false);
  private readonly failure = signal<string | null>(null);
  private resolve: ((confirmed: boolean) => void) | null = null;
  private subscription: Subscription | null = null;

  readonly active: Signal<ConfirmRequest | null> = this.request.asReadonly();
  readonly busy: Signal<boolean> = this.running.asReadonly();
  readonly error: Signal<string | null> = this.failure.asReadonly();

  /** With another request open, the new one is answered false at once. */
  ask(request: ConfirmRequest): Promise<boolean> {
    if (this.request() !== null) {
      return Promise.resolve(false);
    }
    this.failure.set(null);
    this.request.set(request);
    return new Promise<boolean>((resolve) => (this.resolve = resolve));
  }

  confirm(): void {
    const request = this.request();
    if (request === null || this.running()) {
      return;
    }
    if (!request.action) {
      this.finish(true);
      return;
    }
    this.running.set(true);
    this.failure.set(null);
    let settled = false;
    const done = () => {
      if (!settled) {
        settled = true;
        this.finish(true);
      }
    };
    const subscription = request
      .action()
      .pipe(take(1))
      .subscribe({
        next: done,
        complete: done,
        error: (error: unknown) => {
          settled = true;
          this.subscription = null;
          this.running.set(false);
          this.failure.set(request.errorMessage?.(error) ?? null);
        },
      });
    // A synchronous action has already settled here.
    this.subscription = settled ? null : subscription;
  }

  /** Ignored while the action runs. */
  cancel(): void {
    if (this.request() !== null && !this.running()) {
      this.finish(false);
    }
  }

  /** End of session: answers the open request with false, even mid-action. */
  cancelAll(): void {
    if (this.request() !== null) {
      this.finish(false);
    }
  }

  private finish(confirmed: boolean): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
    const resolve = this.resolve;
    this.resolve = null;
    this.running.set(false);
    this.failure.set(null);
    this.request.set(null);
    resolve?.(confirmed);
  }
}

/** The native <dialog> of the confirmation (#confirm-modal of configuracoes.html, D-02). */
@Component({
  selector: 'ws-confirm-host',
  imports: [Icon, FormAlert],
  template: `
    <dialog
      #dialog
      class="ws-dialog"
      aria-labelledby="ws-confirm-title"
      aria-describedby="ws-confirm-text"
      (cancel)="onEsc($event)"
    >
      @if (request(); as r) {
        <div class="modal-content">
          <div class="modal-body text-center p-4">
            <span class="ws-kpi-icon is-danger mx-auto mb-3"><ws-icon [name]="r.icon" /></span>
            <h2 class="fs-5 fw-bold" id="ws-confirm-title">{{ r.title }}</h2>
            <div class="text-muted mb-4 text-break" id="ws-confirm-text">
              @for (line of r.lines ?? []; track $index) {
                <p class="mb-1">{{ line }}</p>
              }
            </div>
            @if (error(); as message) {
              <ws-form-alert kind="error">{{ message }}</ws-form-alert>
            }
            <div class="d-grid gap-2">
              <button
                type="button"
                class="btn btn-danger"
                [disabled]="busy()"
                [attr.aria-busy]="busy()"
                (click)="confirm()"
              >
                @if (busy()) {
                  <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                }
                {{ r.confirmLabel }}
              </button>
              <button
                #cancelButton
                type="button"
                class="btn btn-ghost"
                [disabled]="busy()"
                (click)="cancel()"
              >
                {{ r.cancelLabel }}
              </button>
            </div>
          </div>
        </div>
      }
    </dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmHost implements OnDestroy {
  private readonly service = inject(ConfirmService);
  private readonly injector = inject(Injector);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancelButton');
  private returnFocus: HTMLElement | null = null;

  protected readonly request = this.service.active;
  protected readonly busy = this.service.busy;
  protected readonly error = this.service.error;

  constructor() {
    effect(() => {
      const request = this.request();
      const dialog = this.dialog().nativeElement;
      if (request && !dialog.open) {
        const active = document.activeElement;
        this.returnFocus = active instanceof HTMLElement ? active : null;
        dialog.showModal();
        afterNextRender(() => this.cancelButton()?.nativeElement.focus(), {
          injector: this.injector,
        });
      } else if (!request && dialog.open) {
        dialog.close();
        if (this.returnFocus?.isConnected) {
          this.returnFocus.focus();
        }
        this.returnFocus = null;
      }
    });
  }

  protected confirm(): void {
    this.service.confirm();
  }

  protected cancel(): void {
    this.service.cancel();
  }

  /** Esc: never let the browser close the dialog by itself; cancel respects the running action. */
  protected onEsc(event: Event): void {
    event.preventDefault();
    this.service.cancel();
  }

  ngOnDestroy(): void {
    this.service.cancelAll();
  }
}
