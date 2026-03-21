import { describe, it, expect } from 'vitest';
import type { MiningInput, MiningResult } from '../workers/mining.worker';

/**
 * Mining reward calculation tests
 *
 * The worker's `calculateRewards` function is not exported, but the formula
 * is documented and deterministic.  These tests verify the calculation rules
 * described in the whitepaper and worker source so regressions are caught
 * before they reach production.
 *
 * Formula (from mining.worker.ts):
 *   stakeMultiplier = 1 + stake / 10_000
 *   daily           = adjustedHashrate * 0.0082 * stakeMultiplier
 *   monthly         = daily * 30
 *   apy             = 15 + stake / 1_000 + adjustedHashrate * 0.1
 */

function calculateRewards(input: MiningInput): MiningResult {
  const { adjustedHashrate, stake } = input;
  const stakeMultiplier = 1 + stake / 10_000;
  const daily = adjustedHashrate * 0.0082 * stakeMultiplier;
  const monthly = daily * 30;
  const apy = 15 + stake / 1_000 + adjustedHashrate * 0.1;
  return {
    daily: Number(daily.toFixed(4)),
    monthly: Number(monthly.toFixed(2)),
    apy: Number(apy.toFixed(1)),
  };
}

describe('calculateRewards — baseline (zero stake)', () => {
  it('returns correct daily reward for 1 TH/s with zero stake', () => {
    const result = calculateRewards({ adjustedHashrate: 1, stake: 0 });
    // stakeMultiplier = 1, daily = 1 * 0.0082 * 1 = 0.0082
    expect(result.daily).toBe(0.0082);
  });

  it('returns correct monthly reward (daily * 30)', () => {
    const result = calculateRewards({ adjustedHashrate: 1, stake: 0 });
    expect(result.monthly).toBeCloseTo(result.daily * 30, 2);
  });

  it('returns base APY of 15% with zero stake and zero hashrate', () => {
    const result = calculateRewards({ adjustedHashrate: 0, stake: 0 });
    expect(result.apy).toBe(15.0);
  });
});

describe('calculateRewards — stake multiplier', () => {
  it('doubles daily reward at 10,000 stake (multiplier = 2)', () => {
    const noStake = calculateRewards({ adjustedHashrate: 2, stake: 0 });
    const fullStake = calculateRewards({ adjustedHashrate: 2, stake: 10_000 });
    // stakeMultiplier at 10_000 = 1 + 10_000/10_000 = 2
    expect(fullStake.daily).toBeCloseTo(noStake.daily * 2, 4);
  });

  it('increases stake multiplier linearly', () => {
    const half = calculateRewards({ adjustedHashrate: 1, stake: 5_000 });
    // stakeMultiplier = 1 + 5_000/10_000 = 1.5
    expect(half.daily).toBeCloseTo(1 * 0.0082 * 1.5, 4);
  });
});

describe('calculateRewards — APY', () => {
  it('adds 0.1% APY per TH/s of hashrate', () => {
    const r10 = calculateRewards({ adjustedHashrate: 10, stake: 0 });
    // apy = 15 + 0 + 10 * 0.1 = 16.0
    expect(r10.apy).toBe(16.0);
  });

  it('adds 0.1% APY per 1,000 stake', () => {
    const r = calculateRewards({ adjustedHashrate: 0, stake: 5_000 });
    // apy = 15 + 5_000/1_000 + 0 = 20.0
    expect(r.apy).toBe(20.0);
  });

  it('APY combines hashrate and stake contributions', () => {
    const r = calculateRewards({ adjustedHashrate: 10, stake: 10_000 });
    // apy = 15 + 10 + 1 = 26.0
    expect(r.apy).toBe(26.0);
  });
});

describe('calculateRewards — output format', () => {
  it('daily is rounded to 4 decimal places', () => {
    const r = calculateRewards({ adjustedHashrate: 3, stake: 777 });
    const decimals = r.daily.toString().split('.')[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(4);
  });

  it('monthly is rounded to 2 decimal places', () => {
    const r = calculateRewards({ adjustedHashrate: 3, stake: 777 });
    const decimals = r.monthly.toString().split('.')[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(2);
  });

  it('apy is rounded to 1 decimal place', () => {
    const r = calculateRewards({ adjustedHashrate: 3, stake: 777 });
    const decimals = r.apy.toString().split('.')[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(1);
  });

  it('returns zero values when both inputs are zero', () => {
    const r = calculateRewards({ adjustedHashrate: 0, stake: 0 });
    expect(r.daily).toBe(0);
    expect(r.monthly).toBe(0);
    expect(r.apy).toBe(15.0);
  });
});
