import { expect,test } from '@playwright/test';

import { scrollUntilSelectorAttached,waitForAppReady } from './e2e-helpers';

async function scrollToIntelligence(page: import('@playwright/test').Page) {
  await scrollUntilSelectorAttached(page, '#intelligence', { timeout: 15_000 });
  await page.locator('#intelligence').scrollIntoViewIfNeeded({ timeout: 15_000 });
}

test.describe('Decision map — Intelligence', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('solaris_lang', 'en');
      localStorage.setItem('solaris_cookie_consent', JSON.stringify({ essential: true, analytics: false, marketing: false }));
    });
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('intelligence section is present in the DOM', async ({ page }) => {
    await scrollToIntelligence(page);
    const section = page.locator('#intelligence');
    await expect(section).toBeAttached({ timeout: 15_000 });
  });

  test('decision map is reachable and exposes a Mermaid graph source', async ({ page }) => {
    await scrollToIntelligence(page);

    const section = page.locator('#intelligence');
    await expect(section).toBeVisible({ timeout: 15_000 });
    await expect(section.getByText(/Alegerea sistemului/i).first()).toBeAttached({ timeout: 8000 });

    const map = page.getByTestId('mermaid-decision-map');
    await expect(map).toBeVisible({ timeout: 15_000 });
    await map.scrollIntoViewIfNeeded();
    await map.locator('details').first().evaluate((el) => {
      (el as HTMLDetailsElement).open = true;
    });
    await expect(map.locator('pre').filter({ hasText: 'graph TD' }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('copy button produces user feedback', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-write']);
    await scrollToIntelligence(page);
    const map = page.getByTestId('mermaid-decision-map');
    await expect(map).toBeVisible({ timeout: 15_000 });
    await map.scrollIntoViewIfNeeded();
    await expect(map.getByTestId('mermaid-copy-graph')).toBeEnabled({ timeout: 15_000 });
    await map.getByTestId('mermaid-copy-graph').click();
    await expect(page.getByText('Mermaid graph copied', { exact: true })).toBeVisible({ timeout: 5000 });
  });
});
