import { expect, test } from '@playwright/test';

import { scrollUntilSelectorAttached, waitForAppReady } from './e2e-helpers';

test.describe('Competition section', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('comparison section is reachable after scrolling to #competition', async ({ page }) => {
    await scrollUntilSelectorAttached(page, '#competition');
    const section = page.locator('#competition');
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible({ timeout: 15000 });
    await expect(section.getByRole('heading', { name: /Comparație rapidă/i }).first()).toBeVisible();
    await expect(section.getByRole('columnheader', { name: /Solaris CET/i }).first()).toBeVisible();
    await expect(section.getByRole('link', { name: /Solicită evaluare gratuită/i }).first()).toBeVisible();
  });

  test('deep link /#competition keeps the table visible', async ({ page }) => {
    await page.goto('/#competition');
    await waitForAppReady(page);
    await scrollUntilSelectorAttached(page, '#competition');
    const section = page.locator('#competition');
    await expect(section).toBeVisible({ timeout: 15000 });
    await section.scrollIntoViewIfNeeded();
    await expect(section.getByRole('columnheader', { name: /Solaris CET/i }).first()).toBeVisible();
  });
});
