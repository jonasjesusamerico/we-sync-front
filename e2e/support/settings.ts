// Settings data and helpers of the e2e tests (feature 006).
import { expect, type Page } from '@playwright/test';
import type { ApiMock, MockUser } from './api-mock';
import { seedSession } from './session';

export const SETTINGS_URL = '/configuracoes/conta';

/** The user of the prototype (configuracoes.html). */
export const JONAS: MockUser = {
  id: 7,
  name: 'Jonas',
  email: 'jonas@exemplo.com',
  password: 'Senha123!',
};

/**
 * OWN_CATEGORIES and OWN_PAYMENT_METHODS of prototype/assets/app.js: Pets, Assinaturas, Academia (archived);
 * Vale-refeição, Cartão da empresa, Cartão antigo (archived). Returns the ids by name.
 */
export function seedCatalog(api: ApiMock, email: string): Record<string, number> {
  return {
    Pets: api.addCategory(email, 'Pets', { icon: 'HEART', color: 'LEISURE' }),
    Assinaturas: api.addCategory(email, 'Assinaturas', { icon: 'CARD', color: 'HOME' }),
    Academia: api.addCategory(email, 'Academia', {
      icon: 'HEART',
      color: 'HEALTH',
      archived: true,
    }),
    'Vale-refeição': api.addPaymentMethod(email, 'Vale-refeição'),
    'Cartão da empresa': api.addPaymentMethod(email, 'Cartão da empresa'),
    'Cartão antigo': api.addPaymentMethod(email, 'Cartão antigo', { archived: true }),
  };
}

/** Adds the user, writes a session and opens the address (Conta by default), waiting for the page header. */
export async function openSettings(
  page: Page,
  api: ApiMock,
  user: MockUser,
  url = SETTINGS_URL,
): Promise<void> {
  if (!api.userOf(user.email)) {
    api.addUser(user);
  }
  await seedSession(page, api.issueSession(user.email));
  await page.goto(url);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Configurações');
}

/** The open <dialog> (form dialog or confirmation). */
export const openDialog = (page: Page) => page.locator('dialog[open]');
