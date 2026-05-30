import { describe, expect, it } from 'vitest';

import { NAV_PRIMARY_IN_PAGE } from '../lib/navPrimaryHrefs';

describe('navPrimaryHrefs', () => {
  it('keeps primary in-page targets', () => {
    expect(NAV_PRIMARY_IN_PAGE).toHaveLength(8);
    const hrefs = NAV_PRIMARY_IN_PAGE.map((e) => e.href);
    expect(new Set(hrefs).size).toBe(8);
  });

  it('uses expected targets for core company sections', () => {
    const hrefByKey = Object.fromEntries(NAV_PRIMARY_IN_PAGE.map((e) => [e.navKey, e.href]));
    expect(hrefByKey.home).toBe('#hero');
    expect(hrefByKey.services).toBe('#servicii');
    expect(hrefByKey.portfolio).toBe('#proiecte');
    expect(hrefByKey.financing).toBe('/finantare');
    expect(hrefByKey.blog).toBe('/blog');
    expect(hrefByKey.about).toBe('/despre');
    expect(hrefByKey.cetToken).toBe('/token-cet');
    expect(hrefByKey.contact).toBe('/contact');
  });
});
