import { expect,test } from '@playwright/test';

import { waitForAppReady } from './e2e-helpers';

/**
 * OMEGA sovereign HTML — zero client JS, self-hosted font, supply invariant.
 * Dist includes /sovereign/ via prebuild sync (see scripts/sync-sovereign-to-public.mjs).
 */
test.describe('OMEGA sovereign static surface', () => {
  test('serves /sovereign/ with supply anchor and no script tags', async ({ page }) => {
    await page.goto('/sovereign/');
    await expect(page).toHaveTitle(/Sovereign static node/i);
    await expect(page.getByRole('heading', { name: /Sovereign static node/i })).toBeVisible();
    await expect(page.getByText(/9,000/)).toBeVisible();
    await expect(page.locator('strong').filter({ hasText: /Cetățuia, Romania/i })).toBeVisible();
    const scripts = await page.locator('script').count();
    expect(scripts).toBe(0);
  });

  test('self-hosted JetBrains Mono woff2 is reachable', async ({ page }) => {
    const res = await page.request.get('/sovereign/fonts/jetbrains-mono-400.woff2');
    expect(res.status(), `expected 200 for vendored woff2 under static/sovereign/fonts/`).toBe(200);
    const body = await res.body();
    // Real latin-400 woff2 ~21 KiB; catches 404 HTML or empty responses mis-served as 200.
    expect(body.byteLength, 'JetBrains Mono woff2 must be present in repo + dist').toBeGreaterThan(10_000);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct.includes('woff2') || ct.includes('octet-stream') || ct.includes('font')).toBeTruthy();
  });

  test('main site footer navigates to sovereign surface', async ({ page }) => {
    // ?lang=en matches useLanguage E2E pattern so `landmarks.footer` aria-label matches the App wrapper.
    await page.goto('/?lang=en');
    await waitForAppReady(page, { timeout: 5000 });
    // Match conversion-ui: scroll to document bottom so LazyLoadWrapper + ScrollFadeUp mount and fade in
    // (scrollIntoViewIfNeeded on the section alone can leave the lazy footer unmounted in some layouts).
    await page.evaluate(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
    });
    // Stable across locales (copy lives in i18n `footerNav.sovereignNoJs`).
    const link = page.getByTestId('footer-sovereign-link');
    await link.waitFor({ state: 'visible', timeout: 25_000 });
    await link.click();
    await expect(page).toHaveURL(/\/sovereign\/?$/);
    await expect(page.getByRole('heading', { name: /Sovereign static node/i })).toBeVisible();
  });
});
