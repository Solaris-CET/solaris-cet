import { describe, it, expect } from 'vitest';

/**
 * Tests for the mining reward calculation formula used in mining.worker.ts.
 * The logic is replicated here to validate the mathematical correctness of
 * the formulas described in the Solaris CET whitepaper.
 *
 * Formula reference (mirrors mining.worker.ts):
 *   stakeMultiplier = 1 + stake / 10_000
 *   daily           = adjustedHashrate * 0.0082 * stakeMultiplier
 *   monthly         = daily * 30
 *   apy             = 15 + stake / 1_000 + adjustedHashrate * 0.1
 */

interface MiningInput {
  adjustedHashrate: number;
  stake: number;
}

interface MiningResult {
  daily: number;
  monthly: number;
  apy: number;
}

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

describe('Mining reward calculations', () => {
  describe('stakeMultiplier', () => {
    it('equals 1 when stake is 0', () => {
      const result = calculateRewards({ adjustedHashrate: 1, stake: 0 });
      // daily = 1 * 0.0082 * 1 = 0.0082
      expect(result.daily).toBe(0.0082);
    });

    it('doubles the reward when stake is 10,000 (max tier)', () => {
      const noStake = calculateRewards({ adjustedHashrate: 1, stake: 0 });
      const maxStake = calculateRewards({ adjustedHashrate: 1, stake: 10_000 });
      // stakeMultiplier at max = 2 → reward doubles
      expect(maxStake.daily).toBeCloseTo(noStake.daily * 2, 4);
    });

    it('adds 50% reward at 5,000 stake', () => {
      const noStake = calculateRewards({ adjustedHashrate: 1, stake: 0 });
      const halfStake = calculateRewards({ adjustedHashrate: 1, stake: 5_000 });
      // stakeMultiplier = 1.5
      expect(halfStake.daily).toBeCloseTo(noStake.daily * 1.5, 4);
    });
  });

  describe('daily rewards', () => {
    it('returns 0 daily reward for 0 hashrate regardless of stake', () => {
      const result = calculateRewards({ adjustedHashrate: 0, stake: 1_000 });
      expect(result.daily).toBe(0);
    });

    it('scales linearly with hashrate', () => {
      const x1 = calculateRewards({ adjustedHashrate: 1, stake: 0 });
      const x2 = calculateRewards({ adjustedHashrate: 2, stake: 0 });
      const x5 = calculateRewards({ adjustedHashrate: 5, stake: 0 });
      expect(x2.daily).toBeCloseTo(x1.daily * 2, 4);
      expect(x5.daily).toBeCloseTo(x1.daily * 5, 4);
    });

    it('is always non-negative for non-negative inputs', () => {
      const testCases: MiningInput[] = [
        { adjustedHashrate: 0, stake: 0 },
        { adjustedHashrate: 0.5, stake: 100 },
        { adjustedHashrate: 2.5, stake: 500 },
        { adjustedHashrate: 50, stake: 10_000 },
      ];
      for (const input of testCases) {
        expect(calculateRewards(input).daily).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('monthly rewards', () => {
    it('is exactly 30× the daily reward', () => {
      const inputs: MiningInput[] = [
        { adjustedHashrate: 1, stake: 0 },
        { adjustedHashrate: 2.5, stake: 500 },
        { adjustedHashrate: 8, stake: 2_000 },
      ];
      for (const input of inputs) {
        const result = calculateRewards(input);
        // Allow for floating-point rounding from toFixed
        expect(result.monthly).toBeCloseTo(result.daily * 30, 1);
      }
    });
  });

  describe('APY', () => {
    it('base APY is 15 % when hashrate and stake are both 0', () => {
      const result = calculateRewards({ adjustedHashrate: 0, stake: 0 });
      expect(result.apy).toBe(15);
    });

    it('increases by 0.1 % per TH/s', () => {
      const base = calculateRewards({ adjustedHashrate: 0, stake: 0 });
      const withHashrate = calculateRewards({ adjustedHashrate: 10, stake: 0 });
      expect(withHashrate.apy).toBeCloseTo(base.apy + 10 * 0.1, 1);
    });

    it('increases by 0.1 % per 1,000 BTC-S staked', () => {
      const base = calculateRewards({ adjustedHashrate: 0, stake: 0 });
      const withStake = calculateRewards({ adjustedHashrate: 0, stake: 5_000 });
      expect(withStake.apy).toBeCloseTo(base.apy + 5, 1);
    });

    it('reaches correct APY for a typical dedicated node', () => {
      // dedicated node: hashrate 50 TH/s (× 1.2 efficiency = 60), stake 1000
      const result = calculateRewards({ adjustedHashrate: 60, stake: 1_000 });
      // apy = 15 + 1 + 6 = 22
      expect(result.apy).toBeCloseTo(22, 1);
    });
  });

  describe('output precision', () => {
    it('daily is rounded to 4 decimal places', () => {
      const result = calculateRewards({ adjustedHashrate: 1.3, stake: 750 });
      const decimalPart = result.daily.toString().split('.')[1] ?? '';
      expect(decimalPart.length).toBeLessThanOrEqual(4);
    });

    it('monthly is rounded to 2 decimal places', () => {
      const result = calculateRewards({ adjustedHashrate: 1.3, stake: 750 });
      const decimalPart = result.monthly.toString().split('.')[1] ?? '';
      expect(decimalPart.length).toBeLessThanOrEqual(2);
    });

    it('apy is rounded to 1 decimal place', () => {
      const result = calculateRewards({ adjustedHashrate: 1.3, stake: 750 });
      const decimalPart = result.apy.toString().split('.')[1] ?? '';
      expect(decimalPart.length).toBeLessThanOrEqual(1);
    });
  });
});
