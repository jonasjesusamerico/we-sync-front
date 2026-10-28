import { expect, test } from '@playwright/test';

import { CONTRACT, mockApi } from './support/api-mock';
import { logout } from './support/layout';
import { readSession, seedSession } from './support/session';
import { HOME_TITLE } from './support/texts';

test.describe('session', () => {
  test('sessão persiste', async ({ context, page }) => {
    await seedSession(page);
    await page.close();

    const again = await context.newPage();
    await again.goto('/');
    await expect(again.getByRole('heading', { name: HOME_TITLE })).toBeVisible();
  });

  test('visitante em rota interna', async ({ page }) => {
    await mockApi(page, { login: CONTRACT.tokens });
    await page.goto('/');
    await expect(page).toHaveURL('/login?returnUrl=%2F');

    await page.getByLabel('E-mail').fill('ana@exemplo.com');
    await page.getByLabel('Senha', { exact: true }).fill('senha123');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL('/');
  });

  test('returnUrl externo', async ({ page }) => {
    await mockApi(page, { login: CONTRACT.tokens });
    await page.goto('/login?returnUrl=https%3A%2F%2Fevil.com');

    await page.getByLabel('E-mail').fill('ana@exemplo.com');
    await page.getByLabel('Senha', { exact: true }).fill('senha123');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByRole('heading', { name: HOME_TITLE })).toBeVisible();
    expect(page.url()).toBe('http://localhost:4200/');
  });

  test('autenticado abre login e cadastro', async ({ page }) => {
    await seedSession(page);

    await page.goto('/login');
    await expect(page).toHaveURL('/');
    await page.goto('/cadastro');
    await expect(page).toHaveURL('/');
  });

  test('Sair e voltar', async ({ page }) => {
    const api = await mockApi(page, { logout: CONTRACT.loggedOut });
    await seedSession(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: HOME_TITLE })).toBeVisible();

    await logout(page);
    await expect(page).toHaveURL('/login');
    expect(api.bodies.logout[0]).toEqual({ refresh_token: 'R1' });

    await page.goBack();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: HOME_TITLE })).toHaveCount(0);
    expect(await readSession(page)).toBeNull();
  });

  test('Sair sem rede', async ({ page }) => {
    await mockApi(page, { logout: 'abort' });
    await seedSession(page);
    await page.goto('/');

    await logout(page);

    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('status')).toHaveCount(0);
    expect(await readSession(page)).toBeNull();
  });

  test('Sair em uma aba', async ({ context, page }) => {
    await mockApi(page, { logout: CONTRACT.loggedOut });
    await seedSession(page);
    await page.goto('/');
    const other = await context.newPage();
    await other.goto('/');
    await expect(other.getByRole('heading', { name: HOME_TITLE })).toBeVisible();

    await logout(page);

    await expect(other).toHaveURL('/login', { timeout: 5_000 });
  });

  test('Entrar em uma aba', async ({ context, page }) => {
    await mockApi(page, { login: CONTRACT.tokens });
    await page.goto('/login');
    const other = await context.newPage();
    await other.goto('/login');

    await page.getByLabel('E-mail').fill('ana@exemplo.com');
    await page.getByLabel('Senha', { exact: true }).fill('senha123');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL('/');
    await expect(other).toHaveURL('/', { timeout: 5_000 });
  });
});
