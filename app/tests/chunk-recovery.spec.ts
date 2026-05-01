import { expect, test } from '@playwright/test';

test.describe('Chunk load recovery', () => {
  test('recovers from a stale dynamic import by reloading with cache-bust', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        const key = '__solarisSsCleared=1';
        if (!window.name.includes(key)) {
          window.name = `${window.name || ''}${window.name ? ';' : ''}${key}`;
          sessionStorage.clear();
        }
      } catch {
        void 0;
      }
    });

    let hijacked = false;
    await page.route(/\/assets\/HomePage-[^/]+\.js(\?.*)?$/, async (route) => {
      if (hijacked) {
        await route.fallback();
        return;
      }
      hijacked = true;
      await route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        headers: { 'Cache-Control': 'no-store' },
        body: '<!doctype html><html><head><meta charset="utf-8"/></head><body>not js</body></html>',
      });
    });

    await page.goto('/en/', { waitUntil: 'domcontentloaded' });

    await expect
      .poll(
        async () => {
          try {
            return await page.evaluate(() => {
              return (
                sessionStorage.getItem('solaris_recover_once_v1') ||
                sessionStorage.getItem('vite_chunk_reload') ||
                null
              );
            });
          } catch {
            return null;
          }
        },
        { timeout: 30_000 },
      )
      .toBe('1');

    await expect.poll(async () => page.url()).toMatch(/[?&]v=\d+/);

    await page.waitForLoadState('domcontentloaded');
    expect(await page.evaluate(() => sessionStorage.getItem('solaris_pending_analytics_event_v1'))).toBeTruthy();
    await expect(page.locator('#root')).toHaveCount(1);
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1, { timeout: 15_000 });
  });
});
