/**
 * mining-math.ts
 *
 * Pure, side-effect-free reward calculation functions shared between
 * `mining.worker.ts` (which runs in a Web Worker) and unit tests (which run
 * in Node.js). Keeping the math in a plain module avoids importing the
 * `self` Web Worker global during testing.
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
 * Calculates estimated mining rewards based on hashrate and stake.
 *
 * @param input.adjustedHashrate - Effective hashrate in TH/s
 * @param input.stake            - Stake amount in BTC-S
 * @returns Daily, monthly rewards and APY
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

  // Base APY of 15 % plus 0.1 % per TH/s and 0.1 % per 1,000 BTC-S staked.
  const apy = 15 + stake / 1_000 + adjustedHashrate * 0.1;

  return {
    daily: Number(daily.toFixed(4)),
    monthly: Number(monthly.toFixed(2)),
    apy: Number(apy.toFixed(1)),
  };
}
