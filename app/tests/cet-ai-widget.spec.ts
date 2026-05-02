import { expect, test } from '@playwright/test';

import type { LangCode } from '../src/i18n/translations';
import { CET_AI_MAX_QUERY_CHARS } from '../src/lib/cetAiConstants';
import { waitForAppReady } from './e2e-helpers';

/** All `LangCode` values except default English — each must have a row in `CET_AI_LOCALE_FIXTURES`. */
type NonEnLang = Exclude<LangCode, 'en'>;

/** Stable anchor for hero chips (avoids ambiguous `max-w-5xl` + heading filters under load). */
async function scrollCetAiHeroIntoView(page: any): Promise<any> {
  const hero = page.getByTestId('cet-ai-hero');
  await expect(hero).toBeVisible({ timeout: 15_000 });
  await hero.scrollIntoViewIfNeeded();
  return hero;
}

/**
 * Offline multi-turn flow: chip → follow-up → copy full transcript; asserts clipboard handoff.
 */
async function assertCopyTranscriptMultiTurnOffline(page: any, context: any): Promise<void> {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.route('**/api/ai/ask', (route: any) => route.abort('failed'));
  await page.route('**/api/chat', (route: any) => route.abort('failed'));
  await page.evaluate(() => {
    localStorage.removeItem('cet-ai-chat-history');
  });
  // Prefer goto over reload: full reload has occasionally dropped the Vite preview (:4173) under load.
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForAppReady(page, { timeout: 15_000 });

  const hero = await scrollCetAiHeroIntoView(page);
  const chip = hero.getByRole('button', { name: /What is the RAV Protocol/i });
  await chip.evaluate((el: HTMLElement) =>
    el.scrollIntoView({ block: 'center', inline: 'nearest' }),
  );
  await chip.evaluate((btn: HTMLElement) => (btn as HTMLButtonElement).click());
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
    await waitForAppReady(page, { timeout: 15_000 });
  });

  test('live multi-turn conversation: initial question + follow-up + sources', async ({ page }) => {
    test.setTimeout(75_000);

    let call = 0;
    await page.route('**/api/ai/ask', async (route: any) => {
      call += 1;
      const payload =
        call === 1
          ? {
              response:
                '[DIAGNOSTIC INTERN]\nFirst reason.\n\n[DECODARE ORACOL]\nFirst act.\n\n[DIRECTIVĂ DE ACȚIUNE]\nFirst observe.\nSOURCES: https://docs.ton.org/',
              sources: [
                {
                  id: 'SRC_001',
                  title: 'TON Docs',
                  url: 'https://docs.ton.org/',
                  snippet: 'TON documentation entry point.',
                },
              ],
            }
          : {
              response:
                '[DIAGNOSTIC INTERN]\nSecond reason.\n\n[DECODARE ORACOL]\nSecond act.\n\n[DIRECTIVĂ DE ACȚIUNE]\nSecond observe.\nSOURCES: https://dedust.io/',
              sources: [
                {
                  id: 'SRC_002',
                  title: 'DeDust',
                  url: 'https://dedust.io/',
                  snippet: 'DeDust DEX.',
                },
              ],
            };

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cet-Ai-Source': 'live',
        },
        body: JSON.stringify(payload),
      });
    });

    await page.getByTestId('cet-ai-hero').scrollIntoViewIfNeeded();
    await page.getByTestId('cet-ai-hero-query').fill('Explain RAV protocol briefly');
    await page.getByTestId('cet-ai-hero').getByRole('button', { name: /initiate|send/i }).click();
    await expect(page.getByTestId('cet-ai-modal-dialog')).toBeVisible({ timeout: 8000 });

    await expect(page.getByText(/First act\./)).toBeVisible({ timeout: 25_000 });
    await expect(page.getByTestId('cet-ai-sources')).toBeVisible({ timeout: 25_000 });
    await expect(
      page.getByTestId('cet-ai-sources').getByTestId('cet-ai-source-link').first(),
    ).toHaveAttribute('href', 'https://docs.ton.org/');

    await page.getByTestId('cet-ai-modal-query').fill('Ok, now give a follow-up action');
    await page
      .getByTestId('cet-ai-modal-dialog')
      .getByRole('button', { name: /Send question/i })
      .click();

    await expect(page.getByText('Ok, now give a follow-up action', { exact: true })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText(/Second act\./)).toBeVisible({ timeout: 25_000 });
    await expect(page.getByTestId('cet-ai-sources')).toBeVisible({ timeout: 25_000 });
    await expect(
      page.getByTestId('cet-ai-sources').getByTestId('cet-ai-source-link').first(),
    ).toHaveAttribute('href', 'https://dedust.io/');

    await expect(page.getByText('Explain RAV protocol briefly', { exact: true })).toBeVisible({
      timeout: 5000,
    });
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

  test('hero query shows character count when typing', async ({ page }) => {
    await page.getByTestId('cet-ai-hero').scrollIntoViewIfNeeded();
    await page.getByTestId('cet-ai-hero-query').fill('abc');
    const row = page.getByTestId('cet-ai-query-char-count');
    await expect(row).toHaveText(`3/${CET_AI_MAX_QUERY_CHARS}`);
    await expect(row).toHaveAttribute(
      'aria-label',
      `Characters: 3 of ${CET_AI_MAX_QUERY_CHARS}.`,
    );
  });

  test('modal follow-up shows character count when typing (offline)', async ({ page }) => {
    await page.route('**/api/ai/ask', (route: any) => route.abort('failed'));
    await page.route('**/api/chat', (route: any) => route.abort('failed'));
    const heroWidget = await scrollCetAiHeroIntoView(page);
    const chip = heroWidget.getByRole('button', { name: /What is the RAV Protocol/i });
    await chip.evaluate((el: HTMLElement) =>
      el.scrollIntoView({ block: 'center', inline: 'nearest' }),
    );
    await chip.evaluate((btn: HTMLElement) => (btn as HTMLButtonElement).click());
    await expect(page.getByTestId('cet-ai-modal-dialog')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/No live API on this host/i)).toBeVisible({ timeout: 20_000 });
    const row = page.getByTestId('cet-ai-query-char-count');
    await page.getByTestId('cet-ai-modal-query').fill('x');
    await expect(row).toHaveText(`1/${CET_AI_MAX_QUERY_CHARS}`);
    await expect(row).toHaveAttribute('aria-label', `Characters: 1 of ${CET_AI_MAX_QUERY_CHARS}.`);
  });

  test('Opening modal from a suggested chip shows dialog', async ({ page }) => {
    const heroWidget = await scrollCetAiHeroIntoView(page);
    const chip = heroWidget.getByRole('button', { name: /What is the RAV Protocol/i });
    await chip.evaluate((el: HTMLElement) =>
      el.scrollIntoView({ block: 'center', inline: 'nearest' }),
    );
    await chip.evaluate((btn: HTMLElement) => (btn as HTMLButtonElement).click());
    await expect(page.getByTestId('cet-ai-modal-dialog')).toBeVisible({ timeout: 8000 });
  });

  test('CET AI modal wires aria-describedby to screen-reader instructions (English)', async ({
    page,
  }) => {
    const heroWidget = await scrollCetAiHeroIntoView(page);
    const chip = heroWidget.getByRole('button', { name: /What is the RAV Protocol/i });
    await chip.evaluate((el: HTMLElement) =>
      el.scrollIntoView({ block: 'center', inline: 'nearest' }),
    );
    await chip.evaluate((btn: HTMLElement) => (btn as HTMLButtonElement).click());
    await expect(page.getByTestId('cet-ai-modal-dialog')).toBeVisible({ timeout: 8000 });
    const dialog = page.getByTestId('cet-ai-modal-dialog');
    await expect(dialog).toHaveAttribute('aria-describedby', 'cet-ai-dialog-desc');
    const desc = page.locator('#cet-ai-dialog-desc');
    await expect(desc).toBeAttached();
    await expect(desc).toContainText(/CET AI dialog/i);
    await expect(desc).toContainText(/Escape/i);
  });

  test('Escape closes CET AI modal', async ({ page }) => {
    const heroWidget = await scrollCetAiHeroIntoView(page);
    const chip = heroWidget.getByRole('button', { name: /What is the RAV Protocol/i });
    await chip.evaluate((el: HTMLElement) =>
      el.scrollIntoView({ block: 'center', inline: 'nearest' }),
    );
    await chip.evaluate((btn: HTMLElement) => (btn as HTMLButtonElement).click());
    await expect(page.getByTestId('cet-ai-modal-dialog')).toBeVisible({ timeout: 8000 });
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('cet-ai-modal-dialog')).toHaveCount(0);
  });

  test('Copy full transcript after follow-up (offline, multi-turn)', async ({ page, context }) => {
    test.setTimeout(60_000);
    await assertCopyTranscriptMultiTurnOffline(page, context);
  });

  test('static mode shows offline hint when live API fails', async ({ page }) => {
    await page.route('**/api/ai/ask', (route: any) => route.abort('failed'));
    await page.route('**/api/chat', (route: any) => route.abort('failed'));
    const heroWidget = await scrollCetAiHeroIntoView(page);
    const chip = heroWidget.getByRole('button', { name: /What is the RAV Protocol/i });
    await chip.evaluate((el: HTMLElement) =>
      el.scrollIntoView({ block: 'center', inline: 'nearest' }),
    );
    await chip.evaluate((btn: HTMLElement) => (btn as HTMLButtonElement).click());
    await expect(page.getByTestId('cet-ai-modal-dialog')).toBeVisible({ timeout: 8000 });
    const offlineHint = page.getByText(/No live API on this host/i);
    await expect(offlineHint).toBeVisible({ timeout: 16_000 });
    await expect(offlineHint).toContainText(/built-in|No live API/i);
  });

  test('renders sources list when live API returns sources', async ({ page }) => {
    await page.route('**/api/ai/ask', async (route: any) => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cet-Ai-Source': 'live',
        },
        body: JSON.stringify({
          response:
            '[DIAGNOSTIC INTERN]\\nReason.\\n\\n[DECODARE ORACOL]\\nAction.\\n\\n[DIRECTIVĂ DE ACȚIUNE]\\nSOURCES: https://docs.ton.org/',
          sources: [
            {
              id: 'SRC_001',
              title: 'TON Docs',
              url: 'https://docs.ton.org/',
              snippet: 'TON documentation entry point.',
            },
          ],
        }),
      });
    });

    const heroWidget = await scrollCetAiHeroIntoView(page);
    const chip = heroWidget.getByRole('button', { name: /What is the RAV Protocol/i });
    await chip.evaluate((el: HTMLElement) => el.scrollIntoView({ block: 'center', inline: 'nearest' }));
    await chip.evaluate((btn: HTMLElement) => (btn as HTMLButtonElement).click());

    await expect(page.getByTestId('cet-ai-modal-dialog')).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('cet-ai-sources')).toBeVisible({ timeout: 20_000 });
    const link = page.getByTestId('cet-ai-sources').getByTestId('cet-ai-source-link');
    await expect(link).toHaveAttribute('href', 'https://docs.ton.org/');
    await expect(link).toContainText('TON Docs');
  });
});

