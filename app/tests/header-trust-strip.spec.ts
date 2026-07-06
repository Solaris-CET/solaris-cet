import { expect, type Page,test } from '@playwright/test';

import { waitForAppReady } from './e2e-helpers';

test.describe('Header trust strip', () => {
  async function openHome(page: Page, width: number, height: number) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await waitForAppReady(page);
  }

  test('trust signals strip is visible on desktop', async ({ page }) => {
    await openHome(page, 1280, 800);
    const sectionTitle = page.getByText('Repere comerciale').first();
    await sectionTitle.scrollIntoViewIfNeeded();
    await expect(sectionTitle).toBeVisible();

    await expect(page.getByText('Răspuns comercial').first()).toBeVisible();
    await expect(page.getByText('Arie de lucru').first()).toBeVisible();
    await expect(page.getByText('Tipuri de lucrări').first()).toBeVisible();
    await expect(page.getByText('Ce promitem clar').first()).toBeVisible();
  });

  test('trust signals strip is visible on mobile', async ({ page }) => {
    await openHome(page, 390, 844);
    const sectionTitle = page.getByText('Repere comerciale').first();
    await sectionTitle.scrollIntoViewIfNeeded();
    await expect(sectionTitle).toBeVisible();

    await expect(page.getByText('Răspuns comercial').first()).toBeVisible();
    await expect(page.getByText('Arie de lucru').first()).toBeVisible();
    await expect(page.getByText('Tipuri de lucrări').first()).toBeVisible();
    await expect(page.getByText('Ce promitem clar').first()).toBeVisible();
  });
});
