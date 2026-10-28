import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { LABEL_LOGIN, LABEL_REGISTER } from '../../features/auth/auth.messages';
import { BrandComponent } from '../../shared/brand/brand.component';
import { LABEL_AUTH_TABS } from '../layout.messages';

/**
 * Layout das telas de visitante (ADR-04 da 002): formulário à esquerda, com abas Entrar e Criar conta (uma rota por
 * aba), e painel na cor primária com a marca grande à direita, a partir de 960 px.
 */
@Component({
  selector: 'app-auth-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatTabNav,
    MatTabLink,
    MatTabNavPanel,
    BrandComponent,
  ],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayoutComponent {
  /** A aba ativa vem só da URL (`routerLinkActive`). */
  protected readonly tabs = [
    { path: '/login', label: LABEL_LOGIN },
    { path: '/cadastro', label: LABEL_REGISTER },
  ] as const;
  protected readonly tabsLabel = LABEL_AUTH_TABS;
}
