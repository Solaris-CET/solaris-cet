import { expect, test } from '@playwright/test';

import { scrollUntilSelectorAttached, waitForAppReady } from './e2e-helpers';

/**
 * Conversion UX — hero next-step row + mobile dock (PR 378/379 follow-up).
 */

test.describe('Conversion UI', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('hero has primary CTA to contact and click-to-call', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Cere ofert/i }).first()).toHaveAttribute('href', '/contact');
    await expect(page.getByRole('link', { name: /Sună acum/i }).first()).toHaveAttribute('href', 'tel:+40769889721');
  });

  test('contact promo section is reachable after scroll', async ({ page }) => {
    await scrollUntilSelectorAttached(page, '#contact-promo');
    const promo = page.locator('#contact-promo');
    await promo.scrollIntoViewIfNeeded();
    await expect(promo.getByRole('link', { name: /Contactează-ne/i })).toHaveAttribute('href', '/contact');
  });

  test('footer includes legal and contact links', async ({ page }) => {
    await scrollUntilSelectorAttached(page, '#footer');
    const footer = page.locator('#footer');
    await expect(footer.getByRole('link', { name: /Politică Cookies/i }).first()).toBeVisible({ timeout: 20_000 });
    await expect(footer.getByRole('link', { name: /Contact/i }).first()).toBeVisible({ timeout: 20_000 });
  });
});
