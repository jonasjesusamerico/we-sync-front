import { expect, Page, test } from '@playwright/test';

import { CONTRACT, mockApi } from './support/api-mock';
import { tab } from './support/layout';
import {
  APP_NAME,
  HOME_TITLE,
  LABEL_ACCOUNT,
  LABEL_AUTH_TABS,
  LABEL_LOGIN,
  LABEL_REGISTER,
  MSG_CONNECTION,
  MSG_EMAIL_FORMAT,
  MSG_EMAIL_MAX_BYTES,
  MSG_EMAIL_TAKEN,
  MSG_INVALID_CREDENTIALS,
  MSG_PASSWORD_MAX_BYTES,
  MSG_PASSWORD_MIN_BYTES,
  MSG_PASSWORD_MISMATCH,
  MSG_REGISTERED,
} from './support/texts';

const email = (page: Page) => page.getByLabel('E-mail');
const password = (page: Page) => page.getByLabel('Senha', { exact: true });
const confirmPassword = (page: Page) => page.getByLabel('Confirmar senha');
const fieldError = (page: Page, label: string) =>
  page
    .locator('.field', { has: page.getByLabel(label, { exact: true }) })
    .locator('.invalid-feedback');

test.describe('auth', () => {
  test('fluxo principal', async ({ page }) => {
    const api = await mockApi(page, { register: CONTRACT.registered, login: CONTRACT.tokens });

    await page.goto('/');
    await expect(page).toHaveURL('/login?returnUrl=%2F');
    await tab(page, LABEL_REGISTER).click();
    await expect(page).toHaveURL('/cadastro');

    await email(page).fill('ana@exemplo.com');
    await password(page).fill('senha123');
    await confirmPassword(page).fill('senha123');
    await page.getByRole('button', { name: 'Criar conta' }).click();

    await expect(page).toHaveURL('/login');
    await expect(tab(page, LABEL_LOGIN)).toHaveAttribute('aria-selected', 'true');
    await expect(email(page)).toHaveValue('ana@exemplo.com');
    await expect(page.getByRole('status')).toHaveText(MSG_REGISTERED);
    expect(api.bodies.register[0]).toEqual({ email: 'ana@exemplo.com', password: 'senha123' });

    await password(page).fill('senha123');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByText('we-sync', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: LABEL_ACCOUNT })).toBeVisible();
    await expect(page.getByRole('heading', { name: HOME_TITLE })).toBeVisible();
  });

  test('confirmação diferente', async ({ page }) => {
    const api = await mockApi(page, { register: CONTRACT.registered });
    await page.goto('/cadastro');

    await email(page).fill('ana@exemplo.com');
    await password(page).fill('senha123');
    await confirmPassword(page).fill('senha124');
    await page.getByRole('button', { name: 'Criar conta' }).click();

    await expect(fieldError(page, 'Confirmar senha')).toHaveText(MSG_PASSWORD_MISMATCH);
    expect(api.calls.register).toBe(0);
  });

  test('senha curta e longa', async ({ page }) => {
    const api = await mockApi(page, { register: CONTRACT.registered });
    await page.goto('/cadastro');
    await email(page).fill('ana@exemplo.com');

    await password(page).fill('senha12');
    await confirmPassword(page).fill('senha12');
    await page.getByRole('button', { name: 'Criar conta' }).click();
    await expect(fieldError(page, 'Senha')).toHaveText(MSG_PASSWORD_MIN_BYTES);

    const long = 'á'.repeat(40);
    await password(page).fill(long);
    await confirmPassword(page).fill(long);
    await page.getByRole('button', { name: 'Criar conta' }).click();
    await expect(fieldError(page, 'Senha')).toHaveText(MSG_PASSWORD_MAX_BYTES);

    expect(api.calls.register).toBe(0);
  });

  test('e-mail inválido e longo', async ({ page }) => {
    const api = await mockApi(page, { register: CONTRACT.registered });
    await page.goto('/cadastro');
    await password(page).fill('senha123');
    await confirmPassword(page).fill('senha123');

    await email(page).fill('ana@exemplo');
    await page.getByRole('button', { name: 'Criar conta' }).click();
    await expect(fieldError(page, 'E-mail')).toHaveText(MSG_EMAIL_FORMAT);

    await email(page).fill('a'.repeat(243) + '@exemplo.com');
    await page.getByRole('button', { name: 'Criar conta' }).click();
    await expect(fieldError(page, 'E-mail')).toHaveText(MSG_EMAIL_MAX_BYTES);

    expect(api.calls.register).toBe(0);
  });

  test('e-mail duplicado', async ({ page }) => {
    const api = await mockApi(page, { register: CONTRACT.conflict });
    await page.goto('/cadastro');

    await email(page).fill('  ANA@exemplo.com ');
    await password(page).fill('senha123');
    await confirmPassword(page).fill('senha123');
    await page.getByRole('button', { name: 'Criar conta' }).click();

    const alert = page.getByRole('alert');
    await expect(alert).toContainText(MSG_EMAIL_TAKEN);
    await expect(alert.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
    expect(api.bodies.register[0]).toEqual({ email: 'ANA@exemplo.com', password: 'senha123' });
    await expect(page.getByText('email already registered')).toHaveCount(0);
  });

  test('credenciais inválidas', async ({ page }) => {
    await mockApi(page, { login: CONTRACT.invalidCredentials });
    await page.goto('/login');

    await email(page).fill('ana@exemplo.com');
    await password(page).fill('senha123');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByRole('alert')).toHaveText(MSG_INVALID_CREDENTIALS);
    await expect(password(page)).toHaveValue('');
    await expect(email(page)).toHaveValue('ana@exemplo.com');
    await expect(page.locator('.invalid-feedback')).toHaveCount(0);
  });

  test('API fora do ar', async ({ page }) => {
    await mockApi(page, { login: 'abort', register: 'abort' });

    await page.goto('/login');
    await email(page).fill('ana@exemplo.com');
    await password(page).fill('senha123');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('alert')).toHaveText(MSG_CONNECTION);
    await expect(email(page)).toHaveValue('ana@exemplo.com');
    await expect(password(page)).toHaveValue('senha123');

    await page.goto('/cadastro');
    await email(page).fill('ana@exemplo.com');
    await password(page).fill('senha123');
    await confirmPassword(page).fill('senha123');
    await page.getByRole('button', { name: 'Criar conta' }).click();
    await expect(page.getByRole('alert')).toHaveText(MSG_CONNECTION);
    await expect(email(page)).toHaveValue('ana@exemplo.com');
    await expect(password(page)).toHaveValue('senha123');
    await expect(confirmPassword(page)).toHaveValue('senha123');
  });

  test('clique duplo', async ({ page }) => {
    const api = await mockApi(page, { login: { ...CONTRACT.tokens, delayMs: 500 } });
    await page.goto('/login');

    await email(page).fill('ana@exemplo.com');
    await password(page).fill('senha123');
    await page.getByRole('button', { name: 'Entrar' }).dblclick();
    await password(page).press('Enter');

    await expect(page).toHaveURL('/');
    expect(api.calls.login).toBe(1);
  });

  test('mostrar senha', async ({ page }) => {
    await page.goto('/login');
    await password(page).fill('senha123');

    await page.getByRole('button', { name: 'Mostrar senha' }).click();
    await expect(password(page)).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Ocultar senha' }).click();
    await expect(password(page)).toHaveAttribute('type', 'password');
  });

  test('CA-06 cartão sobre o degradê', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/login');

    const layout = page.locator('app-auth-layout');
    await expect(layout).toHaveClass(/bg-plum-plate/);
    const brand = layout.locator('app-brand');
    await expect(brand.locator('.name')).toHaveText(APP_NAME);
    const card = layout.locator('.card');
    const brandBox = await brand.boundingBox();
    const cardBox = await card.boundingBox();
    expect(brandBox!.y).toBeLessThan(cardBox!.y);
    expect(cardBox!.width).toBeLessThanOrEqual(500);

    const tablist = page.getByRole('tablist', { name: LABEL_AUTH_TABS });
    await expect(tablist).toBeVisible();
    await expect(tablist.getByRole('tab')).toHaveText([LABEL_LOGIN, LABEL_REGISTER]);
    await expect(tab(page, LABEL_LOGIN)).toHaveAttribute('aria-selected', 'true');
  });

  test('CA-08 abas trocam a URL', async ({ page }) => {
    await page.goto('/login');

    await tab(page, LABEL_REGISTER).click();
    await expect(page).toHaveURL('/cadastro');
    await expect(confirmPassword(page)).toBeVisible();

    await tab(page, LABEL_LOGIN).click();
    await expect(page).toHaveURL('/login');
    await expect(confirmPassword(page)).toHaveCount(0);
  });

  test('CA-09 /cadastro direto', async ({ page }) => {
    await page.goto('/cadastro');

    await expect(tab(page, LABEL_REGISTER)).toHaveAttribute('aria-selected', 'true');
    await expect(tab(page, LABEL_LOGIN)).toHaveAttribute('aria-selected', 'false');
  });

  test('trocar de aba descarta o digitado', async ({ page }) => {
    await page.goto('/login');
    await email(page).fill('ana@exemplo.com');

    await tab(page, LABEL_REGISTER).click();
    await expect(page).toHaveURL('/cadastro');
    await tab(page, LABEL_LOGIN).click();
    await expect(page).toHaveURL('/login');

    await expect(email(page)).toHaveValue('');
  });

  test('CA-11 sem Google nem Esqueci a senha', async ({ page }) => {
    for (const url of ['/login', '/cadastro']) {
      await page.goto(url);
      await expect(email(page)).toBeVisible();
      await expect(page.getByText(/google/i)).toHaveCount(0);
      await expect(page.getByText(/esqueci/i)).toHaveCount(0);
    }
  });
});
