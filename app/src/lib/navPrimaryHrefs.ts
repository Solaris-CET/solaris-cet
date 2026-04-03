/**
 * Primary landing IA — flat header list (desktop + mobile sheet).
 * Target ~5–7 items; `#competition` is linked from footer/FAQ, not duplicated here.
 * Each `navKey` must exist on `Translations['nav']` (see `translations.test.ts`).
 */
export const NAV_PRIMARY_IN_PAGE = [
  { navKey: 'cetApp', href: '#nova-app' },
  { navKey: 'tokenomics', href: '#staking' },
  { navKey: 'roadmap', href: '#roadmap' },
  { navKey: 'team', href: '#team' },
  { navKey: 'howToBuy', href: '#how-to-buy' },
  { navKey: 'resources', href: '#resources' },
  { navKey: 'faq', href: '#faq' },
] as const;

export type NavPrimaryInPageKey = (typeof NAV_PRIMARY_IN_PAGE)[number]['navKey'];
