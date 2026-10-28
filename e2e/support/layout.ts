import { Page } from '@playwright/test';

import { LABEL_ACCOUNT, LABEL_LOGOUT } from './texts';

/** Sair pelo menu de conta (RF-05 da 002). */
export async function logout(page: Page): Promise<void> {
  await page.getByRole('button', { name: LABEL_ACCOUNT }).click();
  await page.getByRole('menuitem', { name: LABEL_LOGOUT }).click();
}

/** Aba do layout de acesso (`Entrar` / `Criar conta`). */
export const tab = (page: Page, name: string) => page.getByRole('tab', { name });

/** Quanto o `<html>` passa da largura da janela (≤ 0: sem rolagem horizontal). */
export function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}
