import { expect, test } from '@playwright/test';

import { scrollUntilSelectorAttached, waitForAppReady } from './e2e-helpers';

test.describe('Domain pillars', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('hero communicates photovoltaics + roofs and offers a next step', async ({ page }) => {
    await expect(page.locator('#hero')).toBeAttached({ timeout: 15_000 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/fotovoltaice/i);
    await expect(page.getByRole('link', { name: /Cere ofert/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Sună acum/i }).first()).toBeVisible();
  });

  test('services section exposes photovoltaic + roofing offerings', async ({ page }) => {
    await scrollUntilSelectorAttached(page, '#servicii');
    const services = page.locator('#servicii');
    await services.scrollIntoViewIfNeeded();
    await expect(services.getByText(/Fotovoltaice rezidențiale/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(services.getByText(/Acoperișuri/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('portfolio section lists representative work cards', async ({ page }) => {
    await scrollUntilSelectorAttached(page, '#proiecte');
    const portfolio = page.locator('#proiecte');
    await portfolio.scrollIntoViewIfNeeded();
    await expect(portfolio.getByText(/Lucrări reprezentative/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(portfolio.getByText(/Fotovoltaice rezidențial/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(portfolio.getByText(/Acoperiș industrial TPO/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('contact promo section remains reachable', async ({ page }) => {
    await scrollUntilSelectorAttached(page, '#contact-promo');
    const promo = page.locator('#contact-promo');
    await promo.scrollIntoViewIfNeeded();
    await expect(promo.getByRole('link', { name: /Contactează-ne/i }).first()).toBeVisible({ timeout: 15_000 });
  });
});
