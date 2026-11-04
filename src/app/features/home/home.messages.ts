// Texts of the home page (feature 004). No Angular imports: the e2e re-exports this file.
export const TITLE_HOME = 'Início · we-sync';
export const greeting = (name: string): string => `Olá, ${name}`;
export const GREETING_FALLBACK = 'Olá!';
export const HOME_SUBTITLE = 'Veja como está o seu mês.';

// Spending card (feature 005, RF-06, RF-07).
export { LABEL_NEW_PURCHASE } from '../../layout/shell/shell.messages';
/** "Gasto em novembro". */
export const spentIn = (month: string): string => `Gasto em ${month}`;
export const LABEL_SEE_PURCHASES = 'Ver compras';
/** "Nenhuma compra em novembro." */
export const noPurchasesIn = (month: string): string => `Nenhuma compra em ${month}.`;

// Comparison seal (RN-02, RN-03). `suffix` is " até o dia N" or "".
export const sealMore = (percent: number, previous: string, suffix: string): string =>
  `${percent}% a mais que ${previous}${suffix}`;
export const sealLess = (percent: number, previous: string, suffix: string): string =>
  `${percent}% a menos que ${previous}${suffix}`;
export const sealEqual = (previous: string, suffix: string): string =>
  `Igual a ${previous}${suffix}`;
export const sealNoBase = (previous: string, suffix: string): string =>
  `Sem compras em ${previous}${suffix} para comparar.`;
