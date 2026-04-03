import { test, expect } from '@playwright/test';
import { waitForAppReady, scrollUntilSelectorAttached } from './e2e-helpers';

/**
 * Immutable product pillars: fixed CET supply and geographic anchor (see .cursorrules / OMEGA directive).
 */
test.describe('Domain pillars', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('tokenomics (#staking) shows 9,000 CET cap in viewport', async ({ page }) => {
    const staking = page.locator('#staking');
    await expect(staking).toBeAttached({ timeout: 15_000 });
    await staking.scrollIntoViewIfNeeded();
    await expect(staking.getByText('9,000').first()).toBeVisible({ timeout: 10_000 });
  });

  test('RWA section surfaces Cetățuia anchor after lazy mount', async ({ page }) => {
    await scrollUntilSelectorAttached(page, '#rwa');
    const rwa = page.locator('#rwa');
    await rwa.scrollIntoViewIfNeeded();
    await expect(rwa.getByText(/Cetățuia, Romania/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
