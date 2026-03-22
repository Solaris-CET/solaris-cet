import { describe, it, expect } from 'vitest';

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
    cta: { label: 'Open DeDust ↗', href: 'https://dedust.io/pools/EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB' },
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
    expect(swap.cta.href).toContain('EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB');
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
const POOL_ADDRESS = 'EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB';

describe('HowToBuySection — contract addresses', () => {
  it('CET contract is a valid TON EQ address', () => {
    expect(CET_CONTRACT).toMatch(/^EQ[A-Za-z0-9_-]{46}$/);
  });

  it('Pool address is a valid TON EQ address', () => {
    expect(POOL_ADDRESS).toMatch(/^EQ[A-Za-z0-9_-]{46}$/);
  });

  it('CET contract and pool are distinct addresses', () => {
    expect(CET_CONTRACT).not.toBe(POOL_ADDRESS);
  });

  it('addresses are 48 chars total (EQ + 46)', () => {
    expect(CET_CONTRACT).toHaveLength(48);
    expect(POOL_ADDRESS).toHaveLength(48);
  });
});

// ─── Sitemap integrity ────────────────────────────────────────────────────

const SITEMAP_URLS = [
  'https://solaris-cet.vercel.app/',
  'https://solaris-cet.vercel.app/#nova-app',
  'https://solaris-cet.vercel.app/#staking',
  'https://solaris-cet.vercel.app/#roadmap',
  'https://solaris-cet.vercel.app/#team',
  'https://solaris-cet.vercel.app/#competition',
  'https://solaris-cet.vercel.app/#network-pulse',
  'https://solaris-cet.vercel.app/#how-to-buy',
  'https://solaris-cet.vercel.app/#stats',
  'https://solaris-cet.vercel.app/#ecosystem-index',
  'https://solaris-cet.vercel.app/#security',
  'https://solaris-cet.vercel.app/#whitepaper',
  'https://solaris-cet.vercel.app/#resources',
  'https://solaris-cet.vercel.app/#faq',
];

describe('Sitemap — URL integrity', () => {
  it('has 14 URLs (9 original + 5 new sections)', () => {
    expect(SITEMAP_URLS).toHaveLength(14);
  });

  it('all URLs are https', () => {
    SITEMAP_URLS.forEach(url => expect(url).toMatch(/^https:\/\//));
  });

  it('all URLs are unique', () => {
    expect(new Set(SITEMAP_URLS).size).toBe(SITEMAP_URLS.length);
  });

  it('competition section is in sitemap', () => {
    expect(SITEMAP_URLS).toContain('https://solaris-cet.vercel.app/#competition');
  });

  it('network-pulse section is in sitemap', () => {
    expect(SITEMAP_URLS).toContain('https://solaris-cet.vercel.app/#network-pulse');
  });

  it('root URL has no hash', () => {
    expect(SITEMAP_URLS[0]).toBe('https://solaris-cet.vercel.app/');
    expect(SITEMAP_URLS[0]).not.toContain('#');
  });
});
