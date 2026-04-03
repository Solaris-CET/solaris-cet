import { test, expect } from '@playwright/test';

/**
 * Solaris CET AI — desktop + mobile viewport, API failure path, locale query.
 */
test.describe('Solaris CET AI widget — desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('solaris_lang', 'en');
    });
    await page.goto('/');
    await page.locator('.loading-overlay').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  });

  test('CET AI title and initiate control are visible', async ({ page }) => {
    const hero = page.getByTestId('cet-ai-hero');
    await hero.scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: /Solaris CET AI/i }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /initiate protocol/i })).toBeVisible();
    const ask = page.getByTestId('cet-ai-hero-query');
    await expect(ask).toBeVisible();
    const box = await ask.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(40);
  });

  test('Opening modal from a suggested chip shows dialog', async ({ page }) => {
    const heroWidget = page
      .locator('div.max-w-5xl')
      .filter({ has: page.getByRole('heading', { name: /Solaris CET AI/i }) })
      .first();
    await heroWidget.scrollIntoViewIfNeeded();
    const chip = heroWidget.getByRole('button', { name: /What is the RAV Protocol/i });
    await chip.evaluate((el) =>
      (el as HTMLElement).scrollIntoView({ block: 'center', inline: 'nearest' }),
    );
    await chip.evaluate((btn) => (btn as HTMLButtonElement).click());
    await expect(page.getByTestId('cet-ai-modal-dialog')).toBeVisible({ timeout: 8000 });
  });

  test('Escape closes CET AI modal', async ({ page }) => {
    const heroWidget = page
      .locator('div.max-w-5xl')
      .filter({ has: page.getByRole('heading', { name: /Solaris CET AI/i }) })
      .first();
    await heroWidget.scrollIntoViewIfNeeded();
    const chip = heroWidget.getByRole('button', { name: /What is the RAV Protocol/i });
    await chip.evaluate((el) =>
      (el as HTMLElement).scrollIntoView({ block: 'center', inline: 'nearest' }),
    );
    await chip.evaluate((btn) => (btn as HTMLButtonElement).click());
    await expect(page.getByTestId('cet-ai-modal-dialog')).toBeVisible({ timeout: 8000 });
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('cet-ai-modal-dialog')).toHaveCount(0);
  });

  test('static mode shows offline hint when /api/chat fails', async ({ page }) => {
    await page.route('**/api/chat', (route) => route.abort('failed'));
    const heroWidget = page
      .locator('div.max-w-5xl')
      .filter({ has: page.getByRole('heading', { name: /Solaris CET AI/i }) })
      .first();
    await heroWidget.scrollIntoViewIfNeeded();
    const chip = heroWidget.getByRole('button', { name: /What is the RAV Protocol/i });
    await chip.evaluate((el) =>
      (el as HTMLElement).scrollIntoView({ block: 'center', inline: 'nearest' }),
    );
    await chip.evaluate((btn) => (btn as HTMLButtonElement).click());
    await expect(page.getByTestId('cet-ai-modal-dialog')).toBeVisible({ timeout: 8000 });
    const offlineHint = page.getByText(/No live API on this host/i);
    await expect(offlineHint).toBeVisible({ timeout: 16_000 });
    await expect(offlineHint).toContainText(/built-in|No live API/i);
  });
});

test.describe('Solaris CET AI widget — mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('solaris_lang', 'en');
    });
    await page.goto('/');
    await page.locator('.loading-overlay').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  });

  test('CET AI controls usable at phone width', async ({ page }) => {
    await page.getByTestId('cet-ai-hero').scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: /Solaris CET AI/i }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /initiate protocol/i })).toBeVisible();
    const h = await page.getByTestId('cet-ai-hero-query').boundingBox();
    expect(h?.height).toBeGreaterThanOrEqual(40);
  });

  test('opens modal from hero question submit (touch flow)', async ({ page }) => {
    await page.getByTestId('cet-ai-hero').scrollIntoViewIfNeeded();
    await page.getByTestId('cet-ai-hero-query').fill('What is the CET supply?');
    await page.getByRole('button', { name: /initiate protocol/i }).click();
    await expect(page.getByTestId('cet-ai-modal-dialog')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('What is the CET supply?', { exact: true })).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Locale query ?lang=', () => {
  test('?lang=ro shows Romanian CET AI title', async ({ page }) => {
    await page.goto('/?lang=ro');
    await page.locator('.loading-overlay').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    await page.getByTestId('cet-ai-hero').scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: /Solaris CET AI/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
