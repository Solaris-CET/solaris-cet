import { test, expect } from '@playwright/test';

/**
 * AI Model Execution E2E tests  (Intelligence Core / ReAct Protocol)
 *
 * The IntelligenceCoreSection contains a live-cycling ReAct protocol demo that
 * steps through THOUGHT → ACTION → OBSERVE phases every 2 seconds.
 *
 * Tests verify:
 *  - The Intelligence Core section is present in the DOM
 *  - ReAct protocol phases (THOUGHT / ACTION / OBSERVE) are rendered
 *  - The cycling animation advances to a new step over time
 *  - The AI metrics (34%, 74x, ∞) are displayed
 *  - The BRAID Framework card is visible
 *  - The AgentBridge visualisation renders
 */

test.describe('AI Model Execution — Intelligence Core', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for loading overlay to hide; catch is intentional — the overlay may
    // already be gone if the browser context was reused across test runs.
    await page.locator('.loading-overlay').waitFor({ state: 'hidden', timeout: 4000 }).catch(() => {
      // Intentional: the overlay may already be hidden on context reuse across tests.
    });
  });

  test('Intelligence Core section is present in the DOM', async ({ page }) => {
    // The section is eagerly rendered (not lazy-loaded); cold preview can exceed 8s on slow runners.
    const section = page.locator('section').filter({ has: page.locator('text=The Intelligence') }).first();
    await expect(section).toBeAttached({ timeout: 15_000 });
  });

  test('ReAct protocol THOUGHT / ACTION / OBSERVE labels are rendered', async ({ page }) => {
    // Scroll to bring the section into view so it renders
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));

    // All three phase labels should exist somewhere in the DOM
    for (const phase of ['THOUGHT', 'ACTION', 'OBSERVE']) {
      await expect(page.locator(`text=${phase}`).first()).toBeAttached({ timeout: 8000 });
    }
  });

  test('ReAct cycling advances to a new active step', async ({ page }) => {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));

    // Find the Intelligence Core section to scope queries to it, avoiding
    // false matches on other animated elements outside this section.
    const section = page.locator('section').filter({ has: page.locator('text=The Intelligence') }).first();

    // The active step has opacity:1 on its step row inside the section.
    const getActiveText = async () => {
      return section.evaluate((el) => {
        const rows = el.querySelectorAll<HTMLElement>('[class*="transition-all duration-500"]');
        for (const row of rows) {
          if (row.style.opacity === '1') {
            const span = row.querySelector('span:first-child');
            return span?.textContent?.trim() ?? null;
          }
        }
        return null;
      });
    };

    // Wait for first active step to appear
    let first: string | null = null;
    await expect.poll(async () => {
      first = await getActiveText();
      return first;
    }, { timeout: 8000, intervals: [500] }).toBeTruthy();

    // Wait 2.5 s (slightly longer than the 2 s interval) and confirm the cycle advanced
    await page.waitForTimeout(2500);
    const second = await getActiveText();

    // The active step must have changed to prove the animation is running
    expect(second).not.toBeNull();
    expect(second).not.toBe(first);
    expect(['THOUGHT', 'ACTION', 'OBSERVE']).toContain(second);
  });

  test('AI metrics — 34%, 74x, and infinity symbol are displayed', async ({ page }) => {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));

    await expect(page.locator('text=34%').first()).toBeAttached({ timeout: 8000 });
    await expect(page.locator('text=74x').first()).toBeAttached({ timeout: 8000 });
    await expect(page.locator('text=∞').first()).toBeAttached({ timeout: 8000 });
  });

  test('BRAID Framework card is visible after scroll', async ({ page }) => {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
    await expect(page.locator('text=BRAID Framework').first()).toBeAttached({ timeout: 8000 });
    await expect(page.locator('text=74x efficiency gains').first()).toBeAttached({ timeout: 8000 });
  });

  test('AgentBridge visualisation is present in the DOM', async ({ page }) => {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
    // AgentBridge renders a canvas element for the neural-network animation
    const bridge = page.locator('canvas').first();
    await expect(bridge).toBeAttached({ timeout: 8000 });
  });

  test('Verifiable AI Decision Loops label is rendered', async ({ page }) => {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
    await expect(
      page.locator('text=Verifiable AI Decision Loops').first()
    ).toBeAttached({ timeout: 8000 });
  });
});
