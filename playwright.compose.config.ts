import { defineConfig, devices } from '@playwright/test';

/**
 * Fumaça contra a stack real do compose do `we-sync-api` (`docker compose up --build -d`): front em `:3000`,
 * API em `:8080`. Sem `webServer` e sem `page.route`.
 */
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.compose.spec.ts',
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
