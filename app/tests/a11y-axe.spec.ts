import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { waitForAppReady } from './e2e-helpers';

const ROUTES: Array<{ name: string; path: string }> = [
  { name: 'home', path: '/en/' },
  { name: 'rwa', path: '/en/#rwa' },
  { name: 'cet-ai', path: '/en/cet-ai' },
  { name: 'accessibility', path: '/en/accessibility' },
  { name: 'wallet', path: '/en/wallet' },
  { name: 'nfts', path: '/en/nfts' },
];

test.describe('A11y (axe)', () => {
  test.setTimeout(90_000);

  test('main region has no axe violations', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    for (const r of ROUTES) {
      await test.step(r.name, async () => {
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
});
