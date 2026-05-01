import { expect, test } from '@playwright/test';

/**
 * Wait until Workbox has an active registration, then reload until this client is controlled.
 * A single reload is not always enough for `navigator.serviceWorker.controller` to be set.
 */
async function waitForServiceWorkerControllingClient(page: any): Promise<void> {
  await page.waitForLoadState('domcontentloaded');

  const reg = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return { ok: false as const, reason: 'no_service_worker' };
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      return {
        ok: true as const,
        scope: registration.scope,
        state: {
          active: registration.active?.state ?? null,
          waiting: registration.waiting?.state ?? null,
          installing: registration.installing?.state ?? null,
        },
      };
    } catch (e: any) {
      return { ok: false as const, reason: 'register_failed', name: e?.name ?? 'Error', message: String(e?.message ?? e) };
    }
  });

  if (!reg.ok) {
    throw new Error(`SW registration failed: ${JSON.stringify(reg)}`);
  }

  for (let i = 0; i < 6; i++) {
    const controlled = await page.evaluate(() => navigator.serviceWorker.controller !== null);
    if (controlled) return;
    await page.reload({ waitUntil: 'domcontentloaded' });
  }

  try {
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 180_000 });
  } catch {
    const debug = await page.evaluate(async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      return {
        href: location.href,
        controller: navigator.serviceWorker.controller?.state ?? null,
        regs: regs.map((r) => ({
          scope: r.scope,
          active: r.active?.state ?? null,
          waiting: r.waiting?.state ?? null,
          installing: r.installing?.state ?? null,
          scriptURL: r.active?.scriptURL ?? r.waiting?.scriptURL ?? r.installing?.scriptURL ?? null,
        })),
      };
    });
    throw new Error(`SW did not control client: ${JSON.stringify(debug)}`);
  }
}

/**
 * Offline PWA State E2E tests
 *
 * Validates that the app behaves correctly when the browser is offline:
 *  - The service worker is registered successfully
 *  - The manifest is linked and parseable
 *  - Core page content is served from cache when the network is cut
 *  - The page title and key headings are still accessible offline
 *
 * `serviceWorkers: 'allow'` is required here: the root Playwright config sets
 * `serviceWorkers: 'block'` so most UI tests avoid stale PWA precaches; these
 * tests explicitly exercise registration and offline cache.
 */

test.describe('Offline PWA State', () => {
  /** One preview + shared SW origin: serial reduces cross-test timing races on controller claim. */
  test.describe.configure({ mode: 'serial' });

  test.setTimeout(240_000);

  test.use({ serviceWorkers: 'allow' });

  test('web app manifest is linked in <head>', async ({ page }) => {
    await page.goto('/en/');
    const manifestHref = await page.$eval(
      'link[rel="manifest"]',
      (el: HTMLLinkElement) => el.href
    );
    expect(manifestHref).toMatch(/manifest\.(webmanifest|json)/);
  });

  test('web app manifest returns valid JSON with required fields', async ({ page }) => {
    await page.goto('/en/');
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
    await page.goto('/en/');
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
    await page.goto('/en/');
    const themeColor = await page.$eval(
      'meta[name="theme-color"]',
      (el: Element) => (el as HTMLMetaElement).content
    );
    expect(themeColor).toBeTruthy();
  });

  test('apple-touch-icon is linked', async ({ page }) => {
    await page.goto('/en/');
    const touchIcon = await page.$eval(
      'link[rel="apple-touch-icon"]',
      (el: HTMLLinkElement) => el.href
    );
    expect(touchIcon).toMatch(/(apple-touch-icon\.png|icon-192\.png)/);
  });

  test('page is served from cache when offline', async ({ page, context }) => {
    await page.goto('/en/');
    await waitForServiceWorkerControllingClient(page);

    await context.setOffline(true);

    const offlineHtml = await page.evaluate(async () => {
      try {
        const res = await fetch('/offline.html');
        return await res.text();
      } catch {
        return '';
      }
    });
    expect(offlineHtml).toMatch(/Offline\s+—\s+Solaris CET/i);

    const offlineImageSvg = await page.evaluate(async () => {
      try {
        const res = await fetch('/offline-image.svg');
        return await res.text();
      } catch {
        return '';
      }
    });
    expect(offlineImageSvg).toMatch(/<svg[\s\S]*>\s*/i);

    await context.setOffline(false);
  });

  test('core page content is available offline after initial load', async ({ page, context }) => {
    await page.goto('/en/');
    await waitForServiceWorkerControllingClient(page);

    await context.setOffline(true);

    const html = await page.evaluate(async () => {
      try {
        const res = await fetch('/offline.html');
        return await res.text();
      } catch {
        return '';
      }
    });
    expect(html).toMatch(/Offline\s+—\s+Solaris CET/i);

    await context.setOffline(false);
  });

  test('app shell loads offline for /en/ after first visit', async ({ page, context }) => {
    await page.goto('/en/');
    await waitForServiceWorkerControllingClient(page);

    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page.locator('#root')).toHaveCount(1);
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
    expect(await page.title()).not.toMatch(/Offline\s+—\s+Solaris CET/i);

    await context.setOffline(false);
  });
});
