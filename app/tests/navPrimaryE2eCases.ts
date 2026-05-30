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
  const locator = href.startsWith('#')
    ? page.locator(`#mobile-menu nav > a[href="${href}"]`)
    : page.locator(`#mobile-menu nav > a[href="${href}"], #mobile-menu nav > a[href$="${href}"]`);
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
  '#hero': async (page: any) => {
    await expect(page.locator('#hero')).toBeAttached({ timeout: 15_000 });
  },
  '#servicii': async (page: any) => {
    await expect(page.locator('#servicii')).toBeAttached({ timeout: 15_000 });
  },
  '#proiecte': async (page: any) => {
    await expect(page.locator('#proiecte')).toBeAttached({ timeout: 15_000 });
  },
  '/finantare': async (page: any) => {
    await expect(page.locator('#main-content')).toBeAttached({ timeout: 15_000 });
    await expect(page.getByText(/Casa Verde|Financing/i).first()).toBeVisible({ timeout: 30_000 });
  },
  '/blog': async (page: any) => {
    await expect(page.locator('#main-content')).toBeAttached({ timeout: 15_000 });
    await expect(page.getByText(/Blog/i).first()).toBeVisible({ timeout: 30_000 });
  },
  '/despre': async (page: any) => {
    await expect(page.locator('#main-content')).toBeAttached({ timeout: 15_000 });
    await expect(page.getByText(/Despre|About/i).first()).toBeVisible({ timeout: 30_000 });
  },
  '/token-cet': async (page: any) => {
    await expect(page.locator('#main-content')).toBeAttached({ timeout: 15_000 });
    await expect(page.getByText(/CET/i).first()).toBeVisible({ timeout: 30_000 });
  },
  '/contact': async (page: any) => {
    await expect(page.locator('#main-content')).toBeAttached({ timeout: 15_000 });
    await expect(page.getByText(/Contact/i).first()).toBeVisible({ timeout: 30_000 });
  },
};

export async function runDesktopNavPrimaryCase(page: any, href: NavPrimaryInPageHref): Promise<void> {
  await clickHeaderNav(page, href);
  if (href.startsWith('#')) {
    await expect(page).toHaveURL((u: any) => u.hash === href);
  } else {
    await expect(page).toHaveURL((u: any) => stripLocalePrefix(u.pathname).replace(/\/$/, '') === href);
  }
  await desktopAssertByHref[href](page);
}

export const NAV_PRIMARY_DESKTOP_E2E = NAV_PRIMARY_IN_PAGE.map((item) => ({
  navKey: item.navKey,
  href: item.href,
}));
