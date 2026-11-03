import { ANA } from './support/api-mock';
import { expect, fillLogin, loginAs, test } from './support/fixtures';
import { seedSession } from './support/session';
import * as t from './support/texts';

test.beforeEach(({ api }) => api.addUser(ANA));

const submit = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: t.LABEL_LOGIN_SUBMIT, exact: true });

test('CA-12', async ({ page }) => {
  await page.goto('/login');
  await fillLogin(page, ANA.email, 'senha-errada');
  await submit(page).click();
  await expect(page.getByRole('alert')).toHaveText(t.MSG_INVALID_CREDENTIALS);
  await expect(page.locator('#password')).toHaveValue('');
  await expect(page.locator('#email')).toHaveValue(ANA.email);

  await fillLogin(page, 'ninguem@exemplo.com', 'Senha123!');
  await submit(page).click();
  await expect(page.getByRole('alert')).toHaveText(t.MSG_INVALID_CREDENTIALS);
  await expect(page.locator('#password')).toHaveValue('');
  await expect(page.locator('#email')).toHaveValue('ninguem@exemplo.com');
});

test('CA-13', async ({ page }) => {
  await loginAs(page);
  await expect(page).toHaveURL('/inicio');
  await expect(page.locator('.ws-page-head p')).toHaveText(t.HOME_SUBTITLE);
  await expect(page.locator('.ws-callout')).toHaveText(t.HOME_SOON);
  await expect(page.locator('#ws-sidebar')).toBeVisible();
  await expect(page.locator('.ws-month, .ws-hero, .ws-kpi')).toHaveCount(0);
});

test('CA-14 login @double-submit', async ({ page, api }) => {
  api.delay('/auth/login', 800);
  api.delay('/users/me', 500);
  await page.goto('/login');
  await fillLogin(page, ANA.email, ANA.password);
  const button = submit(page);
  await button.dblclick();
  await page.locator('#password').press('Enter');
  await expect(button).toBeDisabled();
  await page.waitForTimeout(900);
  await expect(button).toBeDisabled();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Olá, Ana Souza');
  expect(api.calls('/auth/login')).toBe(1);
});

test('CA-19', async ({ page }) => {
  await page.goto('/inicio?origem=link');
  await expect(page).toHaveURL('/login?returnUrl=%2Finicio%3Forigem%3Dlink');
  await fillLogin(page, ANA.email, ANA.password);
  await submit(page).click();
  await expect(page).toHaveURL('/inicio?origem=link');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Olá, Ana Souza');
});

for (const param of ['https%3A%2F%2Fevil.example', '%2F%2Fevil.example']) {
  test(`CA-20 ${param}`, async ({ page }) => {
    await page.goto(`/login?returnUrl=${param}`);
    await fillLogin(page, ANA.email, ANA.password);
    await submit(page).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Olá, Ana Souza');
    await expect(page).toHaveURL('http://localhost:4200/inicio');
  });
}

test('CA-21', async ({ page, api }) => {
  await seedSession(page, api.issueSession(ANA.email));
  for (const url of ['/login', '/cadastro']) {
    await page.goto(url);
    await expect(page).toHaveURL('/inicio');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Olá, Ana Souza');
  }
});

test('CA-25 login', async ({ page, api }) => {
  api.fail('/auth/login', 'abort');
  await page.goto('/login');
  await fillLogin(page, ANA.email, ANA.password);
  await submit(page).click();
  await expect(page.getByRole('alert')).toHaveText(t.MSG_CONNECTION);
  await expect(page.locator('#email')).toHaveValue(ANA.email);
  await expect(page.locator('#password')).toHaveValue(ANA.password);
});

test('5xx e 422', async ({ page, api }) => {
  await page.goto('/login');
  await fillLogin(page, ANA.email, ANA.password);
  api.fail('/auth/login', 500);
  await submit(page).click();
  await expect(page.getByRole('alert')).toHaveText(t.MSG_SERVER);
  api.fail('/auth/login', 422);
  await submit(page).click();
  await expect(page.getByRole('alert')).toHaveText(t.MSG_INVALID_DATA);
});

test('senha curta no login', async ({ page, api }) => {
  await page.goto('/login');
  await fillLogin(page, ANA.email, 'a');
  await submit(page).click();
  await expect(page.getByRole('alert')).toHaveText(t.MSG_INVALID_CREDENTIALS);
  expect(api.calls('/auth/login')).toBe(1);
});

test('esqueci a senha', async ({ page }) => {
  await page.goto('/login');
  const forgot = page.getByRole('button', { name: `${t.LABEL_FORGOT_PASSWORD}, em breve` });
  await forgot.click({ force: true });
  await forgot.press('Enter');
  await expect(page).toHaveURL('/login');
});

test('Bearer só na API', async ({ page, api }) => {
  await loginAs(page);
  expect(api.requests('/users/me')[0].headers['authorization']).toMatch(/^Bearer access-/);
  expect(api.requests('/auth/login')[0].headers['authorization']).toBeUndefined();
});
