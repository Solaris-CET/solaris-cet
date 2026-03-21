/**
 * mining-calc.ts
 *
 * Pure-function mining reward calculations shared between the UI and the
 * Web Worker (`workers/mining.worker.ts`).  Keeping the logic here — outside
 * the worker — makes it unit-testable without spinning up a Worker thread.
 *
 * Formula derivation
 * ──────────────────────────────────────────────────────────────────────────
 *  daily   = adjustedHashrate × 0.0082 × (1 + stake / 10_000)
 *  monthly = daily × 30
 *  apy     = 15 + stake / 1_000 + adjustedHashrate × 0.1
 *
 * where:
 *  0.0082   — network-calibrated base yield coefficient (BTC-S per TH/s/day)
 *  10_000   — maximum stake tier defined in the protocol spec
 *  0.1      — hashrate efficiency bonus per TH/s
 */

export interface MiningInput {
  /** Effective hashrate in TH/s (already adjusted for device efficiency). */
  adjustedHashrate: number;
  /** Stake amount in BTC-S. */
  stake: number;
}

export interface MiningResult {
  /** Projected daily reward in BTC-S. */
  daily: number;
  /** Projected monthly reward in BTC-S (daily × 30). */
  monthly: number;
  /** Estimated annual percentage yield (%). */
  apy: number;
}

/**
 * Calculates projected mining rewards for a given hashrate and stake.
 *
 * @param input - {@link MiningInput} containing `adjustedHashrate` and `stake`.
 * @returns     - {@link MiningResult} with `daily`, `monthly`, and `apy` values.
 *
 * @example
 * ```ts
 * calculateRewards({ adjustedHashrate: 10, stake: 0 })
 * // → { daily: 0.082, monthly: 2.46, apy: 16.0 }
 * ```
 */
export function calculateRewards(input: MiningInput): MiningResult {
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
