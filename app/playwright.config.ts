import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Solaris CET E2E tests.
 * Tests hit the production build via `npm run preview:e2e` (127.0.0.1:4173, raised Node heap).
 * `serviceWorkers: 'block'` avoids the PWA serving a stale precached bundle (selectors/copy drift).
 */
export default defineConfig({
  testDir: './tests',
  /* Prevent hangs on CI */
  globalTimeout: process.env.CI ? 45 * 60 * 1000 : undefined,
  timeout: process.env.CI ? 60_000 : 30_000,
  /* Run tests in parallel */
  fullyParallel: true,
  /* Fail the build on CI if a test is accidentally focused with `.only` */
  forbidOnly: !!process.env.CI,
  /* Retry on CI to reduce flakiness */
  retries: process.env.CI ? 2 : 0,
  /**
   * Workers: optional `PW_WORKERS` (integer ≥ 1). CI defaults to 1 (one preview on :4173); set repo
   * variable `E2E_WORKERS` in GitHub Actions to override. Local default is Playwright parallelism;
   * use `PW_WORKERS=1` (see `test:e2e:stable`) if you see `ERR_CONNECTION_REFUSED` on :4173.
   */
  workers: (() => {
    const raw = process.env.PW_WORKERS;
    const parsed =
      raw === undefined || raw === ''
        ? undefined
        : (() => {
            const n = Number.parseInt(raw, 10);
            return Number.isFinite(n) && n >= 1 ? n : undefined;
          })();
    if (process.env.CI) {
      return parsed ?? 1;
    }
    return parsed;
  })(),
  /* Reporter */
  reporter: process.env.CI ? [['line'], ['github'], ['html', { open: 'never' }]] : 'list',
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
      use: {
        ...devices['Desktop Chrome'],
        /* Small /dev/shm (Docker, some CI sandboxes) can crash Chromium mid-suite → preview looks “dead” (:4173 ECONNREFUSED). */
        launchOptions: {
          args: ['--disable-dev-shm-usage'],
        },
      },
    },
  ],
  /* Start the Vite preview server before running tests.
     --strictPort ensures the command fails immediately if 4173 is taken,
     so baseURL/webServer.url never silently point at the wrong port. */
  webServer: {
    /* Preview only — run `npm run build` (or `npm run verify`) first so `dist/` exists. A second build
       here after the monorepo gate (`npm run verify:all`) was redundant and could fail with ENOTEMPTY on `dist/vendor/onnxruntime`.
       `preview:e2e` binds 127.0.0.1 and raises Node heap to reduce mid-suite OOMs that surface as
       :4173 ERR_CONNECTION_REFUSED. */
    command: 'npm run preview:e2e',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 120_000 : 180_000,
  },
});
