import { expect, Page, Request, test } from '@playwright/test';

import { CONTRACT, mockApi } from './support/api-mock';
import { logout } from './support/layout';
import { mockPurchasesApi, PurchaseSeed } from './support/purchases-mock';
import { readSession, seedSession } from './support/session';
import {
  DISCARD_DIALOG_TITLE,
  HOME_TITLE,
  LABEL_AMOUNT,
  LABEL_CATEGORY,
  LABEL_DESCRIPTION,
  LABEL_MAIN_NAV,
  LABEL_PAYMENT_METHOD,
  LABEL_PREVIOUS_MONTH,
  LABEL_PURCHASES,
  LABEL_SAVE,
  MSG_SESSION_EXPIRED,
} from './support/texts';

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

// DT-003 (feature 003): a renovação de token da 001 com uma tela que chama rota protegida (`/lancamentos`).
const NOW = new Date('2026-10-22T12:00:00-03:00');
const OCTOBER = '/lancamentos?ano=2026&mes=10';
const B_TOKEN = CONTRACT.tokens.body.access_token;

const seed = (id: number, description: string, date = '2026-10-05'): PurchaseSeed => ({
  id,
  date,
  description,
  amount: '10.00',
  status: 'PAID',
  categoryId: 1,
  paymentMethodId: 4,
});

const refreshed = {
  status: 200,
  body: { access_token: 'A2', refresh_token: 'R2', token_type: 'Bearer' },
};
const refreshExpired = {
  status: 401,
  body: { code: 'UNAUTHORIZED', message: 'invalid credentials' },
};

const rows = (page: Page) => page.getByRole('row').filter({ has: page.getByRole('cell') });
const discardDialog = (page: Page) => page.getByRole('alertdialog', { name: DISCARD_DIALOG_TITLE });
const field = (page: Page, name: string) => page.getByRole('textbox', { name, exact: true });

async function login(page: Page) {
  await page.getByLabel('E-mail').fill('ana@exemplo.com');
  await page.getByLabel('Senha', { exact: true }).fill('senha123');
  await page.getByRole('button', { name: 'Entrar' }).click();
}

async function fillForm(page: Page) {
  await field(page, LABEL_DESCRIPTION).fill('Mercado');
  await field(page, LABEL_AMOUNT).fill('10,00');
  await page.getByRole('combobox', { name: LABEL_CATEGORY }).click();
  await page.getByRole('option', { name: 'Alimentação' }).click();
  await page.getByRole('combobox', { name: LABEL_PAYMENT_METHOD }).click();
  await page.getByRole('option', { name: 'Pix' }).click();
}

