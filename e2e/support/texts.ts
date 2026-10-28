// Textos da interface usados nos e2e. Os de campo e de auth vêm das mesmas constantes do app; os de RN-15 são
// repetidos aqui porque `error-messages.ts` depende do runtime do Angular.
export * from '../../src/app/features/auth/auth.messages';
export * from '../../src/app/layout/layout.messages';
export * from '../../src/app/shared/validators/validation-messages';

export const MSG_CONNECTION =
  'Não foi possível conectar. Verifique sua internet e tente novamente.';
export const HOME_TITLE = 'Bem-vindo ao we-sync';
