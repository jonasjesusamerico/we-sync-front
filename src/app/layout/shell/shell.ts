import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import {
  IsActiveMatchOptions,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, map } from 'rxjs';
import { TODAY } from '../../core/navigation/today';
import {
  NEW_PURCHASE_PATH,
  originFromUrl,
  originState,
} from '../../features/purchases/purchase-links';
import { ConfirmHost } from '../../shared/ui/confirm/confirm';
import { ToastHost } from '../../shared/ui/toast/toast';
import { Brand } from '../../shared/ui/brand/brand';
import { Icon } from '../../shared/ui/icon/icon';
import { SoonDirective } from '../../shared/ui/soon/soon';
import { SOON_TAG } from '../../shared/ui/ui.messages';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { BOTTOM_NAV_KEYS, NAV_GROUP_ORDER, NAV_ITEMS, NavItem } from './nav-items';
import * as texts from './shell.messages';
import { UserMenu } from './user-menu/user-menu';

/**
 * Inner shell (DAS 2.3): sidebar from lg up, top bar, content and the bottom navigation below lg. It also hosts the
 * toast and the confirmation dialog (feature 005).
 */
@Component({
  selector: 'ws-shell',
  imports: [
    NgTemplateOutlet,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    Brand,
    Icon,
    SoonDirective,
    ThemeToggle,
    UserMenu,
    ToastHost,
    ConfirmHost,
  ],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly router = inject(Router);
  private readonly today = inject(TODAY);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );
  /** The "Nova compra" links carry the screen they were opened from (ADR-05, RN-14). */
  protected readonly newPurchaseState = computed(() =>
    originState(originFromUrl(this.router.parseUrl(this.url()), this.today())),
  );
  protected readonly NEW_PURCHASE_PATH = NEW_PURCHASE_PATH;
  /** "Compras" stays active in /compras?…, /compras/nova and /compras/42 (RF-02). */
  protected readonly ACTIVE_OPTIONS: IsActiveMatchOptions = {
    paths: 'subset',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'ignored',
  };
  protected readonly texts = texts;
  protected readonly SOON_TAG = SOON_TAG;
  protected readonly groups = NAV_GROUP_ORDER.map((group) => ({
    title: group,
    items: NAV_ITEMS.filter((item) => item.group === group),
  }));
  private readonly bottom = BOTTOM_NAV_KEYS.map(
    (key) => NAV_ITEMS.find((item) => item.key === key) as NavItem,
  );
  /** Bottom navigation: the "+" button sits between the second and the third item. */
  protected readonly bottomStart = this.bottom.slice(0, 2);
  protected readonly bottomEnd = this.bottom.slice(2);
}
