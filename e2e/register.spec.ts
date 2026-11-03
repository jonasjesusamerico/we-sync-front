import type { Page } from '@playwright/test';
import { ANA } from './support/api-mock';
import { expect, fillRegister, test } from './support/fixtures';
import * as t from './support/texts';

const submit = (page: Page) =>
  page.getByRole('button', { name: t.LABEL_REGISTER_SUBMIT, exact: true });
const heading = (page: Page) => page.getByRole('heading', { level: 1 });

async function startOver(page: Page) {
  await page.evaluate(() => localStorage.clear());
  await page.goto('/cadastro');
}

test('CA-02', async ({ page, api }) => {
  const visited: string[] = [];
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) visited.push(frame.url());
  });
  await page.goto('/cadastro');
  await fillRegister(page, 'Ana Souza', 'ana@exemplo.com', 'Senha123!');
  await submit(page).click();
  await expect(heading(page)).toHaveText('Olá, Ana Souza');
  await expect(page).toHaveURL('/inicio');
  expect(api.calls('/auth/register')).toBe(1);
  expect(api.calls('/auth/login')).toBe(1);
  expect(visited.some((url) => url.includes('/login'))).toBe(false);
});

test('CA-03', async ({ page, api }) => {
  await page.goto('/cadastro');
  const invalid: [string, string][] = [
    ['', t.MSG_NAME_REQUIRED],
    ['   ', t.MSG_NAME_REQUIRED],
    ['A', t.MSG_NAME_LENGTH],
    ['a'.repeat(61), t.MSG_NAME_LENGTH],
  ];
  for (const [name, message] of invalid) {
    await fillRegister(page, name, 'nome@exemplo.com', 'Senha123!');
    await submit(page).click();
    await expect(page.locator('#name-error')).toHaveText(message);
  }
  expect(api.calls('/auth/register')).toBe(0);

  const valid: [string, string][] = [
    ['Jô', 'jo@exemplo.com'],
    ['ã'.repeat(60), 'acentos@exemplo.com'],
  ];
  for (const [name, email] of valid) {
    await startOver(page);
    await fillRegister(page, name, email, 'Senha123!');
    await submit(page).click();
    await expect(heading(page)).toHaveText(`Olá, ${name}`);
  }
  expect(api.calls('/auth/register')).toBe(2);
});

test('CA-04', async ({ page, api }) => {
  await page.goto('/cadastro');
  await fillRegister(page, '  Ana  ', 'ana@exemplo.com', 'Senha123!');
  await submit(page).click();
  await expect(heading(page)).toHaveText('Olá, Ana');
  expect((api.requests('/auth/register')[0].body as { name: string }).name).toBe('Ana');
});

test('CA-06', async ({ page, api }) => {
  await page.goto('/cadastro');
  for (const [password, message] of [
    ['Abc1234', t.MSG_PASSWORD_SHORT],
    ['á'.repeat(40), t.MSG_PASSWORD_LONG],
  ]) {
    await fillRegister(page, 'Ana', 'ana@exemplo.com', password);
    await submit(page).click();
    await expect(page.locator('#password-error')).toHaveText(message);
  }
  expect(api.calls('/auth/register')).toBe(0);
});

test('CA-07', async ({ page, api }) => {
  await page.goto('/cadastro');
  for (const email of ['ana@exemplo', `${'a'.repeat(243)}@exemplo.com`]) {
    await fillRegister(page, 'Ana', email, 'Senha123!');
    await submit(page).click();
    await expect(page.locator('#email-error')).toHaveText(t.MSG_EMAIL_INVALID);
  }
  expect(api.calls('/auth/register')).toBe(0);
});

