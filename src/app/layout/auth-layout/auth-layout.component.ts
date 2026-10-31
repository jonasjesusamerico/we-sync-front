import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { LABEL_LOGIN, LABEL_REGISTER } from '../../features/auth/auth.messages';
import { BrandComponent } from '../../shared/brand/brand.component';
import { LABEL_AUTH_TABS } from '../layout.messages';

/**
 * Layout das telas de visitante no estilo "boxed" do ArchitectUI: fundo em degradê, marca e um cartão com as abas
 * Entrar e Criar conta (uma rota por aba, ADR-04 da 002).
 */
@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BrandComponent],
  templateUrl: './auth-layout.component.html',
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100dvh;
      padding: 1rem;
    }

    .auth-box {
      width: 100%;
      max-width: 500px;
    }

    .brand {
      display: flex;
      justify-content: center;
      margin-bottom: 1.5rem;
    }

    .card-header {
      background: transparent;
    }
  `,
  host: { class: 'bg-plum-plate' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayoutComponent {
  /** A aba ativa vem só da URL (`routerLinkActive`). */
  protected readonly tabs = [
    { path: '/login', label: LABEL_LOGIN, id: 'auth-tab-login' },
    { path: '/cadastro', label: LABEL_REGISTER, id: 'auth-tab-register' },
  ] as const;
  protected readonly tabsLabel = LABEL_AUTH_TABS;
  protected readonly panelId = 'auth-tab-panel';

  /** Setas e Home/End movem o foco entre as abas (padrão de abas da WAI-ARIA); Enter segue o link. */
  protected onTabKeydown(event: KeyboardEvent): void {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) {
      return;
    }
    const tab = event.currentTarget as HTMLElement;
    const links = Array.from(
      tab.closest('[role="tablist"]')!.querySelectorAll<HTMLElement>('[role="tab"]'),
    );
    const current = links.indexOf(tab);
    const last = links.length - 1;
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? last
          : event.key === 'ArrowRight'
            ? (current + 1) % links.length
            : (current - 1 + links.length) % links.length;
    event.preventDefault();
    links[next].focus();
  }
}
