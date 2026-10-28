import { expect, test } from '@playwright/test';

import { logout } from './support/layout';
import { readSession } from './support/session';
import { HOME_TITLE, MSG_REGISTERED } from './support/texts';

test('stack real', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || /CORS|Content Security Policy/i.test(message.text())) {
      problems.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));

  const email = `smoke-${Date.now()}@exemplo.com`;

  await page.goto('/cadastro');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill('senha123');
  await page.getByLabel('Confirmar senha').fill('senha123');
  const [register] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().endsWith('/api/v1/auth/register') && r.request().method() === 'POST',
    ),
    page.getByRole('button', { name: 'Criar conta' }).click(),
  ]);
  expect(register.status()).toBe(201);
  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('status')).toHaveText(MSG_REGISTERED);

  await page.getByLabel('Senha', { exact: true }).fill('senha123');
  const [login] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().endsWith('/api/v1/auth/login') && r.request().method() === 'POST',
    ),
    page.getByRole('button', { name: 'Entrar' }).click(),
  ]);
  expect(login.status()).toBe(200);
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: HOME_TITLE })).toBeVisible();

  const [loggedOut] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().endsWith('/api/v1/auth/logout') && r.request().method() === 'POST',
    ),
    logout(page),
  ]);
  expect(loggedOut.status()).toBe(204);
  await expect(page).toHaveURL('/login');
  expect(await readSession(page)).toBeNull();

  expect(problems).toEqual([]);
});
