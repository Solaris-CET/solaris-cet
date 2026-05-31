import { expect,test } from '@playwright/test';

import { URL_LOCALES } from '../src/i18n/urlRouting';
import { NAV_PRIMARY_IN_PAGE } from '../src/lib/navPrimaryHrefs';
import { waitForAppReady } from './e2e-helpers';
import { clickMobileSheetNav, E2E_I18N_START } from './navPrimaryE2eCases';

const LOCALE_PREFIX = `(?:/(?:${URL_LOCALES.join('|')}))?`;

/**
 * Off-canvas sheet (`#mobile-menu`) mirrors desktop `NAV_PRIMARY_IN_PAGE` links.
 */
test.describe('Primary navigation (mobile sheet)', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('solaris_lang', 'en');
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(E2E_I18N_START);
    await waitForAppReady(page);
  });

  test('sheet lists the same primary hrefs in order', async ({ page }) => {
    await page.getByTestId('mobile-menu-toggle').click();
    const sheetNav = page.locator('#mobile-menu nav').first();
    const links = sheetNav.locator(':scope > a');
    await expect(links).toHaveCount(NAV_PRIMARY_IN_PAGE.length);

    for (let i = 0; i < NAV_PRIMARY_IN_PAGE.length; i += 1) {
      const expected = NAV_PRIMARY_IN_PAGE[i].href;
      if (expected.startsWith('/')) {
        await expect(links.nth(i)).toHaveAttribute('href', new RegExp(`^${LOCALE_PREFIX}${expected}(\\?|$)`));
      } else {
        await expect(links.nth(i)).toHaveAttribute('href', expected);
      }
    }
  });

  test('sheet in-page link /services reaches services page', async ({ page }) => {
    await page.getByTestId('mobile-menu-toggle').click();
    await clickMobileSheetNav(page, '/services' as any);
    await expect(page).toHaveURL(/\/services/);
    await expect(page.locator('#main-content')).toBeAttached({ timeout: 15_000 });
  });

  test('sheet in-page link /faq reaches accordion after lazy mount', async ({ page }) => {
    await page.getByTestId('mobile-menu-toggle').click();
    await clickMobileSheetNav(page, '/faq' as any);
    await expect(page).toHaveURL(/\/faq/);
    const faq = page.locator('#main-content');
    await expect(faq).toBeAttached({ timeout: 15_000 });
  });
});