test.describe('session com lançamentos', () => {
  test.use({ timezoneId: 'America/Sao_Paulo', locale: 'pt-BR' });

  test('CA-10 da 001: renovação transparente', async ({ page }) => {
    await page.clock.setFixedTime(NOW);
    const api = await mockApi(page, { refresh: refreshed });
    await mockPurchasesApi(page, {
      expiredTokens: ['A1'],
      users: { A2: { purchases: [seed(1, 'Mercado')] } },
    });
    await seedSession(page);
    await page.goto('/lancamentos');

    await expect(rows(page)).toHaveCount(1);
    expect(api.calls.refresh).toBe(1);
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(JSON.parse((await readSession(page)) ?? 'null')).toEqual({
      access_token: 'A2',
      refresh_token: 'R2',
    });
  });

  test('CA-11 da 001: duas abas com o token vencido', async ({ context, page }) => {
    await context.clock.setFixedTime(NOW);
    let firstWithR1 = true;
    const api = await mockApi(context, {
      refresh: (request: Request) => {
        const body = request.postDataJSON() as { refresh_token?: string };
        if (body.refresh_token === 'R1' && firstWithR1) {
          firstWithR1 = false;
          return refreshed;
        }
        return refreshExpired;
      },
    });
    await mockPurchasesApi(context, {
      expiredTokens: ['A1'],
      users: { A2: { purchases: [seed(1, 'Mercado')] } },
    });
    await seedSession(page);
    const other = await context.newPage();

    await Promise.all([page.goto('/lancamentos'), other.goto('/lancamentos')]);

    await expect(rows(page)).toHaveCount(1);
    await expect(rows(other)).toHaveCount(1);
    expect(api.calls.refresh).toBe(1);
    await expect(page).toHaveURL(OCTOBER);
    await expect(other).toHaveURL(OCTOBER);
  });

  test('CA-12 da 001: refresh expirado', async ({ page }) => {
    await page.clock.setFixedTime(NOW);
    await mockApi(page, { refresh: refreshExpired, login: CONTRACT.tokens });
    await mockPurchasesApi(page, {
      expiredTokens: ['A1'],
      users: { [B_TOKEN]: { purchases: [seed(1, 'Mercado')] } },
    });
    await seedSession(page);
    await page.goto('/lancamentos');

    await expect(page).toHaveURL('/login?returnUrl=%2Flancamentos%3Fano%3D2026%26mes%3D10');
    await expect(page.getByText(MSG_SESSION_EXPIRED)).toBeVisible();
    await login(page);
    await expect(page).toHaveURL(OCTOBER);
    await expect(rows(page)).toHaveCount(1);
  });

  test('CA-34 troca de usuário', async ({ page }) => {
    await page.clock.setFixedTime(NOW);
    await mockApi(page, { logout: CONTRACT.loggedOut, login: CONTRACT.tokens });
    const mock = await mockPurchasesApi(page, {
      users: {
        A1: { purchases: [seed(1, 'Mercado de A'), seed(2, 'Mercado de A', '2026-09-05')] },
        [B_TOKEN]: { purchases: [seed(3, 'Padaria de B')] },
      },
    });
    await seedSession(page);
    await page.goto(OCTOBER);
    await expect(page.getByText('Mercado de A')).toBeVisible();

    mock.options.delayMs = { list: 1500 };
    await page.getByRole('button', { name: LABEL_PREVIOUS_MONTH }).click();
    await logout(page);
    await expect(page).toHaveURL('/login');
    await page.evaluate(() => {
      const w = window as unknown as { __sawA: boolean };
      w.__sawA = false;
      new MutationObserver(() => {
        if (document.body.textContent?.includes('de A')) {
          w.__sawA = true;
        }
      }).observe(document.body, { childList: true, subtree: true, characterData: true });
    });

    const afterLogin = mock.requests.length;
    await login(page);
    await page
      .getByRole('navigation', { name: LABEL_MAIN_NAV })
      .getByRole('link', { name: LABEL_PURCHASES })
      .click();
    await expect(page.getByText('Padaria de B')).toBeVisible();
    await page.waitForTimeout(2_000);

    expect(await page.evaluate(() => (window as unknown as { __sawA: boolean }).__sawA)).toBe(
      false,
    );
    const late = mock.requests.slice(afterLogin).filter((r) => r.authorization === 'Bearer A1');
    expect(late).toHaveLength(0);
  });

  test('CA-36 sessão expira com o formulário alterado', async ({ page }) => {
    await page.clock.setFixedTime(NOW);
    await mockApi(page, { refresh: refreshExpired });
    const mock = await mockPurchasesApi(page);
    await seedSession(page);
    await page.goto('/lancamentos/novo');
    await fillForm(page);

    mock.options.expiredTokens = ['A1'];
    await page.getByRole('button', { name: LABEL_SAVE, exact: true }).click();

    await expect(page).toHaveURL('/login?returnUrl=%2Flancamentos%2Fnovo');
    await expect(page.getByText(MSG_SESSION_EXPIRED)).toBeVisible();
    await expect(discardDialog(page)).toHaveCount(0);
  });

  test('Sair com o formulário alterado', async ({ page }) => {
    await page.clock.setFixedTime(NOW);
    await mockApi(page, { logout: CONTRACT.loggedOut });
    await mockPurchasesApi(page);
    await seedSession(page);
    await page.goto('/lancamentos/novo');
    await field(page, LABEL_DESCRIPTION).fill('Mercado');

    await logout(page);

    await expect(page).toHaveURL('/login');
    await expect(discardDialog(page)).toHaveCount(0);
  });

  test('logout em outra aba', async ({ context, page }) => {
    await context.clock.setFixedTime(NOW);
    await mockApi(context, { logout: CONTRACT.loggedOut });
    await mockPurchasesApi(context);
    await seedSession(page);
    await page.goto('/lancamentos/novo');
    await field(page, LABEL_DESCRIPTION).fill('Mercado');
    const other = await context.newPage();
    await other.goto('/');
    await expect(other.getByRole('heading', { name: HOME_TITLE })).toBeVisible();

    await logout(other);

    await expect(page).toHaveURL('/login', { timeout: 5_000 });
    await expect(discardDialog(page)).toHaveCount(0);
  });
});
