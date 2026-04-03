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
   * CI: 1 worker (stable with one preview). Local: Playwright default parallelism unless `PW_WORKERS`
   * is set — use e.g. `PW_WORKERS=1 npm run test:e2e` if you see `ERR_CONNECTION_REFUSED` on :4173.
   */
  workers: (() => {
    if (process.env.CI) return 1;
    const raw = process.env.PW_WORKERS;
    if (raw === undefined || raw === '') return undefined;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 1 ? n : 1;
  })(),
  /* Reporter */
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    /* Base URL pointing at the Vite preview server */
    baseURL: 'http://127.0.0.1:4173',
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
       here after `verify:full` was redundant and could fail with ENOTEMPTY on `dist/vendor/onnxruntime`.
       `preview:e2e` binds 127.0.0.1 and raises Node heap to reduce mid-suite OOMs that surface as
       :4173 ERR_CONNECTION_REFUSED. */
    command: 'npm run preview:e2e',
    url: 'http://127.0.0.1:4173',
    /* Local: allow reusing `npm run preview` if already running (run `npm run build` after UI changes). */
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 120_000 : 180_000,
  },
});
