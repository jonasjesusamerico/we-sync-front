import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Icon } from '../../shared/ui/icon/icon';
import { SoonDirective } from '../../shared/ui/soon/soon';
import { SOON_TAG } from '../../shared/ui/ui.messages';
import * as t from './settings.messages';

/**
 * Settings page (configuracoes.html, RF-03, ADR-12): header, section menu and the current section. The menu is a
 * column from `lg` up and a row with its own horizontal scroll below it, only by CSS.
 */
@Component({
  selector: 'ws-settings-page',
  imports: [Icon, RouterLink, RouterLinkActive, RouterOutlet, SoonDirective],
  templateUrl: './settings-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  protected readonly t = t;
  protected readonly SOON_TAG = SOON_TAG;

  private readonly nav = viewChild.required<ElementRef<HTMLElement>>('nav');
  private readonly injector = inject(Injector);

  constructor() {
    // Phone: keep the current section in view, like bindSectionNav of app.js (no effect on desktop). On the first
    // visit the page is created after its NavigationEnd (nested outlet), so it also scrolls after the first render.
    afterNextRender(() => this.scrollToCurrent());
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => afterNextRender(() => this.scrollToCurrent(), { injector: this.injector }));
  }

  /** RouterLinkActive sets aria-current in a microtask after the render: read it after that one. */
  private scrollToCurrent(): void {
    queueMicrotask(() => this.scrollNow());
  }

  private scrollNow(): void {
    const nav = this.nav().nativeElement;
    const link = nav.querySelector<HTMLElement>('a[aria-current="page"]');
    if (link) {
      nav.scrollLeft = link.offsetLeft - nav.offsetLeft - 8;
    }
  }
}
