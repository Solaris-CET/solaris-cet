import { test, expect } from '@playwright/test';
import { waitForAppReady } from './e2e-helpers';

test.describe('Header trust strip', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('desktop header shows Cyberscope, Freshcoins, and whitepaper links', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const header = page.locator('header');
    await expect(header.getByRole('link', { name: /Cyberscope/ })).toBeVisible();
    await expect(header.getByRole('link', { name: /Freshcoins/ })).toBeVisible();
    await expect(header.locator('a[href*="bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a"]').first()).toBeVisible();
  });

  test('mobile sheet exposes the same trust links after opening the menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTestId('mobile-menu-toggle').click();

    const sheet = page.locator('#mobile-menu');
    await expect(sheet.getByRole('link', { name: /Cyberscope/ })).toBeVisible();
    await expect(sheet.getByRole('link', { name: /Freshcoins/ })).toBeVisible();
    await expect(sheet.locator('a[href*="bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a"]').first()).toBeVisible();
  });
});
