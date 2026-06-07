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
    const sectionTitle = page.getByText('Dovadă socială').first();
    await sectionTitle.scrollIntoViewIfNeeded();
    await expect(sectionTitle).toBeVisible();

    await expect(page.getByText('Proiecte finalizate').first()).toBeVisible();
    await expect(page.getByText('Garanție lucrări').first()).toBeVisible();
    await expect(page.getByText('Clienți mulțumiți').first()).toBeVisible();
  });

  test('trust signals strip is visible on mobile', async ({ page }) => {
    await openHome(page, 390, 844);
    const sectionTitle = page.getByText('Dovadă socială').first();
    await sectionTitle.scrollIntoViewIfNeeded();
    await expect(sectionTitle).toBeVisible();

    await expect(page.getByText('Proiecte finalizate').first()).toBeVisible();
    await expect(page.getByText('Garanție lucrări').first()).toBeVisible();
    await expect(page.getByText('Clienți mulțumiți').first()).toBeVisible();
  });
});
