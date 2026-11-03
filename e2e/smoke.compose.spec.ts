// CA-36 and CA-02 against the real stack (front on :3000, API on :8080). Run with `npm run e2e:compose`.
import { expect, test } from '@playwright/test';

test('cadastro, Início com o nome e sair na stack real', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(message.text());
    }
  });
  page.on('pageerror', (error) => problems.push(error.message));

  const email = `smoke+${Date.now()}@exemplo.com`;
  await page.goto('/cadastro');
  await page.locator('#name').fill('Ana Souza');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill('Senha123!');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();

  await expect(page).toHaveURL('/inicio');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Olá, Ana Souza');

  await page.getByRole('button', { name: /Menu da conta/ }).click();
  await page.getByRole('menuitem', { name: 'Sair' }).click();
  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Que bom te ver de novo');

  const blocked = problems.filter((text) => /Content Security Policy|CORS|Refused to/i.test(text));
  expect(blocked).toEqual([]);
});
