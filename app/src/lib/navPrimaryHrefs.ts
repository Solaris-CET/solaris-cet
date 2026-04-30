/**
 * Primary landing IA — flat header list (desktop + mobile sheet).
 * Target ~5–7 items; `#competition` is linked from footer/FAQ, not duplicated here.
 * Each `navKey` must exist on `Translations['nav']` (see `translations.test.ts`).
 */
export const NAV_PRIMARY_IN_PAGE = [
  { navKey: 'tokenomics', href: '#staking' },
  { navKey: 'cetuia', href: '/cetuia' },
  { navKey: 'rwa', href: '/rwa' },
  { navKey: 'cetAi', href: '/cet-ai' },
  { navKey: 'whitepaper', href: '/whitepaper' },
  { navKey: 'howToBuy', href: '#how-to-buy' },
  { navKey: 'faq', href: '#faq' },
] as const;

export type NavPrimaryInPageKey = (typeof NAV_PRIMARY_IN_PAGE)[number]['navKey'];
