import { describe, expect, it } from 'vitest';
import { NAV_PRIMARY_IN_PAGE } from '../lib/navPrimaryHrefs';

describe('navPrimaryHrefs', () => {
  it('keeps primary in-page targets', () => {
    expect(NAV_PRIMARY_IN_PAGE).toHaveLength(5);
    const hrefs = NAV_PRIMARY_IN_PAGE.map((e) => e.href);
    expect(new Set(hrefs).size).toBe(5);
  });

  it('uses expected targets for core company sections', () => {
    const hrefByKey = Object.fromEntries(NAV_PRIMARY_IN_PAGE.map((e) => [e.navKey, e.href]));
    expect(hrefByKey.home).toBe('/');
    expect(hrefByKey.services).toBe('/services');
    expect(hrefByKey.contact).toBe('/contact');
  });
});
