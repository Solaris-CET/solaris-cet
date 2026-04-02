import { test, expect, type Page } from '@playwright/test';

/**
 * Conversion UX — hero next-step row + mobile dock (PR 378/379 follow-up).
 */

async function waitForAppReady(page: Page) {
  await page.locator('.loading-overlay').waitFor({ state: 'hidden', timeout: 4000 }).catch(() => {});
}

test.describe('Conversion UI', () => {
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
    await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'instant' }));
    await expect(page.locator('#stats')).toBeAttached({ timeout: 20000 });
    await page.evaluate(() => window.scrollTo({ top: 2200, behavior: 'instant' }));
    await expect(page.locator('#authority-trust')).toBeVisible({ timeout: 20000 });
  });

  test('footer includes in-page link to trust pillars', async ({ page }) => {
    await page.evaluate(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
    });
    const link = page.locator('footer a[href="#authority-trust"]');
    await expect(link).toBeVisible({ timeout: 20000 });
  });
});
