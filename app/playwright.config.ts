import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Solaris CET E2E tests.
 * Tests are run against the production preview server (`npm run preview`).
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in parallel */
  fullyParallel: true,
  /* Fail the build on CI if a test is accidentally focused with `.only` */
  forbidOnly: !!process.env.CI,
  /* Retry on CI to reduce flakiness */
  retries: process.env.CI ? 2 : 0,
  /* Parallel workers: 1 on CI to avoid resource contention */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter */
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    /* Base URL pointing at the Vite preview server */
    baseURL: 'http://localhost:4173',
    /* Capture screenshots/trace on first retry only */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  /* Start the Vite preview server before running tests.
     --strictPort ensures the command fails immediately if 4173 is taken,
     so baseURL/webServer.url never silently point at the wrong port. */
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
