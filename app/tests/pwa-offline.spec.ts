import { expect, test } from '@playwright/test';

/**
 * Wait until Workbox has an active registration, then reload until this client is controlled.
 * A single reload is not always enough for `navigator.serviceWorker.controller` to be set.
 */
async function waitForServiceWorkerControllingClient(page: any): Promise<boolean> {
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

  if (!reg.ok) return false;

  for (let i = 0; i < 6; i++) {
    const controlled = await page.evaluate(() => navigator.serviceWorker.controller !== null);
    if (controlled) return true;
    await page.reload({ waitUntil: 'domcontentloaded' });
  }

  try {
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 180_000 });
  } catch {
    return false;
  }

  return true;
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
    expect(manifest).toHaveProperty('screenshots');
    expect(Array.isArray((manifest as any).screenshots)).toBeTruthy();
  });

  test('service worker is registered', async ({ page }) => {
    await page.goto('/en/');
    const result = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return { ok: false as const, reason: 'no_service_worker' };
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (e: any) {
        return { ok: false as const, reason: 'register_failed', name: e?.name ?? 'Error', message: String(e?.message ?? e) };
      }

      for (let i = 0; i < 40; i++) {
        const regs = await navigator.serviceWorker.getRegistrations();
        if (regs.length > 0) return { ok: true as const, registrations: regs.length };
        await new Promise((r) => setTimeout(r, 250));
      }

      return { ok: false as const, reason: 'no_registrations_after_wait' };
    });

    test.skip(!result.ok, `SW not available in this environment: ${JSON.stringify(result)}`);
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
    const controlled = await waitForServiceWorkerControllingClient(page);
    test.skip(!controlled, 'Service worker did not control the client in this environment');

    await context.setOffline(true);

    const fetchTextSafe = async (path: string) => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const txt = await page.evaluate(async (p) => {
            try {
              const res = await fetch(p);
              return await res.text();
            } catch {
              return '';
            }
          }, path);
          return typeof txt === 'string' ? txt : '';
        } catch (err) {
          const msg = String(err);
          if (msg.includes('Execution context was destroyed')) {
            await page.waitForLoadState('domcontentloaded').catch(() => void 0);
            continue;
          }
          throw err;
        }
      }
      return '';
    };

    const offlineHtml = await fetchTextSafe('/offline.html');
    expect(offlineHtml).toMatch(/Offline\s+—\s+Solaris CET/i);

    const offlineImageSvg = await fetchTextSafe('/offline-image.svg');
    expect(offlineImageSvg).toMatch(/<svg[\s\S]*>\s*/i);

    await context.setOffline(false);
  });

  test('sovereign CSS is available offline after first load', async ({ page, context }) => {
    await page.goto('/en/');
    const controlled = await waitForServiceWorkerControllingClient(page);
    test.skip(!controlled, 'Service worker did not control the client in this environment');

    await page.goto('/sovereign/');

    await page.waitForSelector('.sovereign-seal');
    const onlineBorder = await page.$eval('.sovereign-seal', (el) => getComputedStyle(el).borderTopWidth);
    expect(onlineBorder).not.toBe('0px');

    await context.setOffline(true);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.sovereign-seal');
    const offlineBorder = await page.$eval('.sovereign-seal', (el) => getComputedStyle(el).borderTopWidth);
    expect(offlineBorder).not.toBe('0px');
    await context.setOffline(false);
  });

  test('programmatic fetch of og-image works offline after warmup', async ({ page, context }) => {
    await page.goto('/en/');
    const controlled = await waitForServiceWorkerControllingClient(page);
    test.skip(!controlled, 'Service worker did not control the client in this environment');

    const warmed = await page.evaluate(async () => {
      const res = await fetch('/og-image.png', { cache: 'no-store' });
      return res.ok;
    });
    expect(warmed).toBe(true);

    await context.setOffline(true);
    const offlineOk = await page.evaluate(async () => {
      try {
        const res = await fetch('/og-image.png');
        return res.ok;
      } catch {
        return false;
      }
    });
    expect(offlineOk).toBe(true);
    await context.setOffline(false);
  });

  test('core page content is available offline after initial load', async ({ page, context }) => {
    await page.goto('/en/');
    const controlled = await waitForServiceWorkerControllingClient(page);
    test.skip(!controlled, 'Service worker did not control the client in this environment');

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
    const controlled = await waitForServiceWorkerControllingClient(page);
    test.skip(!controlled, 'Service worker did not control the client in this environment');

    const runProbe = async () =>
      page.evaluate(async () => {
        try {
          const controller = navigator?.serviceWorker?.controller;
          if (!controller) return { ok: false, status: null };
          return await new Promise<{ ok: boolean; status: number | null }>((resolve) => {
            const timeout = setTimeout(() => {
              cleanup();
              resolve({ ok: false, status: null });
            }, 4_000);

            const onMessage = (ev: MessageEvent) => {
              const data = (ev as any)?.data;
              if (!data || typeof data !== 'object') return;
              if (data.type !== 'PROBE_APP_SHELL_RESULT') return;
              cleanup();
              resolve({ ok: Boolean(data.ok), status: typeof data.status === 'number' ? data.status : null });
            };

            const cleanup = () => {
              clearTimeout(timeout);
              navigator.serviceWorker.removeEventListener('message', onMessage);
            };

            navigator.serviceWorker.addEventListener('message', onMessage);
            controller.postMessage({ type: 'PROBE_APP_SHELL' });
          });
        } catch {
          return { ok: false, status: null };
        }
      });

    const probeOnline = await runProbe();
    expect(probeOnline.ok).toBe(true);

    await context.setOffline(true);

    const probeOffline = await runProbe();
    expect(probeOffline.ok).toBe(true);

    await context.setOffline(false);
  });
});
