import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { SessionEnd } from '../../../core/auth/session-end';
import { CurrentUserStore } from '../../../core/user/current-user-store';
import { initials } from '../../../core/user/initials';
import { Icon } from '../../../shared/ui/icon/icon';
import { SoonDirective } from '../../../shared/ui/soon/soon';
import * as texts from '../shell.messages';

/** Account menu (RF-05, DAS 5.4): WAI-ARIA "menu button" without Bootstrap's JS. */
@Component({
  selector: 'ws-user-menu',
  imports: [Icon, SoonDirective],
  templateUrl: './user-menu.html',
  host: { class: 'ws-user-menu', '(document:click)': 'onDocumentClick($event)' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenu {
  private readonly store = inject(CurrentUserStore);
  private readonly sessionEnd = inject(SessionEnd);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly texts = texts;
  protected readonly user = this.store.user;
  protected readonly initials = computed(() => {
    const user = this.user();
    return user ? initials(user.name) : '';
  });

  readonly open = signal(false);
  readonly activeIndex = signal(0);

  private readonly button = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly items = viewChildren<ElementRef<HTMLButtonElement>>('item');

  protected toggle(): void {
    if (this.open()) {
      this.close();
    } else {
      this.openAt(0);
    }
  }

  protected onButtonKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.openAt(0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.openAt(this.items().length - 1);
    }
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    const count = this.items().length;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusItem((this.activeIndex() + 1) % count);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusItem((this.activeIndex() - 1 + count) % count);
        break;
      case 'Home':
        event.preventDefault();
        this.focusItem(0);
        break;
      case 'End':
        event.preventDefault();
        this.focusItem(count - 1);
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        this.button().nativeElement.focus();
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  protected logout(): void {
    this.close();
    this.sessionEnd.logout();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  private openAt(index: number): void {
    this.open.set(true);
    this.activeIndex.set(index);
    // The menu only becomes focusable once `.show` is rendered.
    afterNextRender(() => this.focusItem(index), { injector: this.injector });
  }

  private focusItem(index: number): void {
    this.activeIndex.set(index);
    this.items()[index]?.nativeElement.focus();
  }

  private close(): void {
    this.open.set(false);
  }
}
