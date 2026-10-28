import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, inject, linkedSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatListItem, MatListItemIcon, MatListItemTitle, MatNavList } from '@angular/material/list';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { MatToolbar } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { finalize, map } from 'rxjs';

import { AuthApi } from '../core/auth/auth.api';
import { SessionStore } from '../core/auth/session.store';
import { BrandComponent } from '../shared/brand/brand.component';
import { WIDE_LAYOUT_QUERY } from './breakpoints';
import { LABEL_ACCOUNT, LABEL_LOGOUT, LABEL_MAIN_NAV, LABEL_OPEN_MENU } from './layout.messages';
import { NAV_ITEMS } from './nav-items';

/**
 * Layout das rotas internas (feature 002): topo com marca e menu de conta (Sair), menu lateral fixo no modo largo
 * e por cima no estreito.
 */
@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbar,
    MatIconButton,
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatSidenavContainer,
    MatSidenav,
    MatSidenavContent,
    MatNavList,
    MatListItem,
    MatListItemIcon,
    MatListItemTitle,
    BrandComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly api = inject(AuthApi);
  private readonly store = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly breakpoints = inject(BreakpointObserver);

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
    account: LABEL_ACCOUNT,
    logout: LABEL_LOGOUT,
    mainNav: LABEL_MAIN_NAV,
  };

  protected openMenu(): void {
    this.menuOpen.set(true);
  }

  /**
   * Fechar pelo fundo escurecido ou pelo `Esc` (modo estreito). Recebe o estado real do drawer (`sidenav.opened`),
   * e não o valor do evento: o `openedChange` é assíncrono, e um aviso atrasado reabriria o menu num ciclo sem fim
   * (decisão da TF-03, feature 002).
   */
  protected onOpenedChange(open: boolean): void {
    if (!this.isWide()) {
      this.menuOpen.set(open);
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
