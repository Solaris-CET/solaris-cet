import { test, expect, type Page, type BrowserContext } from '@playwright/test';

/**
 * Offline multi-turn flow: chip → follow-up → copy full transcript; asserts clipboard handoff.
 */
async function assertCopyTranscriptMultiTurnOffline(page: Page, context: BrowserContext): Promise<void> {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.route('**/api/chat', (route) => route.abort('failed'));
  await page.addInitScript(() => {
    localStorage.removeItem('cet-ai-chat-history');
  });
  await page.reload();
  await page.locator('.loading-overlay').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

  await page.getByTestId('cet-ai-hero').scrollIntoViewIfNeeded();
  const chip = page.getByRole('button', { name: /What is the RAV Protocol/i });
  await chip.evaluate((el) =>
    (el as HTMLElement).scrollIntoView({ block: 'center', inline: 'nearest' }),
  );
  await chip.evaluate((btn) => (btn as HTMLButtonElement).click());
  await expect(page.getByTestId('cet-ai-modal-dialog')).toBeVisible({ timeout: 8000 });
  await expect(page.getByText(/No live API on this host/i)).toBeVisible({ timeout: 20_000 });

  await page.getByTestId('cet-ai-modal-query').fill('Second turn CET transcript handoff');
  await page.getByTestId('cet-ai-modal-dialog').getByRole('button', { name: /Send question/i }).click();

  await expect(page.getByText('Second turn CET transcript handoff', { exact: true })).toBeVisible({
    timeout: 5000,
  });
  await expect(page.getByTestId('cet-ai-copy-transcript')).toBeVisible({ timeout: 25_000 });
  await page.getByTestId('cet-ai-copy-transcript').click();

  const text = await page.evaluate(async () => navigator.clipboard.readText());
  expect(text).toContain('---');
  expect(text).toContain('What is the RAV Protocol');
  expect(text).toContain('Second turn CET transcript handoff');
  expect(text).toContain('## Question');
}

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

  test('Copy full transcript after follow-up (offline, multi-turn)', async ({ page, context }) => {
    await assertCopyTranscriptMultiTurnOffline(page, context);
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

  test('Copy full transcript after follow-up (offline, multi-turn)', async ({ page, context }) => {
    await assertCopyTranscriptMultiTurnOffline(page, context);
  });
});

/** `/?lang=` CET AI i18n — mirrors `translations.ts` cetAi (title, send, RAV chip, modalDescription). */
type CetAiLocaleFixture = {
  code: string;
  titleHeading: RegExp;
  sendButton: RegExp;
  ravChip: RegExp;
  dialogDescPatterns: readonly [RegExp, RegExp];
};

const CET_AI_LOCALE_FIXTURES: readonly CetAiLocaleFixture[] = [
  {
    code: 'ro',
    titleHeading: /Solaris CET AI/i,
    sendButton: /INIȚIAZĂ PROTOCOLUL/i,
    ravChip: /Ce este protocolul RAV/i,
    dialogDescPatterns: [/Dialog CET AI/i, /Escape/i],
  },
  {
    code: 'de',
    titleHeading: /Solaris CET AI/i,
    sendButton: /PROTOKOLL STARTEN/i,
    ravChip: /Was ist das RAV-Protokoll/i,
    dialogDescPatterns: [/CET-AI-Dialog/i, /Escape/i],
  },
  {
    code: 'es',
    titleHeading: /CET AI Solaris/i,
    sendButton: /INICIAR PROTOCOLO/i,
    ravChip: /¿Qué es el protocolo RAV/i,
    dialogDescPatterns: [/Diálogo CET AI/i, /Escape/i],
  },
  {
    code: 'zh',
    titleHeading: /Solaris CET AI/i,
    sendButton: /启动协议/,
    ravChip: /什么是 RAV 协议/,
    dialogDescPatterns: [/CET AI 对话框/, /Escape/],
  },
  {
    code: 'pt',
    titleHeading: /CET AI Solaris/i,
    sendButton: /INICIAR PROTOCOLO/i,
    ravChip: /O que é o protocolo RAV/i,
    dialogDescPatterns: [/Diálogo CET AI/i, /Escape/i],
  },
  {
    code: 'ru',
    titleHeading: /Solaris CET AI/i,
    sendButton: /ЗАПУСТИТЬ ПРОТОКОЛ/i,
    ravChip: /Что такое протокол RAV/i,
    dialogDescPatterns: [/Диалог CET AI/i, /Escape/i],
  },
];

async function openCetAiModalFromRavChip(page: Page, ravChip: RegExp): Promise<void> {
  await page.getByTestId('cet-ai-hero').scrollIntoViewIfNeeded();
  const chip = page.getByRole('button', { name: ravChip });
  await chip.evaluate((el) =>
    (el as HTMLElement).scrollIntoView({ block: 'center', inline: 'nearest' }),
  );
  await chip.evaluate((btn) => (btn as HTMLButtonElement).click());
}

for (const L of CET_AI_LOCALE_FIXTURES) {
  test.describe(`Locale query ?lang=${L.code}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.removeItem('solaris_lang');
      });
      await page.goto(`/?lang=${L.code}`, { waitUntil: 'domcontentloaded' });
      await page.locator('.loading-overlay').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    });

    test(`?lang=${L.code} applies locale CET AI chrome`, async ({ page }) => {
      await page.getByTestId('cet-ai-hero').scrollIntoViewIfNeeded();
      await expect(page.getByRole('heading', { name: L.titleHeading }).first()).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByRole('button', { name: L.sendButton })).toBeVisible();
    });

    test(`?lang=${L.code} modal exposes screen-reader dialog description`, async ({ page }) => {
      await openCetAiModalFromRavChip(page, L.ravChip);
      await expect(page.getByTestId('cet-ai-modal-dialog')).toBeVisible({ timeout: 8000 });
      await expect(page.getByTestId('cet-ai-modal-dialog')).toHaveAttribute(
        'aria-describedby',
        'cet-ai-dialog-desc',
      );
      const desc = page.locator('#cet-ai-dialog-desc');
      await expect(desc).toBeAttached();
      await expect(desc).toContainText(L.dialogDescPatterns[0]);
      await expect(desc).toContainText(L.dialogDescPatterns[1]);
    });
  });
}
