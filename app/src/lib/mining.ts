/**
 * mining.ts
 *
 * Pure (side-effect-free) mining reward calculation logic shared between
 * the main thread (MiningCalculatorSection) and the Web Worker
 * (mining.worker.ts).  Keeping the math in this module makes it trivially
 * unit-testable without needing a Worker environment.
 *
 * Formula reference: Solaris CET Whitepaper §4 — Mining Economics
 */

export interface MiningInput {
  /** Effective hashrate in TH/s (already adjusted for device efficiency). */
  adjustedHashrate: number;
  /** Stake amount in BTC-S. */
  stake: number;
}

export interface MiningResult {
  /** Estimated daily reward in BTC-S. */
  daily: number;
  /** Estimated monthly reward in BTC-S (daily × 30). */
  monthly: number;
  /** Annualised percentage yield. */
  apy: number;
}

/**
 * Calculates estimated mining rewards based on adjusted hashrate and stake.
 *
 * - **Stake multiplier**: every 10,000 BTC-S staked adds +100 % to base yield.
 * - **Base yield coefficient**: 0.0082 BTC-S per TH/s per day (genesis-calibrated).
 * - **APY**: 15 % base + 0.1 % per TH/s + 0.1 % per 1,000 BTC-S staked.
 *
 * @param input Hashrate (TH/s) and stake (BTC-S).
 * @returns     Daily, monthly, and APY figures rounded to display precision.
 */
export function calculateRewards(input: MiningInput): MiningResult {
  const { adjustedHashrate, stake } = input;

  // Stake multiplier: every 10,000 BTC-S staked adds +100 % to the base yield.
  const stakeMultiplier = 1 + stake / 10_000;

  // 0.0082 is the network-calibrated base yield coefficient (BTC-S per TH/s
  // per day) derived from the genesis block reward and target block time.
  const daily = adjustedHashrate * 0.0082 * stakeMultiplier;
  const monthly = daily * 30;

  // Base APY of 15 % plus 0.1 % per TH/s and 0.1 % per 1,000 BTC-S staked.
  const apy = 15 + stake / 1_000 + adjustedHashrate * 0.1;

  return {
    daily: Number(daily.toFixed(4)),
    monthly: Number(monthly.toFixed(2)),
    apy: Number(apy.toFixed(1)),
  };
}
