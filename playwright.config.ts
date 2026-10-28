import { defineConfig, devices } from '@playwright/test';

/** e2e com a API simulada por `page.route` (a API não precisa estar de pé). */
export default defineConfig({
  testDir: 'e2e',
  testIgnore: '**/*.compose.spec.ts',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
