import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Solaris CET E2E tests.
 * Tests hit the Vite preview of the production build (`npm run preview`).
 * `serviceWorkers: 'block'` avoids the PWA serving a stale precached bundle (selectors/copy drift).
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in parallel */
  fullyParallel: true,
  /* Fail the build on CI if a test is accidentally focused with `.only` */
  forbidOnly: !!process.env.CI,
  /* Retry on CI to reduce flakiness */
  retries: process.env.CI ? 2 : 0,
  /**
   * Default 1 worker: all tests share one Vite preview on :4173; higher parallelism often
   * yields `net::ERR_CONNECTION_REFUSED` locally. Override with `PW_WORKERS=4 npm run test:e2e`.
   */
  workers: (() => {
    const raw = process.env.PW_WORKERS;
    if (raw === undefined || raw === '') return 1;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 1 ? n : 1;
  })(),
  /* Reporter */
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    /* Base URL pointing at the Vite preview server */
    baseURL: 'http://localhost:4173',
    /* PWA service worker would otherwise serve stale bundles without new selectors */
    serviceWorkers: 'block',
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
    /* Preview only — run `npm run build` (or `npm run verify`) first so `dist/` exists. A second build
       here after `verify:full` was redundant and could fail with ENOTEMPTY on `dist/vendor/onnxruntime`. */
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    /* Local: allow reusing `npm run preview` if already running (run `npm run build` after UI changes). */
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 120_000 : 180_000,
  },
});
