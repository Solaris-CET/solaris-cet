import { expect } from '@playwright/test';

import { URL_LOCALES } from '../src/i18n/urlRouting';

/** Match `sovereign-static.spec.ts`: fixed language for stable nav + section copy. */
export const E2E_I18N_START = '/en/';

export type NavPrimaryDesktopHref = '#hero' | '/proiecte' | '/servicii' | '/contact';
export type NavPrimaryMobileHref =
  | '#hero'
  | '#servicii'
  | '#produse'
  | '#echipamente'
  | '#proiecte'
  | '/finantare'
  | '/blog'
  | '/despre'
  | '/contact';

async function clickNavLink(locator: any) {
  try {
    await locator.click({ timeout: 3_000 });
  } catch {
    await locator.evaluate((el: Element) => (el as HTMLAnchorElement).click());
  }
}

export async function clickMobileSheetNav(page: any, href: NavPrimaryMobileHref): Promise<void> {
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

const desktopAssertByHref: Record<NavPrimaryDesktopHref, (page: any) => Promise<void>> = {
  '#hero': async (page: any) => {
    await expect(page.locator('#hero')).toBeAttached({ timeout: 15_000 });
  },
  '/proiecte': async (page: any) => {
    await expect(page.locator('#main-content')).toBeAttached({ timeout: 15_000 });
    await expect(page.getByText(/Proiecte|Portofoliu|Projects|Portfolio/i).first()).toBeVisible({ timeout: 30_000 });
  },
  '/servicii': async (page: any) => {
    await expect(page.locator('#main-content')).toBeAttached({ timeout: 15_000 });
    await expect(page.getByText(/Servicii|Services/i).first()).toBeVisible({ timeout: 30_000 });
  },
  '/contact': async (page: any) => {
    await expect(page.locator('#main-content')).toBeAttached({ timeout: 15_000 });
    await expect(page.getByText(/Contact/i).first()).toBeVisible({ timeout: 30_000 });
  },
};

export async function clickHeaderNav(page: any, href: NavPrimaryDesktopHref): Promise<void> {
  const locator = href.startsWith('#')
    ? page.locator(`header nav a[href="${href}"], header nav a[href$="${href}"]`)
    : page.locator(`header nav a[href$="${href}"]`);
  await clickNavLink(locator);
}

export async function runDesktopNavPrimaryCase(page: any, href: NavPrimaryDesktopHref): Promise<void> {
  await clickHeaderNav(page, href);
  if (href.startsWith('#')) {
    await expect(page).toHaveURL((u: any) => u.hash === href);
  } else {
    await expect(page).toHaveURL((u: any) => stripLocalePrefix(u.pathname).replace(/\/$/, '') === href);
  }
  await desktopAssertByHref[href](page);
}

export const NAV_PRIMARY_DESKTOP_E2E = [
  { navKey: 'home', href: '#hero' as const },
  { navKey: 'portfolio', href: '/proiecte' as const },
  { navKey: 'services', href: '/servicii' as const },
  { navKey: 'contact', href: '/contact' as const },
];
