/**
 * mining.worker.ts
 *
 * Web Worker that offloads mining reward calculations from the main thread,
 * keeping the UI responsive even when running intensive simulations
 * (e.g. the 90-year smooth-decay mining schedule described in the Solaris
 * CET whitepaper).
 *
 * Message protocol
 * ──────────────────────────────────────────────────────────────────────────
 * Incoming  { type: 'CALCULATE_REWARDS', payload: MiningInput }
 * Outgoing  { type: 'REWARDS_RESULT',    payload: MiningResult }
 *           { type: 'ERROR',             message: string }
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

// ---------------------------------------------------------------------------
// Calculation logic (mirrors the formula in MiningCalculatorSection but runs
// off the main thread so the UI stays responsive during heavy re-renders).
// ---------------------------------------------------------------------------

function calculateRewards(input: MiningInput): MiningResult {
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

// ---------------------------------------------------------------------------
// Worker message handler
// ---------------------------------------------------------------------------

self.onmessage = (event: MessageEvent<{ type: string; payload: MiningInput }>) => {
  const { type, payload } = event.data;

  if (type === 'CALCULATE_REWARDS') {
    try {
      const result = calculateRewards(payload);
      self.postMessage({ type: 'REWARDS_RESULT', payload: result });
    } catch (err) {
      self.postMessage({
        type: 'ERROR',
        message: err instanceof Error ? err.message : 'Unknown error in mining worker',
      });
    }
  }
};
