import { defineConfig, devices } from '@playwright/test';

/**
 * Side-by-side captures of the app and the prototype (feature 005, D-17). Run with `npm run e2e:capture`; needs
 * ../we-sync-requirements next to this repository. The comparison is visual: the spec has no assertion on pixels.
 */
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.capture.spec.ts',
  retries: 0,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4200' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
