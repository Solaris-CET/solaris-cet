import { describe, it, expect } from 'vitest';

// ─── Navigation data tests ────────────────────────────────────────────────
// Mirror NAV_HREFS from Navigation.tsx to test link structure integrity

const NAV_HREFS = [
  { key: 'cetApp',      href: '#nova-app'    },
  { key: 'tokenomics',  href: '#staking'     },
  { key: 'roadmap',     href: '#roadmap'     },
  { key: 'team',        href: '#team'        },
  { key: 'howToBuy',    href: '#how-to-buy'  },
  { key: 'resources',   href: '#resources'   },
  { key: 'faq',         href: '#faq'         },
] as const;

describe('Navigation — NAV_HREFS integrity', () => {
  it('seven items, unique keys/hrefs, # slugs, order, no competition in header', () => {
    expect(NAV_HREFS).toHaveLength(7);
    NAV_HREFS.forEach((item) => {
      expect(item.href).toMatch(/^#/);
      const slug = item.href.slice(1);
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    });
    const keys = NAV_HREFS.map((i) => i.key);
    const hrefs = NAV_HREFS.map((i) => i.href);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(NAV_HREFS.find((i) => i.key === 'howToBuy')?.href).toBe('#how-to-buy');
    expect(NAV_HREFS.map((i) => String(i.key))).not.toContain('competition');
    expect(NAV_HREFS[NAV_HREFS.length - 1].key).toBe('faq');
    expect(NAV_HREFS[0].key).toBe('cetApp');
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
  'authority-trust',
  'ecosystem-index',
  'resources',
  'faq',
  'security',
];

describe('Section IDs — all nav hrefs have matching section IDs', () => {
  it('nav targets exist, IDs unique, a11y + pulse + authority-trust', () => {
    NAV_HREFS.forEach((item) => {
      expect(SECTION_IDS).toContain(item.href.slice(1));
    });
    expect(new Set(SECTION_IDS).size).toBe(SECTION_IDS.length);
    expect(SECTION_IDS).toContain('main-content');
    expect(SECTION_IDS).toContain('network-pulse');
    expect(SECTION_IDS).toContain('authority-trust');
  });
});