test.describe('Solaris CET AI widget — mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('solaris_lang', 'en');
    });
    await page.goto('/');
    await waitForAppReady(page, { timeout: 15_000 });
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

  test('hero query shows character count when typing', async ({ page }) => {
    await page.getByTestId('cet-ai-hero').scrollIntoViewIfNeeded();
    await page.getByTestId('cet-ai-hero-query').fill('xy');
    const row = page.getByTestId('cet-ai-query-char-count');
    await expect(row).toHaveText(`2/${CET_AI_MAX_QUERY_CHARS}`);
    await expect(row).toHaveAttribute(
      'aria-label',
      `Characters: 2 of ${CET_AI_MAX_QUERY_CHARS}.`,
    );
  });

  test('modal follow-up shows character count when typing (offline)', async ({ page }) => {
    await page.route('**/api/ai/ask', (route: any) => route.abort('failed'));
    await page.route('**/api/chat', (route: any) => route.abort('failed'));
    await page.getByTestId('cet-ai-hero').scrollIntoViewIfNeeded();
    const chip = page.getByRole('button', { name: /What is the RAV Protocol/i });
    await chip.evaluate((el: HTMLElement) =>
      el.scrollIntoView({ block: 'center', inline: 'nearest' }),
    );
    await chip.evaluate((btn: HTMLElement) => (btn as HTMLButtonElement).click());
    await expect(page.getByTestId('cet-ai-modal-dialog')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/No live API on this host/i)).toBeVisible({ timeout: 20_000 });
    const row = page.getByTestId('cet-ai-query-char-count');
    await page.getByTestId('cet-ai-modal-query').fill('m');
    await expect(row).toHaveText(`1/${CET_AI_MAX_QUERY_CHARS}`);
    await expect(row).toHaveAttribute('aria-label', `Characters: 1 of ${CET_AI_MAX_QUERY_CHARS}.`);
  });

  test('Copy full transcript after follow-up (offline, multi-turn)', async ({ page, context }) => {
    test.setTimeout(60_000);
    await assertCopyTranscriptMultiTurnOffline(page, context);
  });
});

