import { describe, expect, it } from 'vitest';

import {
  TOKENOMICS_ALLOCATION,
  TOKENOMICS_BURNED_PCT,
  TOKENOMICS_HOLDERS,
  TOKENOMICS_TOTAL_SUPPLY_CET,
  tokenomicsAmountForPct,
  tokenomicsTextByLang,
} from './tokenomics';

describe('tokenomics data', () => {
  it('distribution sums to 100%', () => {
    const total = TOKENOMICS_ALLOCATION.reduce((acc, d) => acc + d.pct, 0);
    expect(total).toBe(100);
  });

  it('amounts sum to total supply', () => {
    const total = TOKENOMICS_ALLOCATION.reduce(
      (acc, d) => acc + tokenomicsAmountForPct(TOKENOMICS_TOTAL_SUPPLY_CET, d.pct),
      0,
    );
    expect(total).toBe(TOKENOMICS_TOTAL_SUPPLY_CET);
  });

  it('selects Romanian text when lang is ro', () => {
    expect(tokenomicsTextByLang('ro', { en: 'A', ro: 'B' })).toBe('B');
    expect(tokenomicsTextByLang('en', { en: 'A', ro: 'B' })).toBe('A');
  });

  it('has numeric KPI placeholders', () => {
    expect(typeof TOKENOMICS_BURNED_PCT).toBe('number');
    expect(typeof TOKENOMICS_HOLDERS).toBe('number');
  });
});

