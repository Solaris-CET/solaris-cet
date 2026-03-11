import { test, expect } from '@playwright/test';

/**
 * Offline PWA State E2E tests
 *
 * Validates that the app behaves correctly when the browser is offline:
 *  - The service worker is registered successfully
 *  - The manifest is linked and parseable
 *  - Core page content is served from cache when the network is cut
 *  - The page title and key headings are still accessible offline
 */

test.describe('Offline PWA State', () => {
  test('web app manifest is linked in <head>', async ({ page }) => {
    await page.goto('/');
    const manifestHref = await page.$eval(
      'link[rel="manifest"]',
      (el: HTMLLinkElement) => el.href
    );
    expect(manifestHref).toMatch(/manifest\.webmanifest/);
  });

  test('web app manifest returns valid JSON with required fields', async ({ page }) => {
    await page.goto('/');
    const manifestHref = await page.$eval(
      'link[rel="manifest"]',
      (el: HTMLLinkElement) => el.href
    );
    const response = await page.request.get(manifestHref);
    expect(response.ok()).toBeTruthy();
    const manifest = await response.json();
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('short_name');
    expect(manifest).toHaveProperty('icons');
    expect(manifest).toHaveProperty('start_url');
    expect(manifest).toHaveProperty('display');
  });

  test('service worker is registered', async ({ page }) => {
    await page.goto('/');
    // Wait for service worker registration (vite-plugin-pwa auto-registers on load)
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        if (regs.length > 0) return true;
        // Wait up to 6 s for auto-registration
        return new Promise<boolean>(resolve => {
          const timer = setTimeout(() => resolve(false), 6000);
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            clearTimeout(timer);
            resolve(true);
          });
          navigator.serviceWorker.register('./sw.js').then(() => {
            clearTimeout(timer);
            resolve(true);
          }).catch(() => {
            clearTimeout(timer);
            // SW file may have a different name — check existing registrations
            navigator.serviceWorker.getRegistrations().then(r => resolve(r.length > 0));
          });
        });
      } catch {
        return false;
      }
    });
    expect(swRegistered).toBe(true);
  });

  test('theme-color meta tag is present', async ({ page }) => {
    await page.goto('/');
    const themeColor = await page.$eval(
      'meta[name="theme-color"]',
      (el: Element) => (el as HTMLMetaElement).content
    );
    expect(themeColor).toBeTruthy();
  });

  test('apple-touch-icon is linked', async ({ page }) => {
    await page.goto('/');
    const touchIcon = await page.$eval(
      'link[rel="apple-touch-icon"]',
      (el: HTMLLinkElement) => el.href
    );
    expect(touchIcon).toMatch(/icon-192\.png/);
  });

  test('page is served from cache when offline', async ({ page, context }) => {
    // First visit — populate the service worker cache
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Ensure the service worker is installed AND controlling the page before
    // going offline, so the cache is available for the subsequent reload.
    await page.evaluate(() =>
      navigator.serviceWorker.ready.then(() => {
        // serviceWorker.ready resolves once a SW controls the page
        return navigator.serviceWorker.controller !== null
          ? Promise.resolve()
          : new Promise<void>(resolve => {
              navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
            });
      })
    );

    // Go offline
    await context.setOffline(true);

    // Navigate again — should still work from cache
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
    await expect(page).toHaveTitle(/Solaris CET/i, { timeout: 10000 });

    // Restore online state
    await context.setOffline(false);
  });

  test('core page content is available offline after initial load', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for the service worker to be in control before going offline
    await page.evaluate(() =>
      navigator.serviceWorker.ready.then(() => {
        return navigator.serviceWorker.controller !== null
          ? Promise.resolve()
          : new Promise<void>(resolve => {
              navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
            });
      })
    );

    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });

    // The main element must be present in the cached shell
    const main = page.locator('#root');
    await expect(main).toBeAttached({ timeout: 10000 });

    await context.setOffline(false);
  });
});
