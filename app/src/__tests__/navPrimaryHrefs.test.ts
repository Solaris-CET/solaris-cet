import { describe, expect,it } from 'vitest';

import translations from '@/i18n/translations';
import { NAV_PRIMARY_IN_PAGE } from '@/lib/navPrimaryHrefs';

describe('navPrimaryHrefs', () => {
  it('keeps seven unique in-page targets with labels on every locale', () => {
    expect(NAV_PRIMARY_IN_PAGE).toHaveLength(8);
    const hrefs = NAV_PRIMARY_IN_PAGE.map((e) => e.href);
    expect(new Set(hrefs).size).toBe(8);

    const langs = ['en', 'ro', 'es'] as const;
    for (const lang of langs) {
      const t = translations[lang];
      for (const { navKey } of NAV_PRIMARY_IN_PAGE) {
        expect(t.nav[navKey].trim().length, `${lang}.nav.${navKey}`).toBeGreaterThan(0);
      }
    }
  });

  it('uses expected targets for core conversion sections', () => {
    const hrefByKey = Object.fromEntries(NAV_PRIMARY_IN_PAGE.map((e) => [e.navKey, e.href]));
    expect(hrefByKey.tokenomics).toBe('#staking');
    expect(hrefByKey.rwa).toBe('/rwa');
    expect(hrefByKey.submitTask).toBe('/r2a');
    expect(hrefByKey.cetAi).toBe('/cet-ai');
    expect(hrefByKey.whitepaper).toBe('/whitepaper');
    expect(hrefByKey.faq).toBe('#faq');
  });
});
