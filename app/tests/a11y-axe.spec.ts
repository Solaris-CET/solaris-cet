import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { waitForAppReady } from './e2e-helpers';

const ROUTES: Array<{ name: string; path: string }> = [
  { name: 'home', path: '/?lang=en' },
  { name: 'rwa', path: '/?lang=en#rwa' },
  { name: 'cet-ai', path: '/cet-ai?lang=en' },
  { name: 'accessibility', path: '/accessibility?lang=en' },
];

test.describe('A11y (axe)', () => {
  test.setTimeout(90_000);

  for (const r of ROUTES) {
    test(`${r.name}: main region has no axe violations`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(r.path);
      await waitForAppReady(page, { timeout: 15_000 });

      await expect(page.locator('#main-content')).toBeAttached({ timeout: 15_000 });

      const results = await new AxeBuilder({ page })
        .include('#main-content')
        .exclude('iframe')
        .exclude('embed-place-card-element')
        .disableRules(['color-contrast'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
});
