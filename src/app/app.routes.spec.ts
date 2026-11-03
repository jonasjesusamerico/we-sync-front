import { authGuard, guestGuard } from './core/auth/auth-guards';
import { currentUserResolver } from './core/user/current-user-resolver';
import { routes } from './app.routes';
import { LoginPage } from './features/auth/login/login-page';
import { RegisterPage } from './features/auth/register/register-page';
import { HomePage } from './features/home/home-page';
import { Shell } from './layout/shell/shell';

describe('routes (rotas)', () => {
  it('follows the table "Rotas e telas"', () => {
    expect(routes.map((r) => r.path)).toEqual(['', 'login', 'cadastro', '', '**']);
    expect(routes[0]).toMatchObject({ pathMatch: 'full', redirectTo: 'inicio' });
    expect(routes[1]).toMatchObject({ canActivate: [guestGuard], title: 'Entrar · we-sync' });
    expect(routes[2]).toMatchObject({ canActivate: [guestGuard], title: 'Criar conta · we-sync' });
    expect(routes[3]).toMatchObject({
      canActivate: [authGuard],
      resolve: { user: currentUserResolver },
    });
    expect(routes[3].children?.map((c) => [c.path, c.title])).toEqual([
      ['inicio', 'Início · we-sync'],
    ]);
    expect(routes[4]).toMatchObject({ redirectTo: 'inicio' });
    for (const route of [routes[1], routes[2], routes[3], routes[3].children![0]]) {
      expect(route.loadComponent).toBeTypeOf('function');
    }
  });

  it('loads the lazy components', async () => {
    const components = await Promise.all(
      [routes[1], routes[2], routes[3], routes[3].children![0]].map((r) => r.loadComponent!()),
    );
    expect(components).toEqual([LoginPage, RegisterPage, Shell, HomePage]);
  });
});
