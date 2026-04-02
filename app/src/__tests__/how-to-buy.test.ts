import { describe, it, expect } from 'vitest';
import { DEDUST_POOL_ADDRESS, DEDUST_SWAP_URL } from '@/lib/dedustUrls';

// ─── HowToBuy steps data ──────────────────────────────────────────────────

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

describe('HowToBuySection — steps integrity', () => {
  it('has exactly 3 steps', () => {
    expect(HOW_TO_BUY_STEPS).toHaveLength(3);
  });

  it('step numbers are sequential 01/02/03', () => {
    const numbers = HOW_TO_BUY_STEPS.map(s => s.step);
    expect(numbers).toEqual(['01', '02', '03']);
  });

  it('all step IDs are unique', () => {
    const ids = HOW_TO_BUY_STEPS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all titles are non-empty', () => {
    HOW_TO_BUY_STEPS.forEach(s => expect(s.title.length).toBeGreaterThan(5));
  });

  it('all CTA hrefs are valid https URLs', () => {
    HOW_TO_BUY_STEPS.forEach(s => {
      expect(s.cta.href).toMatch(/^https:\/\//);
    });
  });

  it('step 03 CTA links to the correct DeDust pool', () => {
    const swap = HOW_TO_BUY_STEPS[2];
    expect(swap.cta.href).toBe(DEDUST_SWAP_URL);
    expect(swap.cta.href).toContain(DEDUST_POOL_ADDRESS);
  });

  it('step 01 CTA links to Tonkeeper', () => {
    const wallet = HOW_TO_BUY_STEPS[0];
    expect(wallet.cta.href).toContain('tonkeeper.com');
  });

  it('first step is about getting a wallet', () => {
    expect(HOW_TO_BUY_STEPS[0].id).toBe('wallet');
  });

  it('last step is about swapping', () => {
    expect(HOW_TO_BUY_STEPS[2].id).toBe('swap');
  });
});

// ─── CET contract address validation ─────────────────────────────────────

const CET_CONTRACT = 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX';

describe('HowToBuySection — contract addresses', () => {
  it('CET contract is a valid TON EQ address', () => {
    expect(CET_CONTRACT).toMatch(/^EQ[A-Za-z0-9_-]{46}$/);
  });

  it('Pool address is a valid TON EQ address', () => {
    expect(DEDUST_POOL_ADDRESS).toMatch(/^EQ[A-Za-z0-9_-]{46}$/);
  });

  it('CET contract and pool are distinct addresses', () => {
    expect(CET_CONTRACT).not.toBe(DEDUST_POOL_ADDRESS);
  });

  it('addresses are 48 chars total (EQ + 46)', () => {
    expect(CET_CONTRACT).toHaveLength(48);
    expect(DEDUST_POOL_ADDRESS).toHaveLength(48);
  });
});

// ─── Sitemap integrity ────────────────────────────────────────────────────

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

describe('Sitemap — URL integrity', () => {
  it('has 15 canonical hash URLs (incl. authority-trust)', () => {
    expect(SITEMAP_URLS).toHaveLength(15);
  });

  it('all URLs are https', () => {
    SITEMAP_URLS.forEach(url => expect(url).toMatch(/^https:\/\//));
  });

  it('all URLs are unique', () => {
    expect(new Set(SITEMAP_URLS).size).toBe(SITEMAP_URLS.length);
  });

  it('competition section is in sitemap', () => {
    expect(SITEMAP_URLS).toContain('https://solaris-cet.com/#competition');
  });

  it('network-pulse section is in sitemap', () => {
    expect(SITEMAP_URLS).toContain('https://solaris-cet.com/#network-pulse');
  });

  it('authority-trust section is in sitemap', () => {
    expect(SITEMAP_URLS).toContain('https://solaris-cet.com/#authority-trust');
  });

  it('root URL has no hash', () => {
    expect(SITEMAP_URLS[0]).toBe('https://solaris-cet.com/');
    expect(SITEMAP_URLS[0]).not.toContain('#');
  });
});
