/**
 * Primary landing IA — flat header list (desktop + mobile sheet).
 * Target ~5–7 items; `#competition` is linked from footer/FAQ, not duplicated here.
 * Each `navKey` must exist on `Translations['nav']` (see `translations.test.ts`).
 */
export const NAV_PRIMARY_IN_PAGE = [
  { navKey: 'home', href: '#hero' },
  { navKey: 'services', href: '#servicii' },
  { navKey: 'portfolio', href: '#proiecte' },
  { navKey: 'financing', href: '/finantare' },
  { navKey: 'blog', href: '/blog' },
  { navKey: 'about', href: '/despre' },
  { navKey: 'cetToken', href: '/token-cet' },
  { navKey: 'contact', href: '/contact' },
] as const;

export type NavPrimaryInPageKey = (typeof NAV_PRIMARY_IN_PAGE)[number]['navKey'];
