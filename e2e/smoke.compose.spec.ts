// Smoke tests against the real stack (front on :3000, API on :8080). Run with `npm run e2e:compose`.
// 004: CA-36 and CA-02. 005: purchases with the real `total_amount`, the accent-insensitive search (CA-12) and the
// month summary (contract of feature 005). 006: profile, own category archived and its effect on Nova compra,
// account deletion and a new register with the same e-mail (CA-12). 007: the month blocks from GET /purchases/overview
// (CA-18) and a second user who sees only the card (CA-20 on the front).
import { expect, test, type Page } from '@playwright/test';

const HOME_URL = /\/inicio\?ano=\d{1,4}&mes=\d{1,2}$/;
const PURCHASES_URL = /\/compras\?ano=\d{1,4}&mes=\d{1,2}$/;

function watchProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(message.text());
    }
  });
  page.on('pageerror', (error) => problems.push(error.message));
  return problems;
}

async function register(page: Page, email = `smoke+${Date.now()}@exemplo.com`) {
  await page.goto('/cadastro');
  await page.locator('#name').fill('Ana Souza');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill('Senha123!');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page).toHaveURL(HOME_URL);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Olá, Ana Souza');
  return email;
}

async function logout(page: Page) {
  await page.getByRole('button', { name: /Menu da conta/ }).click();
  await page.getByRole('menuitem', { name: 'Sair' }).click();
  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Que bom te ver de novo');
}

function expectNotBlocked(problems: string[]) {
  const blocked = problems.filter((text) => /Content Security Policy|CORS|Refused to/i.test(text));
  expect(blocked).toEqual([]);
}

test('cadastro, Início com o nome e sair na stack real', async ({ page }) => {
  const problems = watchProblems(page);
  await register(page);
  await logout(page);
  expectNotBlocked(problems);
});

test('compra: criar, ver no Início e em Compras, buscar sem acento e excluir', async ({ page }) => {
  const problems = watchProblems(page);
  await register(page);
  await expect(page.locator('#kpi-total')).toHaveText('R$ 0,00');

  await page.locator('#ws-topbar').getByRole('link', { name: 'Nova compra' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nova compra');
  await page.locator('#amount').fill('1234,56');
  await page.locator('#description').fill('Padária São João');
  await page.locator('#categories label', { hasText: 'Alimentação' }).click();
  await page.getByRole('button', { name: 'Salvar compra', exact: true }).click();

  // Back to the home page: the summary comes from GET /purchases/summary.
  await expect(page).toHaveURL(HOME_URL);
  await expect(page.locator('.ws-toast')).toContainText('Compra salva com sucesso');
  await expect(page.locator('#kpi-total')).toHaveText('R$ 1.234,56');
  await expect(page.locator('.ws-hero-chip')).toBeVisible();
  // 007 (CA-18): the blocks come from GET /purchases/overview (the form saves as Paga by default).
  await expect(page.locator('#kpi-paid')).toHaveText('R$ 1.234,56');
  await expect(page.locator('#kpi-count')).toHaveText('1');
  await expect(page.locator('#daily-bars .ws-bar:not(.is-empty)')).toHaveCount(1);

  // 007 (CA-20 on the front): another user, same month, sees only the card.
  const context = await page.context().browser()!.newContext();
  const other = await context.newPage();
  await register(other);
  await expect(other.locator('#kpi-total')).toHaveText('R$ 0,00');
  await expect(other.locator('#kpi-cards')).toHaveCount(0);
  await context.close();

  // Compras: the summary comes from total_amount.
  await page.locator('#ws-sidebar').getByRole('link', { name: 'Compras' }).click();
  await expect(page).toHaveURL(PURCHASES_URL);
  await expect(page.locator('#summary')).toHaveText('1 compra · R$ 1.234,56 no total');
  await expect(page.locator('#rows tr td:first-child a')).toHaveText(['Padária São João']);

  // CA-12 for real: unaccent in PostgreSQL.
  await page.locator('#f-search').fill('padaria');
  await expect(page).toHaveURL(/busca=padaria/);
  await expect(page.locator('#rows tr td:first-child a')).toHaveText(['Padária São João']);
  await page.locator('#f-search').fill('SAO');
  await expect(page).toHaveURL(/busca=SAO/);
  await expect(page.locator('#rows tr td:first-child a')).toHaveText(['Padária São João']);

  await page.getByRole('button', { name: 'Excluir Padária São João' }).click();
  await page
    .locator('dialog.ws-dialog')
    .getByRole('button', { name: 'Excluir', exact: true })
    .click();
  await expect(page.locator('.ws-toast')).toContainText('Compra excluída');
  await expect(page.locator('.ws-empty')).toContainText('Nenhuma compra encontrada');

  await logout(page);
  expectNotBlocked(problems);
});

test('conta e cadastros (006): nome, categoria arquivada, excluir e cadastrar de novo', async ({
  page,
}) => {
  const problems = watchProblems(page);
  const email = await register(page);

  await page.goto('/configuracoes/conta');
  await page.locator('#acc-name').fill('Ana Lima');
  await page.getByRole('button', { name: 'Salvar perfil' }).click();
  await expect(page.locator('.ws-toast')).toContainText('Perfil atualizado');
  await expect(page.locator('#ws-user-btn .ws-avatar')).toHaveText('AL');

  const name = `Smoke ${Date.now() % 100000}`;
  await page.goto('/configuracoes/categorias');
  await page.locator('#cat-name').fill(name);
  await page.locator('label[for=ci-HEART]').click();
  await page.getByRole('button', { name: 'Adicionar categoria' }).click();
  await expect(page.locator('.ws-toast')).toContainText('Categoria adicionada');
  await page.goto('/compras/nova');
  await expect(page.locator('#categories')).toContainText(name);

  await page.goto('/configuracoes/categorias');
  await page.getByRole('button', { name: `Arquivar ${name}` }).click();
  await page.locator('dialog[open]').getByRole('button', { name: 'Arquivar', exact: true }).click();
  await expect(page.locator('.ws-toast')).toContainText('Categoria arquivada');
  await page.goto('/compras/nova');
  await expect(page.locator('#categories input').first()).toBeAttached();
  await expect(page.locator('#categories')).not.toContainText(name);

  await page.goto('/configuracoes/conta');
  await page.getByRole('button', { name: 'Excluir minha conta' }).click();
  await page.locator('#delete-pass').fill('Senha123!');
  await page.locator('dialog[open]').getByRole('button', { name: 'Excluir conta' }).click();
  await expect(page).toHaveURL('/login');
  await expect(page.locator('.alert')).toHaveText('Sua conta foi excluída.');

  await register(page, email);
  await page.goto('/configuracoes/categorias');
  await expect(page.locator('li.ws-tx').first()).toBeVisible();
  await expect(page.locator('.ws-tag.is-primary')).toHaveCount(0);
  expectNotBlocked(problems);
});
