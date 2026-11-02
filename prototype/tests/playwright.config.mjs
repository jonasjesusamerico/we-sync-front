import { defineConfig } from '@playwright/test';

/**
 * Behavior tests of the clickable prototype (opened from the file system, no server).
 * Run from we-sync-front: npx playwright test -c prototype/tests
 */
export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.mjs',
  fullyParallel: true,
  reporter: [['list']],
  outputDir: '../../test-results/prototype',
  use: { trace: 'retain-on-failure' },
  projects: [
    { name: 'computador-claro', use: { viewport: { width: 1366, height: 900 }, colorScheme: 'light' } },
    { name: 'computador-escuro', use: { viewport: { width: 1366, height: 900 }, colorScheme: 'dark' } },
    { name: 'celular-claro', use: { viewport: { width: 390, height: 844 }, colorScheme: 'light' } },
    { name: 'celular-escuro', use: { viewport: { width: 390, height: 844 }, colorScheme: 'dark' } },
  ],
});
