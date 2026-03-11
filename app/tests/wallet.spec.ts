import { test, expect } from '@playwright/test';

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
    // The loading overlay is animated out after ~1.8 s; wait for it to hide.
    // If no overlay is present (e.g., it was already removed by a previous test
    // run in the same browser context), the catch is intentional and safe.
    await page.locator('.loading-overlay').waitFor({ state: 'hidden', timeout: 4000 }).catch(() => {});
  });

  test('connect wallet button is visible in desktop nav', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // TonConnectButton renders a <button> or <div role="button">
    const walletBtn = page.locator('[class*="ton-connect-btn"], tc-root button, button').filter({
      hasText: /connect wallet|connect|wallet/i,
    }).first();
    await expect(walletBtn).toBeVisible({ timeout: 6000 });
  });

  test('connect wallet button has accessible label', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // Any button whose text or aria-label contains "connect"
    const walletBtn = page
      .locator('button, [role="button"]')
      .filter({ hasText: /connect/i })
      .first();
    await expect(walletBtn).toBeVisible({ timeout: 6000 });
    // Must have some accessible text (either inner text or aria-label)
    const label = await walletBtn.getAttribute('aria-label').catch(() => null);
    const text = await walletBtn.innerText().catch(() => '');
    expect(label || text).toBeTruthy();
  });

  test('clicking connect wallet button opens modal or selector', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const walletBtn = page
      .locator('button, [role="button"]')
      .filter({ hasText: /connect/i })
      .first();
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
    const walletBtn = page
      .locator('button, [role="button"]')
      .filter({ hasText: /connect/i })
      .first();
    await walletBtn.waitFor({ state: 'visible', timeout: 6000 });
    await walletBtn.click();

    const modal = page.locator(
      'tc-modal, [data-tc-modal], [role="dialog"], .ton-connect-ui-modal, [class*="modal"]'
    ).first();
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    // Try ESC key first (standard accessibility pattern)
    await page.keyboard.press('Escape');
    const dismissedViaEsc = await modal.isHidden({ timeout: 3000 }).catch(() => false);
    if (!dismissedViaEsc) {
      // Fallback: click an overlay/close button
      const closeBtn = page
        .locator('button[aria-label*="close" i], button[aria-label*="dismiss" i], [data-tc-close]')
        .first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        // Re-assert that the modal became hidden after the fallback action
        await expect(modal).toBeHidden({ timeout: 3000 });
      } else {
        throw new Error(
          'Wallet modal did not dismiss via Escape and no visible close/dismiss button was found.'
        );
      }
    }
  });

  test('connect wallet button is accessible in mobile nav', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    // Open the hamburger menu
    const hamburger = page.locator('button[aria-label="Toggle menu"]');
    await hamburger.waitFor({ state: 'visible', timeout: 5000 });
    await hamburger.click();

    // WalletConnect is rendered inside the mobile menu
    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toBeVisible({ timeout: 3000 });

    // TonConnectButton renders as a web component (tc-root / tc-connect-button) with
    // shadow DOM — text-based filtering does not work across shadow boundaries.
    // Instead verify the host element is present inside the mobile menu.
    const walletRoot = mobileMenu.locator('tc-root, [class*="ton-connect"]').first();
    await expect(walletRoot).toBeAttached({ timeout: 5000 });
  });
});