/**
 * `/?lang=` CET AI regression — keep in sync with `translations.ts` `cetAi`:
 * `title`, `sendButton`, first RAV `suggestedQuestions` chip, `modalDescription` (two substrings).
 * English (`en`) is covered by desktop tests above (no `?lang=`).
 */
type CetAiLocaleFixture = {
  code: NonEnLang;
  titleHeading: RegExp;
  sendButton: RegExp;
  ravChip: RegExp;
  dialogDescPatterns: readonly [RegExp, RegExp];
  /** `aria-label` on `#cet-ai-query-char-count` after a single-character query (matches `queryCharCountAria`). */
  queryCharCountAriaOneChar: RegExp;
};

const CET_AI_LOCALE_FIXTURES: readonly CetAiLocaleFixture[] = [
  {
    code: 'ro',
    titleHeading: /Solaris CET AI/i,
    sendButton: /INIȚIAZĂ PROTOCOLUL/i,
    ravChip: /Ce este protocolul RAV/i,
    dialogDescPatterns: [/Dialog CET AI/i, /Escape/i],
    queryCharCountAriaOneChar: /^Caractere: 1 din \d+\.$/,
  },
  {
    code: 'de',
    titleHeading: /Solaris CET AI/i,
    sendButton: /PROTOKOLL STARTEN/i,
    ravChip: /Was ist das RAV-Protokoll/i,
    dialogDescPatterns: [/CET-AI-Dialog/i, /Escape/i],
    queryCharCountAriaOneChar: /^Zeichen: 1 von \d+\.$/,
  },
  {
    code: 'es',
    titleHeading: /CET AI Solaris/i,
    sendButton: /INICIAR PROTOCOLO/i,
    ravChip: /¿Qué es el protocolo RAV/i,
    dialogDescPatterns: [/Diálogo CET AI/i, /Escape/i],
    queryCharCountAriaOneChar: /^Caracteres: 1 de \d+\.$/,
  },
  {
    code: 'zh',
    titleHeading: /Solaris CET AI/i,
    sendButton: /启动协议/,
    ravChip: /什么是 RAV 协议/,
    dialogDescPatterns: [/CET AI 对话框/, /Escape/],
    queryCharCountAriaOneChar: /^字符数：1 \/ \d+。$/,
  },
  {
    code: 'pt',
    titleHeading: /CET AI Solaris/i,
    sendButton: /INICIAR PROTOCOLO/i,
    ravChip: /O que é o protocolo RAV/i,
    dialogDescPatterns: [/Diálogo CET AI/i, /Escape/i],
    queryCharCountAriaOneChar: /^Caracteres: 1 de \d+\.$/,
  },
  {
    code: 'ru',
    titleHeading: /Solaris CET AI/i,
    sendButton: /ЗАПУСТИТЬ ПРОТОКОЛ/i,
    ravChip: /Что такое протокол RAV/i,
    dialogDescPatterns: [/Диалог CET AI/i, /Escape/i],
    queryCharCountAriaOneChar: /^Символов: 1 из \d+\.$/,
  },
];

async function openCetAiModalFromRavChip(page: any, ravChip: RegExp): Promise<void> {
  await page.getByTestId('cet-ai-hero').scrollIntoViewIfNeeded();
  const chip = page.getByRole('button', { name: ravChip });
  await chip.evaluate((el: HTMLElement) =>
    el.scrollIntoView({ block: 'center', inline: 'nearest' }),
  );
  await chip.evaluate((btn: HTMLElement) => (btn as HTMLButtonElement).click());
}

for (const L of CET_AI_LOCALE_FIXTURES) {
  test.describe(`Locale query ?lang=${L.code}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.removeItem('solaris_lang');
      });
      await page.goto(`/?lang=${L.code}`, { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page, { timeout: 15_000 });
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

    test(`?lang=${L.code} query char count aria matches locale`, async ({ page }) => {
      await page.getByTestId('cet-ai-hero').scrollIntoViewIfNeeded();
      await page.getByTestId('cet-ai-hero-query').fill('z');
      await expect(page.getByTestId('cet-ai-query-char-count')).toHaveAttribute(
        'aria-label',
        L.queryCharCountAriaOneChar,
      );
    });
  });
}
