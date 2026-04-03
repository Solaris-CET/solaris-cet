import { test, expect } from '@playwright/test';
import { waitForAppReady, scrollUntilSelectorAttached } from './e2e-helpers';

/**
 * Desktop header in-page anchors (`Navigation` middle column, xl+).
 * Link `href` values are stable; some assertions use English HUD copy from section source.
 */
test.describe('Primary navigation (desktop)', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('nav link #staking reveals tokenomics metrics', async ({ page }) => {
    // Hash links: avoid pointer hit-test (logo / glass layers can intercept in headless layout).
    await page.locator('header nav a[href="#staking"]').evaluate((el) => (el as HTMLAnchorElement).click());
    await expect(page).toHaveURL(/#staking/);
    const staking = page.locator('#staking');
    await expect(staking).toBeAttached({ timeout: 15_000 });
    await staking.scrollIntoViewIfNeeded();
    await expect(staking.getByText('9,000').first()).toBeVisible({ timeout: 10_000 });
  });

  test('nav link #roadmap reaches roadmap after lazy mount', async ({ page }) => {
    await page.locator('header nav a[href="#roadmap"]').evaluate((el) => (el as HTMLAnchorElement).click());
    await expect(page).toHaveURL(/#roadmap/);
    await scrollUntilSelectorAttached(page, '#roadmap');
    await expect(page.locator('#roadmap').locator('.roadmap-card').first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('nav link #nova-app surfaces mobile mining section (eager)', async ({ page }) => {
    await page.locator('header nav a[href="#nova-app"]').evaluate((el) => (el as HTMLAnchorElement).click());
    await expect(page).toHaveURL(/#nova-app/);
    const nova = page.locator('#nova-app');
    await expect(nova).toBeAttached({ timeout: 15_000 });
    await nova.scrollIntoViewIfNeeded();
    await expect(nova.getByText('Mobile Mining')).toBeVisible({ timeout: 10_000 });
  });

  test('nav link #team reaches AI team after lazy mount', async ({ page }) => {
    await page.locator('header nav a[href="#team"]').evaluate((el) => (el as HTMLAnchorElement).click());
    await expect(page).toHaveURL(/#team/);
    await scrollUntilSelectorAttached(page, '#team');
    await expect(page.locator('#team').getByText('AI CORPORATE STRUCTURE')).toBeVisible({ timeout: 15_000 });
  });

  test('nav link #how-to-buy reaches buy steps after lazy mount', async ({ page }) => {
    await page.locator('header nav a[href="#how-to-buy"]').evaluate((el) => (el as HTMLAnchorElement).click());
    await expect(page).toHaveURL(/#how-to-buy/);
    await scrollUntilSelectorAttached(page, '#how-to-buy');
    await expect(page.locator('#how-to-buy').getByText('HOW TO BUY')).toBeVisible({ timeout: 15_000 });
  });

  test('nav link #resources reaches ecosystem block after lazy mount', async ({ page }) => {
    await page.locator('header nav a[href="#resources"]').evaluate((el) => (el as HTMLAnchorElement).click());
    await expect(page).toHaveURL(/#resources/);
    await scrollUntilSelectorAttached(page, '#resources');
    await expect(page.locator('#resources').getByText('ECOSYSTEM RESOURCES')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('nav link #faq reaches accordion after lazy mount', async ({ page }) => {
    await page.locator('header nav a[href="#faq"]').evaluate((el) => (el as HTMLAnchorElement).click());
    await expect(page).toHaveURL(/#faq/);
    await scrollUntilSelectorAttached(page, '#faq');
    await expect(page.locator('#faq').locator('.faq-trigger').first()).toBeVisible({ timeout: 15_000 });
  });
});
