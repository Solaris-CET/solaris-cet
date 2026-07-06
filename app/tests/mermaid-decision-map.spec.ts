import { expect,test } from '@playwright/test';

import { scrollUntilSelectorAttached, waitForAppReady } from './e2e-helpers';

test.describe('Mermaid decision map', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('solaris_lang', 'en');
      localStorage.setItem('solaris_cookie_consent', JSON.stringify({ essential: true, analytics: false, marketing: false }));
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page, { timeout: 15_000 });
  });

  test('renders a Mermaid SVG when in view', async ({ page }) => {
    await scrollUntilSelectorAttached(page, '#intelligence');
    const section = page.locator('#intelligence');
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible({ timeout: 15_000 });

    const map = page.getByTestId('mermaid-decision-map');
    await expect(map).toBeVisible({ timeout: 15_000 });
    await map.scrollIntoViewIfNeeded();
    await map.locator('details').first().evaluate((el) => {
      (el as HTMLDetailsElement).open = true;
    });
    await expect(map.locator('pre').filter({ hasText: 'graph TD' }).first()).toBeVisible({ timeout: 25_000 });
  });

  test('copy button produces user feedback', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-write']);
    await scrollUntilSelectorAttached(page, '#intelligence');
    const section = page.locator('#intelligence');
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible({ timeout: 15_000 });

    const map = page.getByTestId('mermaid-decision-map');
    await expect(map).toBeVisible({ timeout: 15_000 });
    await map.scrollIntoViewIfNeeded();
    await expect(map.getByTestId('mermaid-copy-graph')).toBeEnabled({ timeout: 25_000 });

    await map.getByTestId('mermaid-copy-graph').click();
    await expect(page.getByText('Mermaid graph copied', { exact: true })).toBeVisible({ timeout: 5000 });
  });
});
