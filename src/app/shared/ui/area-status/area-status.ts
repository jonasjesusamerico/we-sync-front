import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';
import { LABEL_LOADING, LABEL_RETRY } from '../ui.messages';

/**
 * Loading and error state of an area (RF-25, RN-26): each area loads and fails on its own. `onHero` is the version
 * inside the blue spending card (white text and the white button of .ws-hero).
 */
@Component({
  selector: 'ws-area-status',
  imports: [Icon],
  template: `
    @if (onHero()) {
      @if (status() === 'loading') {
        <div class="py-3" role="status">
          <span class="spinner-border" aria-hidden="true"></span>
          <span class="visually-hidden">{{ LABEL_LOADING }}</span>
        </div>
      } @else {
        <div class="py-2" role="alert">
          <p class="mb-2">{{ message() }}</p>
          <button type="button" class="btn" (click)="retry.emit()">{{ LABEL_RETRY }}</button>
        </div>
      }
    } @else {
      @if (status() === 'loading') {
        <div class="ws-empty" role="status">
          <span class="spinner-border" aria-hidden="true"></span>
          <span class="visually-hidden">{{ LABEL_LOADING }}</span>
        </div>
      } @else {
        <div class="ws-empty" role="alert">
          <span class="ws-kpi-icon"><ws-icon name="alert" /></span>
          <div class="fw-bold text-body">{{ message() }}</div>
          <button type="button" class="btn btn-ghost mt-3" (click)="retry.emit()">
            {{ LABEL_RETRY }}
          </button>
        </div>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreaStatus {
  readonly status = input.required<'loading' | 'error'>();
  readonly message = input('');
  readonly onHero = input(false);
  readonly retry = output<void>();

  protected readonly LABEL_LOADING = LABEL_LOADING;
  protected readonly LABEL_RETRY = LABEL_RETRY;
}