test('CA-08', async ({ page, api }) => {
  await page.goto('/cadastro');
  const bar = page.locator('.ws-strength .progress-bar');
  const hint = page.locator('#password-hint');
  await expect(hint).toHaveText(t.STRENGTH_HINT_EMPTY);
  for (const [password, width, text] of [
    ['abcdefgh', '25%', t.STRENGTH_HINT_WEAK],
    ['Abcdefgh', '50%', t.STRENGTH_HINT_WEAK],
    ['Abcdefg1', '75%', t.STRENGTH_HINT_STRONG],
    ['Abcdef1!', '100%', t.STRENGTH_HINT_STRONG],
  ]) {
    await page.locator('#password').fill(password);
    await expect(bar).toHaveAttribute('style', new RegExp(`width: ${width}`));
    await expect(hint).toHaveText(text);
  }
  await fillRegister(page, 'Ana Souza', 'ana@exemplo.com', 'abcdefgh');
  await submit(page).click();
  await expect(heading(page)).toHaveText('Olá, Ana Souza');
  expect(api.calls('/auth/register')).toBe(1);
});

test('CA-09', async ({ page }) => {
  for (const url of ['/cadastro', '/login']) {
    await page.goto(url);
    await page.locator('#password').fill('Senha123!');
    await page.getByRole('button', { name: t.LABEL_SHOW_PASSWORD }).click();
    await expect(page.locator('#password')).toHaveAttribute('type', 'text');
    await expect(page.getByRole('button', { name: t.LABEL_HIDE_PASSWORD })).toBeVisible();
  }
});

test('CA-10', async ({ page, api }) => {
  api.addUser(ANA);
  await page.goto('/cadastro');
  await fillRegister(page, 'Ana Souza', ' ANA@exemplo.com ', 'Senha123!');
  await submit(page).click();
  const alert = page.getByRole('alert');
  await expect(alert).toContainText(t.MSG_EMAIL_TAKEN);
  await alert.getByRole('link', { name: t.LABEL_GO_TO_LOGIN }).click();
  await expect(page).toHaveURL('/login');
});

for (const failure of [500, 'abort'] as const) {
  test(`CA-11 ${failure}`, async ({ page, api }) => {
    api.fail('/auth/login', failure);
    await page.goto('/cadastro');
    await fillRegister(page, 'Ana Souza', 'ana@exemplo.com', 'Senha123!');
    await submit(page).click();
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('status')).toHaveText(t.MSG_ACCOUNT_CREATED);
    await expect(page.locator('#email')).toHaveValue('ana@exemplo.com');
    await expect(page.locator('#password')).toBeFocused();
  });
}

test('CA-14 cadastro @double-submit', async ({ page, api }) => {
  api.delay('/auth/register', 800);
  await page.goto('/cadastro');
  await fillRegister(page, 'Ana Souza', 'ana@exemplo.com', 'Senha123!');
  const button = submit(page);
  await button.dblclick();
  await page.locator('#password').press('Enter');
  await expect(button).toBeDisabled();
  await page.waitForTimeout(900);
  await expect(heading(page)).toHaveText('Olá, Ana Souza');
  expect(api.calls('/auth/register')).toBe(1);
  expect(api.calls('/auth/login')).toBe(1);
});

test('CA-25 cadastro', async ({ page, api }) => {
  api.fail('/auth/register', 'abort');
  await page.goto('/cadastro');
  await fillRegister(page, 'Ana Souza', 'ana@exemplo.com', 'Senha123!');
  await submit(page).click();
  await expect(page.getByRole('alert')).toHaveText(t.MSG_CONNECTION);
  await expect(page.locator('#name')).toHaveValue('Ana Souza');
  await expect(page.locator('#email')).toHaveValue('ana@exemplo.com');
  await expect(page.locator('#password')).toHaveValue('Senha123!');
});

test('CA-19 pelo cadastro', async ({ page }) => {
  await page.goto('/inicio?origem=link');
  await expect(page).toHaveURL('/login?returnUrl=%2Finicio%3Forigem%3Dlink');
  await page.getByRole('link', { name: t.LABEL_CREATE_ACCOUNT }).click();
  await expect(page).toHaveURL('/cadastro?returnUrl=%2Finicio%3Forigem%3Dlink');
  await fillRegister(page, 'Ana Souza', 'ana@exemplo.com', 'Senha123!');
  await submit(page).click();
  await expect(page).toHaveURL('/inicio?origem=link');
  await expect(heading(page)).toHaveText('Olá, Ana Souza');
});
