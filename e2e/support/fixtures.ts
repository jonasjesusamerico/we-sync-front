import { test as base, expect, type Page } from '@playwright/test';
import { ANA, mockApi, type ApiMock, type MockUser } from './api-mock';

export { expect };

/** `api`: the fake API of this test's context, with no user yet. */
export const test = base.extend<{ api: ApiMock }>({
  // auto: every test talks to the fake API, even when it does not use `api` (no request reaches :8080).
  api: [
    async ({ context }, use) => {
      await use(await mockApi(context));
    },
    { auto: true },
  ],
});

export async function fillLogin(page: Page, email: string, password: string): Promise<void> {
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
}

/** Login through the UI and waits for the home page. */
export async function loginAs(page: Page, user: MockUser = ANA): Promise<void> {
  await page.goto('/login');
  await fillLogin(page, user.email, user.password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Olá, ${user.name}`);
}

export async function fillRegister(
  page: Page,
  name: string,
  email: string,
  password: string,
): Promise<void> {
  await page.locator('#name').fill(name);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
}

export async function openUserMenu(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Menu da conta' }).click();
  await expect(page.locator('.ws-user-menu .dropdown-menu')).toHaveClass(/show/);
}

/** The home page always ends on its canonical address, with the month (ADR-04 of feature 005). */
export const HOME_URL = /\/inicio\?ano=\d{1,4}&mes=\d{1,2}$/;
