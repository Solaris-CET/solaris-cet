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

  test('CET AI modal wires aria-describedby to screen-reader instructions (English)', async ({
    page,
  }) => {
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
    const dialog = page.getByTestId('cet-ai-modal-dialog');
    await expect(dialog).toHaveAttribute('aria-describedby', 'cet-ai-dialog-desc');
    const desc = page.locator('#cet-ai-dialog-desc');
    await expect(desc).toBeAttached();
    await expect(desc).toContainText(/CET AI dialog/i);
    await expect(desc).toContainText(/Escape/i);
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
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('solaris_lang');
    });
    await page.goto('/?lang=ro', { waitUntil: 'domcontentloaded' });
    await page.locator('.loading-overlay').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  });

  test('?lang=ro applies Romanian CET AI chrome', async ({ page }) => {
    await page.getByTestId('cet-ai-hero').scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: /Solaris CET AI/i }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('button', { name: /INIȚIAZĂ PROTOCOLUL/i })).toBeVisible();
  });

  test('?lang=ro modal exposes Romanian screen-reader dialog description', async ({ page }) => {
    await page.getByTestId('cet-ai-hero').scrollIntoViewIfNeeded();
    const chip = page.getByRole('button', { name: /Ce este protocolul RAV/i });
    await chip.evaluate((el) =>
      (el as HTMLElement).scrollIntoView({ block: 'center', inline: 'nearest' }),
    );
    await chip.evaluate((btn) => (btn as HTMLButtonElement).click());
    await expect(page.getByTestId('cet-ai-modal-dialog')).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('cet-ai-modal-dialog')).toHaveAttribute(
      'aria-describedby',
      'cet-ai-dialog-desc',
    );
    const desc = page.locator('#cet-ai-dialog-desc');
    await expect(desc).toBeAttached();
    await expect(desc).toContainText(/Dialog CET AI/i);
    await expect(desc).toContainText(/Escape/i);
  });
});

test.describe('Locale query ?lang=de', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('solaris_lang');
    });
    await page.goto('/?lang=de', { waitUntil: 'domcontentloaded' });
    await page.locator('.loading-overlay').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  });

  test('?lang=de applies German CET AI chrome', async ({ page }) => {
    await page.getByTestId('cet-ai-hero').scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: /Solaris CET AI/i }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('button', { name: /PROTOKOLL STARTEN/i })).toBeVisible();
  });

  test('?lang=de modal exposes German screen-reader dialog description', async ({ page }) => {
    await page.getByTestId('cet-ai-hero').scrollIntoViewIfNeeded();
    const chip = page.getByRole('button', { name: /Was ist das RAV-Protokoll/i });
    await chip.evaluate((el) =>
      (el as HTMLElement).scrollIntoView({ block: 'center', inline: 'nearest' }),
    );
    await chip.evaluate((btn) => (btn as HTMLButtonElement).click());
    await expect(page.getByTestId('cet-ai-modal-dialog')).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('cet-ai-modal-dialog')).toHaveAttribute(
      'aria-describedby',
      'cet-ai-dialog-desc',
    );
    const desc = page.locator('#cet-ai-dialog-desc');
    await expect(desc).toBeAttached();
    await expect(desc).toContainText(/CET-AI-Dialog/i);
    await expect(desc).toContainText(/Escape/i);
  });
});

test.describe('Locale query ?lang=es', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('solaris_lang');
    });
    await page.goto('/?lang=es', { waitUntil: 'domcontentloaded' });
    await page.locator('.loading-overlay').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  });

  test('?lang=es applies Spanish CET AI chrome', async ({ page }) => {
    await page.getByTestId('cet-ai-hero').scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: /CET AI Solaris/i }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('button', { name: /INICIAR PROTOCOLO/i })).toBeVisible();
  });

  test('?lang=es modal exposes Spanish screen-reader dialog description', async ({ page }) => {
    await page.getByTestId('cet-ai-hero').scrollIntoViewIfNeeded();
    const chip = page.getByRole('button', { name: /¿Qué es el protocolo RAV/i });
    await chip.evaluate((el) =>
      (el as HTMLElement).scrollIntoView({ block: 'center', inline: 'nearest' }),
    );
    await chip.evaluate((btn) => (btn as HTMLButtonElement).click());
    await expect(page.getByTestId('cet-ai-modal-dialog')).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('cet-ai-modal-dialog')).toHaveAttribute(
      'aria-describedby',
      'cet-ai-dialog-desc',
    );
    const desc = page.locator('#cet-ai-dialog-desc');
    await expect(desc).toBeAttached();
    await expect(desc).toContainText(/Diálogo CET AI/i);
    await expect(desc).toContainText(/Escape/i);
  });
});

test.describe('Locale query ?lang=zh', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('solaris_lang');
    });
    await page.goto('/?lang=zh', { waitUntil: 'domcontentloaded' });
    await page.locator('.loading-overlay').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  });

  test('?lang=zh applies Chinese CET AI chrome', async ({ page }) => {
    await page.getByTestId('cet-ai-hero').scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: /Solaris CET AI/i }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('button', { name: /启动协议/ })).toBeVisible();
  });

  test('?lang=zh modal exposes Chinese screen-reader dialog description', async ({ page }) => {
    await page.getByTestId('cet-ai-hero').scrollIntoViewIfNeeded();
    const chip = page.getByRole('button', { name: /什么是 RAV 协议/ });
    await chip.evaluate((el) =>
      (el as HTMLElement).scrollIntoView({ block: 'center', inline: 'nearest' }),
    );
    await chip.evaluate((btn) => (btn as HTMLButtonElement).click());
    await expect(page.getByTestId('cet-ai-modal-dialog')).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('cet-ai-modal-dialog')).toHaveAttribute(
      'aria-describedby',
      'cet-ai-dialog-desc',
    );
    const desc = page.locator('#cet-ai-dialog-desc');
    await expect(desc).toBeAttached();
    await expect(desc).toContainText(/CET AI 对话框/);
    await expect(desc).toContainText(/Escape/);
  });
});
