import { CdkTrapFocus } from '@angular/cdk/a11y';
import { BreakpointObserver } from '@angular/cdk/layout';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition } from '@angular/cdk/overlay';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { finalize, map } from 'rxjs';

import { AuthApi } from '../core/auth/auth.api';
import { SessionStore } from '../core/auth/session.store';
import { BrandComponent } from '../shared/brand/brand.component';
import { WIDE_LAYOUT_QUERY } from './breakpoints';
import {
  LABEL_ACCOUNT,
  LABEL_CLOSE_MENU,
  LABEL_LOGOUT,
  LABEL_MAIN_NAV,
  LABEL_MENU_SECTION,
  LABEL_OPEN_MENU,
} from './layout.messages';
import { NAV_ITEMS } from './nav-items';

/**
 * Layout das rotas internas no visual do ArchitectUI: topo com marca e menu de conta (Sair), menu lateral fixo no
 * modo largo e por cima no estreito (com fundo escurecido, foco preso e `Esc`).
 */
@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
    CdkTrapFocus,
    BrandComponent,
  ],
  templateUrl: './shell.component.html',
  host: { '(keydown.escape)': 'onEscape()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly api = inject(AuthApi);
  private readonly store = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly breakpoints = inject(BreakpointObserver);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly menuButton = viewChild<ElementRef<HTMLButtonElement>>('menuButton');

  protected readonly isWide = toSignal(
    this.breakpoints.observe(WIDE_LAYOUT_QUERY).pipe(map((s) => s.matches)),
    { initialValue: this.breakpoints.isMatched(WIDE_LAYOUT_QUERY) },
  );
  /** Menu por cima (modo estreito). Volta a `false` sempre que o modo muda (A1, CA-05). */
  protected readonly menuOpen = linkedSignal({ source: this.isWide, computation: () => false });
  protected readonly loggingOut = signal(false);
  protected readonly navItems = NAV_ITEMS;
  protected readonly text = {
    openMenu: LABEL_OPEN_MENU,
    closeMenu: LABEL_CLOSE_MENU,
    account: LABEL_ACCOUNT,
    logout: LABEL_LOGOUT,
    mainNav: LABEL_MAIN_NAV,
    menuSection: LABEL_MENU_SECTION,
  };
  /** Menu de conta alinhado à direita, embaixo do botão. */
  protected readonly accountMenuPosition: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
  ];

  /** Abre o menu por cima e leva o foco ao primeiro item (como o drawer fazia). */
  protected openMenu(): void {
    this.menuOpen.set(true);
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>('#app-sidenav a')?.focus(),
      { injector: this.injector },
    );
  }

  /** Fecha o menu por cima; pelo fundo ou pelo `Esc`, o foco volta ao ☰. */
  protected closeMenu(restoreFocus: boolean): void {
    this.menuOpen.set(false);
    if (restoreFocus) {
      afterNextRender(() => this.menuButton()?.nativeElement.focus(), {
        injector: this.injector,
      });
    }
  }

  /** `Esc` só fecha o menu por cima (o foco está preso nele); o menu fixo continua aberto. */
  protected onEscape(): void {
    if (!this.isWide() && this.menuOpen()) {
      this.closeMenu(true);
    }
  }

  /** RF-08: escolher um item fecha o menu por cima. */
  protected onNavigate(): void {
    if (!this.isWide()) {
      this.menuOpen.set(false);
    }
  }

  /** RN-11 (001): qualquer resultado do logout limpa a sessão e vai ao login, sem mensagem. */
  protected logout(): void {
    if (this.loggingOut()) {
      return;
    }
    this.loggingOut.set(true);
    const session = this.store.read();
    const done = () => {
      this.store.clear();
      void this.router.navigate(['/login'], { replaceUrl: true });
    };
    if (!session) {
      done();
      return;
    }
    this.api
      .logout(session.refresh_token)
      .pipe(finalize(done))
      .subscribe({
        error: () => {
          // RN-11: sem mensagem.
        },
      });
  }
}
