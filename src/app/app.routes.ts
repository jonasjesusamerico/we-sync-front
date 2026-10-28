import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  // Telas internas. Telas novas entram nas filhas daqui. Tem de vir antes do AuthLayout (ver abaixo).
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        title: 'Início · we-sync',
        loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
      },
    ],
  },
  // Telas de visitante sob o layout dividido (ADR-04 da 002). Fica DEPOIS do Shell: um pai `''` com filhas casa `/`
  // mesmo sem filha nenhuma (outlet vazio), e por isso abriria `/` sem o `authGuard`. Para `/login` e `/cadastro`, o
  // Shell não casa (a filha `''` não consome o segmento) e o roteador chega aqui sem rodar o `authGuard`.
  {
    path: '',
    loadComponent: () =>
      import('./layout/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        title: 'Entrar · we-sync',
        loadComponent: () => import('./features/auth/login/login.page').then((m) => m.LoginPage),
      },
      {
        path: 'cadastro',
        canActivate: [guestGuard],
        title: 'Criar conta · we-sync',
        loadComponent: () =>
          import('./features/auth/register/register.page').then((m) => m.RegisterPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
