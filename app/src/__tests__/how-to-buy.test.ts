import { describe, it, expect } from 'vitest';
import { CET_CONTRACT_ADDRESS as CET_CONTRACT } from '@/lib/cetContract';
import { PRODUCTION_SITE_ORIGIN } from '@/lib/brandAssetFilenames';
import { DEDUST_POOL_ADDRESS, DEDUST_SWAP_URL } from '@/lib/dedustUrls';

const SITE_ROOT = `${PRODUCTION_SITE_ORIGIN}/`;

const HOW_TO_BUY_STEPS = [
  {
    step: '01',
    id: 'wallet',
    title: 'Get a TON Wallet',
    cta: { label: 'Get Tonkeeper ↗', href: 'https://tonkeeper.com' },
  },
  {
    step: '02',
    id: 'ton',
    title: 'Acquire TON',
    cta: { label: 'Buy TON on Bybit ↗', href: 'https://www.bybit.com' },
  },
  {
    step: '03',
    id: 'swap',
    title: 'Swap for CET on DeDust',
    cta: { label: 'Open DeDust ↗', href: DEDUST_SWAP_URL },
  },
];

const SITEMAP_URLS = [
  SITE_ROOT,
  `${PRODUCTION_SITE_ORIGIN}/#nova-app`,
  `${PRODUCTION_SITE_ORIGIN}/#staking`,
  `${PRODUCTION_SITE_ORIGIN}/#roadmap`,
  `${PRODUCTION_SITE_ORIGIN}/#team`,
  `${PRODUCTION_SITE_ORIGIN}/#competition`,
  `${PRODUCTION_SITE_ORIGIN}/#network-pulse`,
  `${PRODUCTION_SITE_ORIGIN}/#how-to-buy`,
  `${PRODUCTION_SITE_ORIGIN}/#stats`,
  `${PRODUCTION_SITE_ORIGIN}/#authority-trust`,
  `${PRODUCTION_SITE_ORIGIN}/#ecosystem-index`,
  `${PRODUCTION_SITE_ORIGIN}/#security`,
  `${PRODUCTION_SITE_ORIGIN}/#whitepaper`,
  `${PRODUCTION_SITE_ORIGIN}/#resources`,
  `${PRODUCTION_SITE_ORIGIN}/#faq`,
];

describe('HowToBuy + sitemap', () => {
  it('steps, CET/pool addresses, canonical URLs', () => {
    expect(HOW_TO_BUY_STEPS).toHaveLength(3);
    expect(HOW_TO_BUY_STEPS.map((s) => s.step)).toEqual(['01', '02', '03']);
    const ids = HOW_TO_BUY_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    HOW_TO_BUY_STEPS.forEach((s) => {
      expect(s.title.length).toBeGreaterThan(5);
      expect(s.cta.href).toMatch(/^https:\/\//);
    });
    const swap = HOW_TO_BUY_STEPS[2];
    expect(swap.cta.href).toBe(DEDUST_SWAP_URL);
    expect(swap.cta.href).toContain(DEDUST_POOL_ADDRESS);
    expect(HOW_TO_BUY_STEPS[0].cta.href).toContain('tonkeeper.com');
    expect(HOW_TO_BUY_STEPS[0].id).toBe('wallet');
    expect(HOW_TO_BUY_STEPS[2].id).toBe('swap');

    expect(CET_CONTRACT).toMatch(/^EQ[A-Za-z0-9_-]{46}$/);
    expect(DEDUST_POOL_ADDRESS).toMatch(/^EQ[A-Za-z0-9_-]{46}$/);
    expect(CET_CONTRACT).not.toBe(DEDUST_POOL_ADDRESS);
    expect(CET_CONTRACT).toHaveLength(48);
    expect(DEDUST_POOL_ADDRESS).toHaveLength(48);

    expect(SITEMAP_URLS).toHaveLength(15);
    expect(new Set(SITEMAP_URLS).size).toBe(SITEMAP_URLS.length);
    SITEMAP_URLS.forEach((url) => expect(url).toMatch(/^https:\/\//));
    expect(SITEMAP_URLS).toContain(`${PRODUCTION_SITE_ORIGIN}/#competition`);
    expect(SITEMAP_URLS).toContain(`${PRODUCTION_SITE_ORIGIN}/#network-pulse`);
    expect(SITEMAP_URLS).toContain(`${PRODUCTION_SITE_ORIGIN}/#authority-trust`);
    expect(SITEMAP_URLS[0]).toBe(SITE_ROOT);
    expect(SITEMAP_URLS[0]).not.toContain('#');
  });
});
