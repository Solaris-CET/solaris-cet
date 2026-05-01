import { expect,test } from '@playwright/test';

import { waitForAppReady } from './e2e-helpers';

/**
 * Wallet Connection E2E tests
 *
 * Validates the TonConnect wallet button UI that is rendered in the Navigation
 * header.  We cannot simulate an actual TON wallet signing flow in a browser
 * without a real wallet extension, so tests focus on:
 *  - The connect button being visible and accessible
 *  - Clicking the button opens the multi-wallet selector modal
 *  - The modal can be dismissed
 *  - The button is present in both desktop and mobile views
 */

test.describe('Wallet Connection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('connect wallet button is visible in desktop nav', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const walletBtn = page.locator('[data-testid="wallet-connect-button"]').first();
    await expect(walletBtn).toBeVisible({ timeout: 6000 });
  });

  test('connect wallet button has accessible label', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const walletBtn = page.locator('[data-testid="wallet-connect-button"]').first();
    await expect(walletBtn).toBeVisible({ timeout: 6000 });
    // Must have some accessible text (either inner text or aria-label)
    const label = await walletBtn.getAttribute('aria-label').catch(() => null);
    const text = await walletBtn.innerText().catch(() => '');
    expect(label || text).toBeTruthy();
  });

  test('clicking connect wallet button opens modal or selector', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const walletBtn = page.locator('[data-testid="wallet-connect-button"]').first();
    await walletBtn.waitFor({ state: 'visible', timeout: 6000 });
    await walletBtn.click();
    // The TonConnect modal is injected into the DOM as a web-component (<tc-modal> / <div role="dialog">)
    // or a generic modal/dialog element
    const modal = page.locator(
      'tc-modal, [data-tc-modal], [role="dialog"], .ton-connect-ui-modal, [class*="modal"]'
    ).first();
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('wallet modal can be dismissed', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const walletBtn = page.locator('[data-testid="wallet-connect-button"]').first();
    await walletBtn.waitFor({ state: 'visible', timeout: 6000 });
    await walletBtn.click();

    // TonConnect @tonconnect/ui wallets modal — stable hooks from the library bundle
    const walletsModal = page.locator('[data-tc-wallets-modal-container="true"]');
    await expect(walletsModal).toBeVisible({ timeout: 8000 });

    // Header close control (icon button) — prefer over Escape; CI focus can miss body key handlers
    const closeBtn = walletsModal.locator('[data-tc-icon-button="true"]').first();
    await closeBtn.click();
    await expect(walletsModal).toBeHidden({ timeout: 5000 });
  });

  test('connect wallet button is accessible in mobile nav', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    // Open the hamburger menu
    const hamburger = page.locator('button[aria-controls="mobile-menu"]');
    await hamburger.waitFor({ state: 'visible', timeout: 5000 });
    await hamburger.click();

    // WalletConnect is rendered inside the mobile menu
    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toBeVisible({ timeout: 3000 });

    const walletBtn = mobileMenu.locator('[data-testid="wallet-connect-button"]').first();
    await expect(walletBtn).toBeVisible({ timeout: 5000 });
  });
});
