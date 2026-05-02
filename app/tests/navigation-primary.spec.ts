import { expect,test } from '@playwright/test';

import { waitForAppReady } from './e2e-helpers';
import {
  E2E_I18N_START,
  NAV_PRIMARY_DESKTOP_E2E,
  runDesktopNavPrimaryCase,
} from './navPrimaryE2eCases';

/**
 * Desktop header in-page anchors (`Navigation` middle column, xl+).
 * Cases follow `NAV_PRIMARY_IN_PAGE` (`navPrimaryHrefs.ts`).
 */
test.describe('Primary navigation (desktop)', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('solaris_lang', 'en');
    });
    await page.route(/\/api\/cetuia\/tokens\?all=1(?:$|&)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          tokens: [
            { id: 9, status: 'reserved' },
            { id: 10, status: 'sold' },
          ],
        }),
      });
    });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(E2E_I18N_START);
    await waitForAppReady(page);
  });

  for (const { navKey, href } of NAV_PRIMARY_DESKTOP_E2E) {
    test(`nav link ${href} (${navKey})`, async ({ page }) => {
      await runDesktopNavPrimaryCase(page, href);
    });
  }

  test('nav #staking accepts real pointer click at wide viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 900 });
    await page.goto(E2E_I18N_START);
    await waitForAppReady(page);
    await page.locator('header nav a[href="#staking"]').click();
    await expect(page).toHaveURL((u) => u.hash === '#staking');
    const staking = page.locator('#staking');
    await expect(staking).toBeAttached({ timeout: 15_000 });
    await staking.scrollIntoViewIfNeeded();
    await expect(staking.getByText('9,000').first()).toBeVisible({ timeout: 10_000 });
  });
});
