import { expect,test } from '@playwright/test';

import { scrollUntilSelectorAttached,waitForAppReady } from './e2e-helpers';

test.describe('Competition section', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('matrix and Recharts mount after scrolling to #competition', async ({ page }) => {
    await scrollUntilSelectorAttached(page, '#competition');
    const section = page.locator('#competition');
    await section.scrollIntoViewIfNeeded();

    await expect(section).toBeVisible({ timeout: 15000 });
    await expect(section.locator('thead th div', { hasText: /^CET$/ })).toBeVisible();
    await expect(section.locator('thead th div', { hasText: /^FET$/ })).toBeVisible();

    // Viewport gate + lazy chunk: Recharts surfaces use .recharts-wrapper
    await expect(section.locator('.recharts-wrapper').first()).toBeVisible({ timeout: 25_000 });
    await expect(section.locator('.recharts-wrapper')).toHaveCount(2);
  });

  test('deep link /#competition still reveals charts when in view', async ({ page }) => {
    await page.goto('/#competition');
    await waitForAppReady(page);
    await scrollUntilSelectorAttached(page, '#competition');
    const section = page.locator('#competition');
    await expect(section).toBeVisible({ timeout: 15000 });
    await section.scrollIntoViewIfNeeded();
    await expect(section.locator('.recharts-wrapper').first()).toBeVisible({ timeout: 25_000 });
  });
});
