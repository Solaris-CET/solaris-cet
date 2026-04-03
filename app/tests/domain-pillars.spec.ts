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

  test('hero quick stats show locale-formatted CET supply, TON, and Cetățuia link', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const stats = page.getByTestId('hero-quick-stats');
    await expect(stats).toBeVisible();
    await expect(stats.getByText(/\d[\d\s.,]+\s*CET/)).toBeVisible();
    await expect(stats.getByText('TON', { exact: true })).toBeVisible();
    await expect(stats.getByRole('link', { name: 'Cetățuia' })).toBeVisible();
    await expect(stats.getByRole('link', { name: 'Cetățuia' })).toHaveAttribute('href', '#authority-trust');
  });

  test('deep link /#hero leaves hero landmarks in the document', async ({ page }) => {
    await page.goto('/#hero');
    await waitForAppReady(page);
    await expect(page.locator('#hero')).toBeAttached({ timeout: 15_000 });
    await expect(page.getByTestId('hero-quick-stats')).toBeVisible();
    await expect(page.getByTestId('hero-quick-stats').getByText('TON', { exact: true })).toBeVisible();
  });

  test('authority-trust section renders four pillar cards after lazy mount', async ({ page }) => {
    await scrollUntilSelectorAttached(page, '#authority-trust');
    const trust = page.locator('#authority-trust');
    await trust.scrollIntoViewIfNeeded();
    await expect(trust).toBeVisible({ timeout: 15_000 });
    await expect(trust.locator('.authority-pillar')).toHaveCount(4);
  });

  test('deep link /#authority-trust attaches after scrolling into lazy band', async ({ page }) => {
    await page.goto('/#authority-trust');
    await waitForAppReady(page);
    await scrollUntilSelectorAttached(page, '#authority-trust');
    await expect(page.locator('#authority-trust').locator('.authority-pillar')).toHaveCount(4);
  });

  test('tokenomics (#staking) shows 9,000 CET cap and TON in viewport', async ({ page }) => {
    const staking = page.locator('#staking');
    await expect(staking).toBeAttached({ timeout: 15_000 });
    await staking.scrollIntoViewIfNeeded();
    await expect(staking.getByText('9,000').first()).toBeVisible({ timeout: 10_000 });
    await expect(staking.getByText(/\s·\sTON$/)).toBeVisible({ timeout: 10_000 });
  });

  test('deep link /#staking keeps tokenomics metrics reachable', async ({ page }) => {
    await page.goto('/#staking');
    await waitForAppReady(page);
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

  test('deep link /#rwa attaches after scrolling into lazy band', async ({ page }) => {
    await page.goto('/#rwa');
    await waitForAppReady(page);
    await scrollUntilSelectorAttached(page, '#rwa');
    await expect(page.locator('#rwa').getByText(/Cetățuia, Romania/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('roadmap section renders phase cards after lazy mount', async ({ page }) => {
    await scrollUntilSelectorAttached(page, '#roadmap');
    const roadmap = page.locator('#roadmap');
    await roadmap.scrollIntoViewIfNeeded();
    await expect(roadmap.getByText('ROADMAP')).toBeVisible({ timeout: 15_000 });
    await expect(roadmap.locator('.roadmap-card')).toHaveCount(7);
  });

  test('deep link /#roadmap attaches roadmap content after lazy band', async ({ page }) => {
    await page.goto('/#roadmap');
    await waitForAppReady(page);
    await scrollUntilSelectorAttached(page, '#roadmap');
    await expect(page.locator('#roadmap').locator('.roadmap-card').first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
