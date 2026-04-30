import { expect,test } from '@playwright/test';

import { scrollUntilSelectorAttached,waitForAppReady } from './e2e-helpers';

test.describe('Security section', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('audit badge links match public trust URLs after lazy mount', async ({ page }) => {
    await scrollUntilSelectorAttached(page, '#security');
    const section = page.locator('#security');
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible({ timeout: 15_000 });

    await expect(section.locator('a[href*="cyberscope.io"]').first()).toBeVisible();
    await expect(section.locator('a[href*="freshcoins.io"]').first()).toBeVisible();
    await expect(section.locator('a[href*="bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a"]').first()).toBeVisible();
    await expect(section.locator('a[href="https://github.com/Solaris-CET/solaris-cet"]').first()).toBeVisible();
  });

  test('deep link /#security attaches section when scrolled into lazy band', async ({ page }) => {
    await page.goto('/#security');
    await waitForAppReady(page);
    await scrollUntilSelectorAttached(page, '#security');
    await expect(page.locator('#security')).toBeVisible({ timeout: 15_000 });
  });
});
