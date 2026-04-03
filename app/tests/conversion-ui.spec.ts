import { test, expect } from '@playwright/test';
import { waitForAppReady, scrollUntilSelectorAttached } from './e2e-helpers';

/**
 * Conversion UX — hero next-step row + mobile dock (PR 378/379 follow-up).
 */

test.describe('Conversion UI', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('hero next-step row has DeDust, tokenomics, and how-to-buy anchors', async ({ page }) => {
    const row = page.getByTestId('hero-next-steps');
    await expect(row).toBeVisible();
    await expect(row.locator('a[href*="dedust.io"]')).toHaveCount(1);
    await expect(row.locator('a[href="#staking"]')).toHaveCount(1);
    await expect(row.locator('a[href="#how-to-buy"]')).toHaveCount(1);
  });

  test('mobile conversion dock is visible below xl', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const dock = page.getByTestId('mobile-conversion-dock');
    await expect(dock).toBeVisible();
    await expect(dock.locator('a[href*="dedust.io"]')).toHaveCount(1);
    await expect(dock.locator('a[href="#staking"]')).toHaveCount(1);
    await expect(dock.locator('a[href="#how-to-buy"]')).toHaveCount(1);
    await expect(dock.locator('a[href^="https://t.me"]')).toHaveCount(1);
  });

  test('mobile conversion dock is hidden at xl breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByTestId('mobile-conversion-dock')).toBeHidden();
  });

  test('authority-trust section mounts after scroll (lazy band)', async ({ page }) => {
    await scrollUntilSelectorAttached(page, '#authority-trust');
    await expect(page.locator('#stats')).toBeAttached({ timeout: 20_000 });
    await expect(page.locator('#authority-trust')).toBeVisible({ timeout: 20_000 });
  });

  test('footer includes in-page link to trust pillars', async ({ page }) => {
    await scrollUntilSelectorAttached(page, '[data-testid="footer-authority-trust-link"]');
    await expect(page.getByTestId('footer-authority-trust-link')).toBeVisible({ timeout: 20_000 });
  });
});
