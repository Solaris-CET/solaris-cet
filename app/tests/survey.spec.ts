import { expect, test } from '@playwright/test';

test.describe('Survey technician app', () => {
  test('/survey page loads with form sections', async ({ page }) => {
    await page.route('**/api/survey/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          platform: 'solaris-cet',
          engine: { ok: true },
          engine_url: 'http://127.0.0.1:8000',
        }),
      });
    });
    await page.route('**/api/survey/jurisdictions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ jurisdictions: [] }),
      });
    });

    await page.goto('/survey', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Raport șantier/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Profil tehnician/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Generează Raport PDF|Salvează în coadă/i })).toBeVisible();
  });

  test('batch tab shows manifest editor', async ({ page }) => {
    await page.route('**/api/survey/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          platform: 'solaris-cet',
          engine: { ok: true },
          engine_url: 'http://127.0.0.1:8000',
        }),
      });
    });
    await page.route('**/api/survey/jurisdictions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ jurisdictions: [{ code: 'RO-VS', name: 'Vaslui', grid_operator: 'Delgaz Grid' }] }),
      });
    });

    await page.goto('/survey', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Batch' }).click();
    await expect(page.getByText(/Batch — mai multe șantiere/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Manifest JSON/i)).toBeVisible();
  });

  test('calculator prefill on survey page', async ({ page }) => {
    await page.route('**/api/survey/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          platform: 'solaris-cet',
          engine: { ok: true },
          engine_url: 'http://127.0.0.1:8000',
        }),
      });
    });
    await page.route('**/api/survey/jurisdictions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ jurisdictions: [] }),
      });
    });

    await page.goto(
      '/survey?from=calculator&judet=Vaslui&consum=400&putere=6&roof=tigla',
      { waitUntil: 'domcontentloaded' },
    );
    await expect(page.getByText(/precompletate din calculator solar/i)).toBeVisible({ timeout: 15000 });
    await expect(page.locator('label').filter({ hasText: 'Oraș' }).locator('input')).toHaveValue('Vaslui');
  });

  test('survey contact prefill via query params', async ({ page }) => {
    await page.goto(
      '/contact?from=survey&report_id=SOL-E2E-001&name=Maria%20Test&city=Vaslui&kwp=6&score=80&phone=0722123456',
      { waitUntil: 'domcontentloaded' },
    );
    await expect(page.getByText(/SOL-E2E-001/)).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#qf-nume')).toHaveValue('Maria Test');
    await expect(page.locator('#qf-localitate')).toHaveValue('Vaslui');
  });
});