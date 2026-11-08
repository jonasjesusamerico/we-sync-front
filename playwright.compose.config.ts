import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke test against the real stack: `docker compose up --build -d` in ../we-sync-api (default URL),
 * or a deployed environment with BASE_URL (e.g. homolog in CI).
 */
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.compose.spec.ts',
  retries: 0,
  reporter: [['list']],
  use: { baseURL: process.env['BASE_URL'] ?? 'http://localhost:3000', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
