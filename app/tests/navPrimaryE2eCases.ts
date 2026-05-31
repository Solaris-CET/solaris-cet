import { expect } from '@playwright/test';

import { URL_LOCALES } from '../src/i18n/urlRouting';
import { NAV_PRIMARY_IN_PAGE } from '../src/lib/navPrimaryHrefs';

/** Match `sovereign-static.spec.ts`: fixed language for stable nav + section copy. */
export const E2E_I18N_START = '/en/';

export type NavPrimaryInPageHref = (typeof NAV_PRIMARY_IN_PAGE)[number]['href'];

async function clickNavLink(locator: any) {
  try {
    await locator.click({ timeout: 3_000 });
  } catch {
    await locator.evaluate((el: Element) => (el as HTMLAnchorElement).click());
  }
}

export async function clickHeaderNav(page: any, href: NavPrimaryInPageHref): Promise<void> {
  const locator = href.startsWith('#')
    ? page.locator(`header nav a[href="${href}"], header nav a[href$="${href}"]`)
    : page.locator(`header nav a[href$="${href}"]`);
  await clickNavLink(locator);
}

export async function clickMobileSheetNav(page: any, href: NavPrimaryInPageHref): Promise<void> {
  const locator = page.locator(`#mobile-menu nav a[href="${href}"]`);
  await clickNavLink(locator);
}

function stripLocalePrefix(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  const first = parts[0] ?? '';
  if ((URL_LOCALES as readonly string[]).includes(first)) {
    const rest = `/${parts.slice(1).join('/')}`;
    return rest === '/' ? '/' : rest.replace(/\/$/, '') || '/';
  }
  return pathname;
}

const desktopAssertByHref: Record<NavPrimaryInPageHref, (page: any) => Promise<void>> = {
  '/': async (page: any) => {
    await expect(page.locator('#main-content')).toBeAttached({ timeout: 15_000 });
  },
  '/services': async (page: any) => {
    await expect(page.locator('#main-content')).toBeAttached({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /Our Services/i }).first()).toBeVisible({ timeout: 30_000 });
  },
  '/contact': async (page: any) => {
    await expect(page.locator('#main-content')).toBeAttached({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /Contact Us/i }).first()).toBeVisible({ timeout: 30_000 });
  },
  '/about': async (page: any) => {
    await expect(page.locator('#main-content')).toBeAttached({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /Solaris CET — why it exists/i }).first()).toBeVisible({ timeout: 30_000 });
  },
  '/faq': async (page: any) => {
    await expect(page.locator('#main-content')).toBeAttached({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /FAQ/i }).first()).toBeVisible({ timeout: 30_000 });
  },
};

export async function runDesktopNavPrimaryCase(page: any, href: NavPrimaryInPageHref): Promise<void> {
  await clickHeaderNav(page, href);
  if (href.startsWith('#')) {
    await expect(page).toHaveURL((u: any) => u.hash === href);
  } else {
    await expect(page).toHaveURL((u: any) => stripLocalePrefix(u.pathname).replace(/\/$/, '') === (href === '/' ? '' : href));
  }
  await desktopAssertByHref[href](page);
}

export const NAV_PRIMARY_DESKTOP_E2E = NAV_PRIMARY_IN_PAGE.map((item) => ({
  navKey: item.navKey,
  href: item.href,
}));
