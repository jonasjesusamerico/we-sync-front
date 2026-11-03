import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Brand } from '../../shared/ui/brand/brand';
import { Icon } from '../../shared/ui/icon/icon';
import { SoonDirective } from '../../shared/ui/soon/soon';
import { SOON_TAG } from '../../shared/ui/ui.messages';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { BOTTOM_NAV_KEYS, NAV_GROUP_ORDER, NAV_ITEMS, NavItem } from './nav-items';
import * as texts from './shell.messages';
import { UserMenu } from './user-menu/user-menu';

/** Inner shell (DAS 2.3): sidebar from lg up, top bar, content and the bottom navigation below lg. */
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
  ],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
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
