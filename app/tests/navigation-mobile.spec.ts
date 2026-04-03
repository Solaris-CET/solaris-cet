import { test, expect } from '@playwright/test';
import { NAV_PRIMARY_IN_PAGE } from '@/lib/navPrimaryHrefs';
import { waitForAppReady, scrollUntilSelectorAttached } from './e2e-helpers';

/**
 * Off-canvas sheet (`#mobile-menu`) mirrors desktop `NAV_PRIMARY_IN_PAGE` links.
 */
test.describe('Primary navigation (mobile sheet)', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('sheet lists the same seven in-page hrefs in order', async ({ page }) => {
    await page.getByTestId('mobile-menu-toggle').click();
    const sheetNav = page.locator('#mobile-menu nav').first();
    const inPageLinks = sheetNav.locator('a[href^="#"]');
    await expect(inPageLinks).toHaveCount(NAV_PRIMARY_IN_PAGE.length);

    for (let i = 0; i < NAV_PRIMARY_IN_PAGE.length; i += 1) {
      await expect(inPageLinks.nth(i)).toHaveAttribute('href', NAV_PRIMARY_IN_PAGE[i].href);
    }
  });

  test('sheet in-page link #staking reaches tokenomics after programmatic click', async ({ page }) => {
    await page.getByTestId('mobile-menu-toggle').click();
    await page
      .locator('#mobile-menu nav a[href="#staking"]')
      .evaluate((el) => (el as HTMLAnchorElement).click());
    await expect(page).toHaveURL(/#staking/);
    const staking = page.locator('#staking');
    await expect(staking).toBeAttached({ timeout: 15_000 });
    await staking.scrollIntoViewIfNeeded();
    await expect(staking.getByText('9,000').first()).toBeVisible({ timeout: 10_000 });
  });

  test('sheet in-page link #faq reaches accordion after lazy mount', async ({ page }) => {
    await page.getByTestId('mobile-menu-toggle').click();
    await page.locator('#mobile-menu nav a[href="#faq"]').evaluate((el) => (el as HTMLAnchorElement).click());
    await expect(page).toHaveURL(/#faq/);
    await scrollUntilSelectorAttached(page, '#faq');
    await expect(page.locator('#faq').locator('.faq-trigger').first()).toBeVisible({ timeout: 15_000 });
  });
});
