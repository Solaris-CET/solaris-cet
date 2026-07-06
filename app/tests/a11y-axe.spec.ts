import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { waitForAppReady } from './e2e-helpers';

const ROUTES: Array<{ name: string; path: string }> = [
  { name: 'home', path: '/' },
  { name: 'services', path: '/servicii/' },
  { name: 'service-detail', path: '/servicii/fotovoltaice-rezidentiale/' },
  { name: 'contact', path: '/contact/' },
];

test.describe('A11y (axe)', () => {
  test.setTimeout(90_000);

  test('main region has no axe violations', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    for (const r of ROUTES) {
      await test.step(r.name, async () => {
        await page.goto(r.path);
        const rootCount = await page.locator('#root').count();
        if (rootCount > 0) {
          await waitForAppReady(page, { timeout: 15_000 });
        }

        const mainCount = await page.locator('#main-content').count();
        const scope = mainCount > 0 ? '#main-content' : 'body';

        const results = await new AxeBuilder({ page })
          .include(scope)
          .exclude('iframe')
          .exclude('embed-place-card-element')
          .disableRules(['color-contrast'])
          .analyze();

        expect(results.violations).toEqual([]);
      });
    }
  });
});
