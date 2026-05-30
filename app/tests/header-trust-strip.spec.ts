import { expect, test } from '@playwright/test';

import { waitForAppReady } from './e2e-helpers';

test.describe('Header trust strip', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('trust signals strip is visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const sectionTitle = page.getByText('Încredere & conformitate').first();
    await sectionTitle.scrollIntoViewIfNeeded();
    await expect(sectionTitle).toBeVisible();

    await expect(page.getByText('ANRE').first()).toBeVisible();
    await expect(page.getByText('AFM').first()).toBeVisible();
    await expect(page.getByText('Garanție').first()).toBeVisible();
    await expect(page.getByText('Asigurat').first()).toBeVisible();
  });

  test('trust signals strip is visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const sectionTitle = page.getByText('Încredere & conformitate').first();
    await sectionTitle.scrollIntoViewIfNeeded();
    await expect(sectionTitle).toBeVisible();

    await expect(page.getByText('ANRE').first()).toBeVisible();
    await expect(page.getByText('AFM').first()).toBeVisible();
    await expect(page.getByText('Garanție').first()).toBeVisible();
    await expect(page.getByText('Asigurat').first()).toBeVisible();
  });
});
