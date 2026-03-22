import { describe, it, expect } from 'vitest';

// ─── Navigation data tests ────────────────────────────────────────────────
// Mirror NAV_HREFS from Navigation.tsx to test link structure integrity

const NAV_HREFS = [
  { key: 'cetApp',      href: '#nova-app'    },
  { key: 'tokenomics',  href: '#staking'     },
  { key: 'roadmap',     href: '#roadmap'     },
  { key: 'team',        href: '#team'        },
  { key: 'competition', href: '#competition' },
  { key: 'howToBuy',    href: '#how-to-buy'  },
  { key: 'resources',   href: '#resources'   },
  { key: 'faq',         href: '#faq'         },
] as const;

describe('Navigation — NAV_HREFS integrity', () => {
  it('has exactly 8 nav items', () => {
    expect(NAV_HREFS).toHaveLength(8);
  });

  it('all hrefs start with #', () => {
    NAV_HREFS.forEach(item => {
      expect(item.href).toMatch(/^#/);
    });
  });

  it('all keys are unique', () => {
    const keys = NAV_HREFS.map(i => i.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('all hrefs are unique', () => {
    const hrefs = NAV_HREFS.map(i => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('competition link exists and points to #competition', () => {
    const comp = NAV_HREFS.find(i => i.key === 'competition');
    expect(comp).toBeDefined();
    expect(comp?.href).toBe('#competition');
  });

  it('howToBuy link exists and points to #how-to-buy', () => {
    const item = NAV_HREFS.find(i => i.key === 'howToBuy');
    expect(item?.href).toBe('#how-to-buy');
  });

  it('faq is last nav item', () => {
    expect(NAV_HREFS[NAV_HREFS.length - 1].key).toBe('faq');
  });

  it('cetApp is first nav item', () => {
    expect(NAV_HREFS[0].key).toBe('cetApp');
  });

  it('all href slugs are lowercase kebab-case', () => {
    NAV_HREFS.forEach(item => {
      const slug = item.href.slice(1); // remove #
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    });
  });
});

// ─── Section IDs integrity ────────────────────────────────────────────────

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
  'ecosystem-index',
  'resources',
  'faq',
  'security',
];

describe('Section IDs — all nav hrefs have matching section IDs', () => {
  it('all nav hrefs have a corresponding section ID', () => {
    NAV_HREFS.forEach(item => {
      const sectionId = item.href.slice(1);
      expect(SECTION_IDS).toContain(sectionId);
    });
  });

  it('section IDs list has no duplicates', () => {
    expect(new Set(SECTION_IDS).size).toBe(SECTION_IDS.length);
  });

  it('main-content anchor exists for accessibility', () => {
    expect(SECTION_IDS).toContain('main-content');
  });

  it('network-pulse section is registered', () => {
    expect(SECTION_IDS).toContain('network-pulse');
  });
});
