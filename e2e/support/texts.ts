// The e2e uses the same text constants as the app.
export * from '../../src/app/features/auth/auth.messages';
export * from '../../src/app/layout/shell/shell.messages';
export * from '../../src/app/features/home/home.messages';
export * from '../../src/app/shared/ui/ui.messages';
export * from '../../src/app/features/purchases/purchases.messages';
export * from '../../src/app/core/navigation/navigation.messages';
// Feature 006. The settings texts share names with the auth ones (LABEL_NAME, …): they come as a namespace.
export * as settings from '../../src/app/features/settings/settings.messages';
export * from '../../src/app/core/theme/theme.messages';
export * from '../../src/app/core/catalog/catalog.messages';
