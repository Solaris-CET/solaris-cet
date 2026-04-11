import { describe, it, expect } from 'vitest';
import { NAV_PRIMARY_IN_PAGE } from '@/lib/navPrimaryHrefs';
import translations from '@/i18n/translations';

describe('navPrimaryHrefs', () => {
  it('keeps seven unique in-page targets with labels on every locale', () => {
    expect(NAV_PRIMARY_IN_PAGE).toHaveLength(7);
    const hrefs = NAV_PRIMARY_IN_PAGE.map((e) => e.href);
    expect(new Set(hrefs).size).toBe(7);

    const langs = ['en', 'ro', 'es', 'zh', 'ru', 'pt', 'de'] as const;
    for (const lang of langs) {
      const t = translations[lang];
      for (const { navKey } of NAV_PRIMARY_IN_PAGE) {
        expect(t.nav[navKey].trim().length, `${lang}.nav.${navKey}`).toBeGreaterThan(0);
      }
    }
  });

  it('uses expected hash targets for core conversion sections', () => {
    const hrefByKey = Object.fromEntries(NAV_PRIMARY_IN_PAGE.map((e) => [e.navKey, e.href]));
    expect(hrefByKey.tokenomics).toBe('#staking');
    expect(hrefByKey.rwa).toBe('#rwa');
    expect(hrefByKey.cetAi).toBe('#cet-ai');
    expect(hrefByKey.whitepaper).toBe('#whitepaper');
    expect(hrefByKey.faq).toBe('#faq');
  });
});
