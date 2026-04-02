import { describe, it, expect } from 'vitest';

const NAV_HREFS = [
  { key: 'cetApp',      href: '#nova-app'    },
  { key: 'tokenomics',  href: '#staking'     },
  { key: 'roadmap',     href: '#roadmap'     },
  { key: 'team',        href: '#team'        },
  { key: 'howToBuy',    href: '#how-to-buy'  },
  { key: 'resources',   href: '#resources'   },
  { key: 'faq',         href: '#faq'         },
] as const;

const SECTION_IDS = [
  'main-content',
  'nova-app',
  'staking',
  'roadmap',
  'team',
  'competition',
  'network-pulse',
  'how-to-buy',
  'stats',
  'authority-trust',
  'ecosystem-index',
  'resources',
  'faq',
  'security',
];

describe('Navigation + section IDs', () => {
  it('NAV_HREFS integrity and every href maps to a section id', () => {
    expect(NAV_HREFS).toHaveLength(7);
    NAV_HREFS.forEach((item) => {
      expect(item.href).toMatch(/^#/);
      expect(item.href.slice(1)).toMatch(/^[a-z0-9-]+$/);
    });
    const keys = NAV_HREFS.map((i) => i.key);
    const hrefs = NAV_HREFS.map((i) => i.href);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(NAV_HREFS.find((i) => i.key === 'howToBuy')?.href).toBe('#how-to-buy');
    expect(NAV_HREFS.map((i) => String(i.key))).not.toContain('competition');
    expect(NAV_HREFS[NAV_HREFS.length - 1].key).toBe('faq');
    expect(NAV_HREFS[0].key).toBe('cetApp');

    NAV_HREFS.forEach((item) => {
      expect(SECTION_IDS).toContain(item.href.slice(1));
    });
    expect(new Set(SECTION_IDS).size).toBe(SECTION_IDS.length);
    expect(SECTION_IDS).toContain('main-content');
    expect(SECTION_IDS).toContain('network-pulse');
    expect(SECTION_IDS).toContain('authority-trust');
  });
});
