import { test, expect, url, expectNoOverflow, modalOpen } from './helpers.mjs';

// Nossa casa: settlement, dreams, emergency reserve, undo and the monthly meeting.
test.beforeEach(async ({ page }) => {
  await page.goto(url('casa.html?semtour=1'));
});

test('acerto de outubro inclui o ajuste de setembro (ACE-09)', async ({ page }) => {
  await expect(page.locator('#settle-sub')).toContainText('Ajuste de setembro');
  await expect(page.locator('#settle-result')).toContainText('Amanda deposita R$ 571,77');
});

test('sonho: plano pela renda, guardar provisório e confirmar (SON-02, SON-06)', async ({ page }) => {
  const chile = page.locator('.ws-dream', { hasText: 'Viagem para o Chile' });
  await expect(chile).toContainText('Guardar por mês: R$ 843,00');
  await expect(chile).toContainText('Jonas R$ 531,00 · Amanda R$ 313,00');
  await expect(chile).toContainText('No ritmo');
  await chile.locator('[data-act="dream-save"]').click();
  await modalOpen(page, 'save-modal');
  await page.locator('#save-form button[type=submit]').click();
  await expect(page.locator('#pending')).toContainText('Jonas guardou R$ 531,00 no sonho Viagem para o Chile?');
  await page.locator('[data-act="dream-ok"]').click();
  await expect(chile).toContainText('R$ 4.331,00 de R$ 12.000,00');
});

test('resgate do sonho abate do acerto e sai do padrão (SON-10)', async ({ page }) => {
  await expect(page.locator('#std-result')).toContainText('passou');
  await page.locator('.ws-dream', { hasText: 'Viagem para o Chile' }).locator('[data-act="dream-rescue"]').click();
  await modalOpen(page, 'dream-rescue-modal');
  await page.fill('#dr-rescue-value', '150000');
  await page.locator('#dream-rescue-form button[type=submit]').click();
  await page.locator('[data-act="dream-rescue-ok"]').click();
  await expect(page.locator('#settle-sub')).toContainText('− resgate do sonho R$ 1.500,00');
  await expect(page.locator('#std-result')).toContainText('dentro do padrão');
});

test('novo sonho valida os campos e entra na lista', async ({ page }) => {
  await page.locator('#new-dream').click();
  await modalOpen(page, 'dream-modal');
  await page.locator('#dream-form button[type=submit]').click();
  await expect(page.locator('#dream-form .is-invalid')).toHaveCount(3);
  await page.fill('#dr-name', 'Casamento');
  await page.fill('#dr-target', '3000000');
  await page.fill('#dr-bank', 'Nubank');
  await page.locator('#dream-form button[type=submit]').click();
  await expect(page.locator('#dreams')).toContainText('Casamento');
});

test('reserva: alvo pelos meses mais caros, explicado, e uso só com motivo (RSV)', async ({ page }) => {
  const reserve = page.locator('.ws-reserve');
  await expect(reserve).toContainText('R$ 9.000,00 de R$ 15.830,00');
  await expect(reserve).toContainText('cobre 3,4 meses');
  await reserve.locator('summary').click();
  await expect(reserve).toContainText('ago (repetido) R$ 2.750,00 = R$ 15.830,00');
  await reserve.locator('[data-act="dream-rescue"]').click();
  await modalOpen(page, 'dream-rescue-modal');
  await page.fill('#dr-rescue-value', '50000');
  await page.locator('#dream-rescue-form button[type=submit]').click();
  await expect(page.locator('#dr-rescue-note')).toHaveClass(/is-invalid/);
  await page.fill('#dr-rescue-note', 'Conserto do carro');
  await page.locator('#dream-rescue-form button[type=submit]').click();
  await expect(page.locator('#pending')).toContainText('resgatou R$ 500,00 da reserva de emergência?');
});

test('desfazer movimentação confirmada; desfazer o depósito reabre o acerto (CX-07)', async ({ page }) => {
  await page.locator('[data-act="deposit"]').click();
  await page.locator('[data-act="deposit-ok"]').click();
  await expect(page.locator('#settle-status')).toHaveText('Acertado');
  await page.locator('[data-act="mv-undo"][data-mv="d"]').click();
  await modalOpen(page, 'undo-modal');
  await expect(page.locator('#undo-text')).toContainText('volta a ficar em aberto');
  await page.locator('#undo-ok').click();
  await expect(page.locator('#settle-status')).toHaveText('Em aberto');
  await expect(page.locator('#movements')).toContainText('mês travado');
});

test('aviso de confirmação diz que se repete (CX-05)', async ({ page }) => {
  await page.locator('[data-act="deposit"]').click();
  await expect(page.locator('#pending')).toContainText('se repete a cada 3 dias');
});

test('mês fechado abre o Encontro; fechar mostra o resumo; voltar ao mês reabre no passo 1 (ENC)', async ({ page }) => {
  await page.locator('#month-prev').click();
  await expect(page.locator('#meet-view')).toBeVisible();
  for (let i = 0; i < 3; i++) await page.locator('#meet-next').click();
  await expect(page.locator('#meet-body')).toContainText('ajuste de setembro');
  await expectNoOverflow(page);
  await page.locator('#meet-close').click();
  await expect(page.locator('#closed-view')).toBeVisible();
  await page.locator('#month-next').click();
  await expect(page.locator('#month-view')).toBeVisible();
  await page.locator('#month-prev').click();
  await expect(page.locator('#meet-steps [aria-current="step"]')).toContainText('Como foi');
});
