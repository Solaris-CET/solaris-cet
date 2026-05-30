import { expect, test } from '@playwright/test';

import { scrollUntilSelectorAttached, waitForAppReady } from './e2e-helpers';

test.describe('Security section', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('security section exposes warranty + legal links after mount', async ({ page }) => {
    await scrollUntilSelectorAttached(page, '#security');
    const section = page.locator('#security');
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible({ timeout: 15_000 });

    await expect(section.getByRole('link', { name: /Politică de confidențialitate/i }).first()).toHaveAttribute(
      'href',
      '/politica-confidentialitate/',
    );
    await expect(section.getByRole('link', { name: /Politică cookies/i }).first()).toHaveAttribute('href', '/politica-cookies/');
    await expect(section.getByRole('link', { name: /Contact/i }).first()).toHaveAttribute('href', '/contact/');
    await expect(section.getByRole('link', { name: /Sună acum/i }).first()).toHaveAttribute('href', 'tel:+40769889721');
  });

  test('deep link /#security attaches section when scrolled into lazy band', async ({ page }) => {
    await page.goto('/#security');
    await waitForAppReady(page);
    await scrollUntilSelectorAttached(page, '#security');
    await expect(page.locator('#security')).toBeVisible({ timeout: 15_000 });
  });
});
