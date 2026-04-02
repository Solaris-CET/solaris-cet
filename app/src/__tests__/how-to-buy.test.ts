import { describe, it, expect } from 'vitest';
import { CET_CONTRACT_ADDRESS as CET_CONTRACT } from '@/lib/cetContract';
import { DEDUST_POOL_ADDRESS, DEDUST_SWAP_URL } from '@/lib/dedustUrls';

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
  'https://solaris-cet.com/',
  'https://solaris-cet.com/#nova-app',
  'https://solaris-cet.com/#staking',
  'https://solaris-cet.com/#roadmap',
  'https://solaris-cet.com/#team',
  'https://solaris-cet.com/#competition',
  'https://solaris-cet.com/#network-pulse',
  'https://solaris-cet.com/#how-to-buy',
  'https://solaris-cet.com/#stats',
  'https://solaris-cet.com/#authority-trust',
  'https://solaris-cet.com/#ecosystem-index',
  'https://solaris-cet.com/#security',
  'https://solaris-cet.com/#whitepaper',
  'https://solaris-cet.com/#resources',
  'https://solaris-cet.com/#faq',
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
    expect(SITEMAP_URLS).toContain('https://solaris-cet.com/#competition');
    expect(SITEMAP_URLS).toContain('https://solaris-cet.com/#network-pulse');
    expect(SITEMAP_URLS).toContain('https://solaris-cet.com/#authority-trust');
    expect(SITEMAP_URLS[0]).toBe('https://solaris-cet.com/');
    expect(SITEMAP_URLS[0]).not.toContain('#');
  });
});
