import { describe, it, expect } from 'vitest';
import { calculateRewards, type MiningInput } from '../lib/mining-math';

describe('calculateRewards', () => {
  it('output shape and finite values', () => {
    const a = calculateRewards({ adjustedHashrate: 1, stake: 0 });
    expect(a).toHaveProperty('daily');
    expect(a).toHaveProperty('monthly');
    expect(a).toHaveProperty('apy');
    const b = calculateRewards({ adjustedHashrate: 5, stake: 1000 });
    expect(Number.isFinite(b.daily)).toBe(true);
    expect(Number.isFinite(b.monthly)).toBe(true);
    expect(Number.isFinite(b.apy)).toBe(true);
  });

  it('zero hashrate and stake: zero rewards, 15% base APY', () => {
    const z = calculateRewards({ adjustedHashrate: 0, stake: 0 });
    expect(z.daily).toBe(0);
    expect(z.monthly).toBe(0);
    expect(z.apy).toBe(15);
  });

  it('hashrate scaling and monotonic daily', () => {
    const r1 = calculateRewards({ adjustedHashrate: 1, stake: 0 });
    const r2 = calculateRewards({ adjustedHashrate: 2, stake: 0 });
    expect(r2.daily / r1.daily).toBeCloseTo(2, 1);
    const r10 = calculateRewards({ adjustedHashrate: 10, stake: 0 });
    expect(r10.monthly).toBeCloseTo(r10.daily * 30, 1);
    const inputs: MiningInput[] = [
      { adjustedHashrate: 0.5, stake: 0 },
      { adjustedHashrate: 2.5, stake: 0 },
      { adjustedHashrate: 8.0, stake: 0 },
      { adjustedHashrate: 50.0, stake: 0 },
    ];
    const dailies = inputs.map((i) => calculateRewards(i).daily);
    for (let i = 1; i < dailies.length; i++) {
      expect(dailies[i]).toBeGreaterThan(dailies[i - 1]);
    }
  });

  it('stake multiplier and APY bump per 1k stake', () => {
    const base = calculateRewards({ adjustedHashrate: 1, stake: 0 });
    const staked1k = calculateRewards({ adjustedHashrate: 1, stake: 1000 });
    const maxStake = calculateRewards({ adjustedHashrate: 1, stake: 10_000 });
    expect(staked1k.daily).toBeGreaterThan(base.daily);
    expect(maxStake.daily / base.daily).toBeCloseTo(2, 1);
    const staked5k = calculateRewards({ adjustedHashrate: 1, stake: 5_000 });
    expect(staked5k.apy).toBeGreaterThan(base.apy);
    const z = calculateRewards({ adjustedHashrate: 0, stake: 0 });
    const stake1k = calculateRewards({ adjustedHashrate: 0, stake: 1_000 });
    expect(stake1k.apy - z.apy).toBeCloseTo(1.0, 1);
  });

  it('APY: +0.1% per 1 TH/s, positive for sample cases', () => {
    const base = calculateRewards({ adjustedHashrate: 0, stake: 0 });
    expect(base.apy).toBe(15);
    const withHash = calculateRewards({ adjustedHashrate: 1, stake: 0 });
    expect(withHash.apy - base.apy).toBeCloseTo(0.1, 1);
    const cases: MiningInput[] = [
      { adjustedHashrate: 0, stake: 0 },
      { adjustedHashrate: 50, stake: 0 },
      { adjustedHashrate: 0, stake: 10_000 },
      { adjustedHashrate: 50, stake: 10_000 },
    ];
    cases.forEach((c) => {
      expect(calculateRewards(c).apy).toBeGreaterThan(0);
    });
  });

  it('rounding: daily ≤4, monthly ≤2, apy ≤1 decimal places', () => {
    const d = calculateRewards({ adjustedHashrate: 1.3, stake: 500 });
    expect((d.daily.toString().split('.')[1] ?? '').length).toBeLessThanOrEqual(4);
    const m = calculateRewards({ adjustedHashrate: 2.7, stake: 250 });
    expect((m.monthly.toString().split('.')[1] ?? '').length).toBeLessThanOrEqual(2);
    const ap = calculateRewards({ adjustedHashrate: 3.3, stake: 700 });
    expect((ap.apy.toString().split('.')[1] ?? '').length).toBeLessThanOrEqual(1);
  });

  it('device profiles: positive rewards, node ≫ phone', () => {
    const profiles = [
      { device: 'smartphone', hashrate: 0.5 * 0.8, stake: 0 },
      { device: 'laptop', hashrate: 2.5 * 0.9, stake: 0 },
      { device: 'desktop', hashrate: 8.0 * 1.0, stake: 0 },
      { device: 'node', hashrate: 50.0 * 1.2, stake: 0 },
    ];
    profiles.forEach(({ device, hashrate, stake }) => {
      const result = calculateRewards({ adjustedHashrate: hashrate, stake });
      expect(result.daily, `${device} daily should be > 0`).toBeGreaterThan(0);
    });
    const phone = calculateRewards({ adjustedHashrate: 0.5 * 0.8, stake: 0 });
    const node = calculateRewards({ adjustedHashrate: 50.0 * 1.2, stake: 0 });
    expect(node.daily / phone.daily).toBeGreaterThan(100);
  });
});
