import { expect, test } from '@playwright/test';

async function waitForServiceWorkerControllingClient(page: any): Promise<void> {
  await page.waitForLoadState('domcontentloaded');

  const reg = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return { ok: false as const, reason: 'no_service_worker' };
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      return { ok: true as const };
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

  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 180_000 });
}

test.describe('State JSON offline fallback', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(240_000);
  test.use({ serviceWorkers: 'allow' });

  test('serves /api/state.json while offline', async ({ page, context }) => {
    await page.goto('/en/');
    await waitForServiceWorkerControllingClient(page);

    await context.setOffline(true);

    const data = await page.evaluate(async () => {
      const res = await fetch('/api/state.json');
      return res.json();
    });

    expect(data).toHaveProperty('token');
    expect(data).toHaveProperty('pool');
    expect(data).toHaveProperty('updatedAt');

    await context.setOffline(false);
  });
});

