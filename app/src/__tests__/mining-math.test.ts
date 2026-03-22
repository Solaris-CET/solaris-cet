import { describe, it, expect } from 'vitest';
import { calculateRewards, type MiningInput } from '../lib/mining-math';

// ─── calculateRewards ────────────────────────────────────────────────────

describe('calculateRewards — basic output shape', () => {
  it('returns daily, monthly, and apy fields', () => {
    const result = calculateRewards({ adjustedHashrate: 1, stake: 0 });
    expect(result).toHaveProperty('daily');
    expect(result).toHaveProperty('monthly');
    expect(result).toHaveProperty('apy');
  });

  it('all values are finite numbers', () => {
    const result = calculateRewards({ adjustedHashrate: 5, stake: 1000 });
    expect(Number.isFinite(result.daily)).toBe(true);
    expect(Number.isFinite(result.monthly)).toBe(true);
    expect(Number.isFinite(result.apy)).toBe(true);
  });
});

describe('calculateRewards — zero inputs', () => {
  it('returns zero daily and monthly for zero hashrate and zero stake', () => {
    const result = calculateRewards({ adjustedHashrate: 0, stake: 0 });
    expect(result.daily).toBe(0);
    expect(result.monthly).toBe(0);
  });

  it('returns base APY of 15% for zero hashrate and zero stake', () => {
    const result = calculateRewards({ adjustedHashrate: 0, stake: 0 });
    expect(result.apy).toBe(15);
  });
});

describe('calculateRewards — hashrate scaling', () => {
  it('daily reward scales linearly with hashrate (zero stake)', () => {
    const r1 = calculateRewards({ adjustedHashrate: 1, stake: 0 });
    const r2 = calculateRewards({ adjustedHashrate: 2, stake: 0 });
    expect(r2.daily / r1.daily).toBeCloseTo(2, 1);
  });

  it('monthly is approximately 30× daily', () => {
    const result = calculateRewards({ adjustedHashrate: 10, stake: 0 });
    expect(result.monthly).toBeCloseTo(result.daily * 30, 1);
  });

  it('higher hashrate always yields more daily rewards', () => {
    const inputs: MiningInput[] = [
      { adjustedHashrate: 0.5, stake: 0 },
      { adjustedHashrate: 2.5, stake: 0 },
      { adjustedHashrate: 8.0, stake: 0 },
      { adjustedHashrate: 50.0, stake: 0 },
    ];
    const dailies = inputs.map(i => calculateRewards(i).daily);
    for (let i = 1; i < dailies.length; i++) {
      expect(dailies[i]).toBeGreaterThan(dailies[i - 1]);
    }
  });
});

describe('calculateRewards — stake multiplier', () => {
  it('stake increases daily rewards above zero-stake baseline', () => {
    const base = calculateRewards({ adjustedHashrate: 1, stake: 0 });
    const staked = calculateRewards({ adjustedHashrate: 1, stake: 1000 });
    expect(staked.daily).toBeGreaterThan(base.daily);
  });

  it('stake of 10,000 doubles the daily reward (2× multiplier)', () => {
    const base = calculateRewards({ adjustedHashrate: 1, stake: 0 });
    const maxStake = calculateRewards({ adjustedHashrate: 1, stake: 10_000 });
    expect(maxStake.daily / base.daily).toBeCloseTo(2, 1);
  });

  it('stake increases APY', () => {
    const base = calculateRewards({ adjustedHashrate: 1, stake: 0 });
    const staked = calculateRewards({ adjustedHashrate: 1, stake: 5_000 });
    expect(staked.apy).toBeGreaterThan(base.apy);
  });

  it('each 1,000 BTC-S stake adds 1.0% APY', () => {
    const base = calculateRewards({ adjustedHashrate: 0, stake: 0 });
    const staked = calculateRewards({ adjustedHashrate: 0, stake: 1_000 });
    expect(staked.apy - base.apy).toBeCloseTo(1.0, 1);
  });
});

describe('calculateRewards — APY formula', () => {
  it('base APY is 15% with no hashrate or stake', () => {
    const result = calculateRewards({ adjustedHashrate: 0, stake: 0 });
    expect(result.apy).toBe(15);
  });

  it('each 1 TH/s adds 0.1% APY', () => {
    const base = calculateRewards({ adjustedHashrate: 0, stake: 0 });
    const withHash = calculateRewards({ adjustedHashrate: 1, stake: 0 });
    expect(withHash.apy - base.apy).toBeCloseTo(0.1, 1);
  });

  it('APY is always positive for valid inputs', () => {
    const cases: MiningInput[] = [
      { adjustedHashrate: 0,  stake: 0    },
      { adjustedHashrate: 50, stake: 0    },
      { adjustedHashrate: 0,  stake: 10_000 },
      { adjustedHashrate: 50, stake: 10_000 },
    ];
    cases.forEach(c => {
      expect(calculateRewards(c).apy).toBeGreaterThan(0);
    });
  });
});

describe('calculateRewards — numeric precision', () => {
  it('daily is rounded to 4 decimal places', () => {
    const result = calculateRewards({ adjustedHashrate: 1.3, stake: 500 });
    const decimalPart = result.daily.toString().split('.')[1] ?? '';
    expect(decimalPart.length).toBeLessThanOrEqual(4);
  });

  it('monthly is rounded to 2 decimal places', () => {
    const result = calculateRewards({ adjustedHashrate: 2.7, stake: 250 });
    const decimalPart = result.monthly.toString().split('.')[1] ?? '';
    expect(decimalPart.length).toBeLessThanOrEqual(2);
  });

  it('apy is rounded to 1 decimal place', () => {
    const result = calculateRewards({ adjustedHashrate: 3.3, stake: 700 });
    const decimalPart = result.apy.toString().split('.')[1] ?? '';
    expect(decimalPart.length).toBeLessThanOrEqual(1);
  });
});

describe('calculateRewards — device profiles', () => {
  const profiles = [
    { device: 'smartphone', hashrate: 0.5 * 0.8,  stake: 0 },
    { device: 'laptop',     hashrate: 2.5 * 0.9,  stake: 0 },
    { device: 'desktop',    hashrate: 8.0 * 1.0,  stake: 0 },
    { device: 'node',       hashrate: 50.0 * 1.2, stake: 0 },
  ];

  it('all device profiles produce positive rewards', () => {
    profiles.forEach(({ device, hashrate, stake }) => {
      const result = calculateRewards({ adjustedHashrate: hashrate, stake });
      expect(result.daily, `${device} daily should be > 0`).toBeGreaterThan(0);
    });
  });

  it('dedicated node outperforms smartphone by > 100×', () => {
    const phone = calculateRewards({ adjustedHashrate: 0.5 * 0.8, stake: 0 });
    const node  = calculateRewards({ adjustedHashrate: 50.0 * 1.2, stake: 0 });
    expect(node.daily / phone.daily).toBeGreaterThan(100);
  });
});
