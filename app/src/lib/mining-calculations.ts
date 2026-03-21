/**
 * mining-calculations.ts
 *
 * Pure calculation functions for the Solaris CET mining reward model.
 * Extracted from `workers/mining.worker.ts` so they can be unit-tested
 * independently and imported from both the worker and any future UI code.
 *
 * All functions are side-effect-free: given the same inputs, they always
 * return the same outputs, making them trivially testable.
 */

export interface MiningInput {
  /** Effective hashrate in TH/s (already adjusted for device efficiency) */
  adjustedHashrate: number;
  /** Stake amount in BTC-S */
  stake: number;
}

export interface MiningResult {
  daily: number;
  monthly: number;
  apy: number;
}

/**
 * calculateRewards — compute estimated mining rewards given hashrate + stake.
 *
 * Formula details:
 *  - Stake multiplier: every 10,000 BTC-S staked adds +100 % to the base yield.
 *  - Base yield coefficient: 0.0082 BTC-S per TH/s per day (network-calibrated).
 *  - Base APY: 15 % + 0.1 % per TH/s + 0.1 % per 1,000 BTC-S staked.
 */
export function calculateRewards(input: MiningInput): MiningResult {
  const { adjustedHashrate, stake } = input;

  // Stake multiplier: every 10,000 BTC-S staked adds +100 % to the base yield.
  // The divisor 10_000 is the maximum stake tier defined in the protocol spec.
  const stakeMultiplier = 1 + stake / 10_000;

  // 0.0082 is the network-calibrated base yield coefficient (BTC-S per TH/s
  // per day) derived from the genesis block reward and target block time.
  const daily = adjustedHashrate * 0.0082 * stakeMultiplier;
  const monthly = daily * 30;

  // Base APY of 15 % plus 0.1 percentage points per TH/s
  // and 1 percentage point per 1,000 BTC-S staked.
  const apy = 15 + stake / 1_000 + adjustedHashrate * 0.1;

  return {
    daily: Number(daily.toFixed(4)),
    monthly: Number(monthly.toFixed(2)),
    apy: Number(apy.toFixed(1)),
  };
}
