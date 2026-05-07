import { expect } from '@playwright/test';

import { URL_LOCALES } from '../src/i18n/urlRouting';
import { NAV_PRIMARY_IN_PAGE } from '../src/lib/navPrimaryHrefs';
import { scrollUntilSelectorAttached } from './e2e-helpers';

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
  '#staking': async (page) => {
    const staking = page.locator('#staking');
    await expect(staking).toBeAttached({ timeout: 15_000 });
    await staking.scrollIntoViewIfNeeded();
    await expect(staking.getByText('9,000').first()).toBeVisible({ timeout: 10_000 });
  },
  '/rwa': async (page) => {
    await scrollUntilSelectorAttached(page, '#rwa');
    await expect(page.locator('#rwa')).toBeAttached({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /Virtual Agricultural Land/i }).first()).toBeVisible({ timeout: 30_000 });
  },
  '/cet-ai': async (page) => {
    await scrollUntilSelectorAttached(page, '#cet-ai');
    await expect(page.getByTestId('cet-ai-hero')).toBeVisible({ timeout: 15_000 });
  },
  '/r2a': async (page) => {
    await expect(page.locator('#main-content')).toBeAttached({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /Submit Task/i }).first()).toBeVisible({ timeout: 30_000 });
  },
  '/whitepaper': async (page) => {
    await expect(page.locator('#main-content')).toBeAttached({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /Whitepaper/i }).first()).toBeVisible({ timeout: 30_000 });
  },
  '/cetuia': async (page) => {
    await expect(page.getByTestId('cetuia-map-section')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('cetuia-hex-map')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('cetuia-map-controls')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Zoom out' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Reset view' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('cetuia-loading')).toBeHidden({ timeout: 15_000 });

    const counts = page.getByTestId('cetuia-token-counts');
    await expect(counts).toBeVisible({ timeout: 15_000 });
    await expect(counts).toContainText(/8[\s\u00A0,.]?998\s*\/\s*1\s*\/\s*1/);

    const interaction = page.getByTestId('cetuia-map-interaction');
    await expect(interaction).toBeVisible({ timeout: 15_000 });
    const box = await interaction.boundingBox();
    if (!box) throw new Error('cetuia-map-interaction boundingBox is null');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    const selectedToken = page.getByTestId('cetuia-selected-token');
    await expect(selectedToken).toContainText(/^#\d+$/, { timeout: 15_000 });
    const tokenText = (await selectedToken.textContent())?.trim() ?? '';
    const match = tokenText.match(/^#(\d+)$/);
    if (!match) throw new Error(`Unexpected cetuia-selected-token: ${tokenText}`);
    const status = page.getByTestId('cetuia-selected-status');
    await expect(status).toContainText(/REZERVAT|VÂNDUT|DISPONIBIL|RESERVED|SOLD|AVAILABLE/i, { timeout: 15_000 });
  },
  '#how-to-buy': async (page) => {
    await scrollUntilSelectorAttached(page, '#how-to-buy');
    await page.locator('#how-to-buy').scrollIntoViewIfNeeded();
    await expect(page.locator('#how-to-buy').getByText('HOW TO BUY')).toBeVisible({
      timeout: 15_000,
    });
  },
  '#faq': async (page) => {
    const faq = page.locator('#faq');
    await expect(faq).toBeAttached({ timeout: 15_000 });
    await faq.scrollIntoViewIfNeeded();
    await expect(page.locator('#faq .faq-trigger').first()).toBeVisible({ timeout: 15_000 });
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
