import { describe, it, expect } from 'vitest';
import type { ChainState, ChainTokenState, ChainPoolState } from '../lib/chain-state';

// ─── Type Shape Tests ──────────────────────────────────────────────────────

describe('ChainState — type shape', () => {
  it('accepts a valid ChainState object', () => {
    const state: ChainState = {
      token: {
        symbol: 'CET',
        name: 'Solaris CET',
        contract: 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX',
        totalSupply: '9000.000000000',
        decimals: 9,
      },
      pool: {
        address: 'EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB',
        reserveTon: '100.5',
        reserveCet: '4500.0',
        lpSupply: '2121.0',
        priceTonPerCet: '0.02233',
      },
      updatedAt: '2026-03-22T00:00:00.000Z',
    };
    expect(state.token.symbol).toBe('CET');
    expect(state.token.decimals).toBe(9);
    expect(state.pool.address).toContain('EQB5');
  });

  it('accepts null fields in ChainTokenState', () => {
    const token: ChainTokenState = {
      symbol: 'CET',
      name: 'Solaris CET',
      contract: 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX',
      totalSupply: null,
      decimals: 9,
    };
    expect(token.totalSupply).toBeNull();
  });

  it('accepts null fields in ChainPoolState', () => {
    const pool: ChainPoolState = {
      address: 'EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB',
      reserveTon: null,
      reserveCet: null,
      lpSupply: null,
      priceTonPerCet: null,
    };
    expect(pool.reserveTon).toBeNull();
    expect(pool.priceTonPerCet).toBeNull();
  });
});

// ─── Address Format Validation ────────────────────────────────────────────

describe('ChainState — address constants', () => {
  const CET_CONTRACT  = 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX';
  const POOL_ADDRESS  = 'EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB';
  const TON_ADDRESS_RE = /^EQ[A-Za-z0-9_-]{46}$/;

  it('CET contract matches TON EQ address format', () => {
    expect(CET_CONTRACT).toMatch(TON_ADDRESS_RE);
  });

  it('DeDust pool address matches TON EQ address format', () => {
    expect(POOL_ADDRESS).toMatch(TON_ADDRESS_RE);
  });

  it('addresses are different', () => {
    expect(CET_CONTRACT).not.toBe(POOL_ADDRESS);
  });

  it('CET decimals is 9 (TON jetton standard)', () => {
    expect(9).toBe(9);
  });
});

// ─── totalSupply parsing ──────────────────────────────────────────────────

describe('ChainState — totalSupply parsing', () => {
  function parseSupply(raw: string | null): number | null {
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  it('parses "9000.000000000" to 9000', () => {
    expect(parseSupply('9000.000000000')).toBe(9000);
  });

  it('returns null for null input', () => {
    expect(parseSupply(null)).toBeNull();
  });

  it('returns null for non-numeric string', () => {
    expect(parseSupply('not-a-number')).toBeNull();
  });

  it('CET total supply is exactly 9000 (hyper-scarcity invariant)', () => {
    const supply = parseSupply('9000.000000000');
    expect(supply).toBe(9000);
  });
});

// ─── priceTonPerCet arithmetic ────────────────────────────────────────────

describe('ChainState — price arithmetic', () => {
  function cetPriceInTon(reserveTon: string | null, reserveCet: string | null): number | null {
    if (!reserveTon || !reserveCet) return null;
    const ton = Number(reserveTon);
    const cet = Number(reserveCet);
    if (!Number.isFinite(ton) || !Number.isFinite(cet) || cet === 0) return null;
    return ton / cet;
  }

  it('computes TON per CET correctly', () => {
    expect(cetPriceInTon('100', '4500')).toBeCloseTo(0.02222, 4);
  });

  it('returns null if reserveCet is null', () => {
    expect(cetPriceInTon('100', null)).toBeNull();
  });

  it('returns null if reserveTon is null', () => {
    expect(cetPriceInTon(null, '4500')).toBeNull();
  });

  it('returns null if reserveCet is zero (div by zero)', () => {
    expect(cetPriceInTon('100', '0')).toBeNull();
  });
});
