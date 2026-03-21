/**
 * mining.worker.ts
 *
 * Web Worker that offloads mining reward calculations from the main thread,
 * keeping the UI responsive even when running intensive simulations
 * (e.g. the 90-year smooth-decay mining schedule described in the Solaris
 * CET whitepaper).
 *
 * The calculation logic lives in `../lib/mining-calc.ts` so it can be
 * unit-tested independently of the Worker environment.
 *
 * Message protocol
 * ──────────────────────────────────────────────────────────────────────────
 * Incoming  { type: 'CALCULATE_REWARDS', payload: MiningInput }
 * Outgoing  { type: 'REWARDS_RESULT',    payload: MiningResult }
 *           { type: 'ERROR',             message: string }
 */

import { calculateRewards } from '../lib/mining-calc';
export type { MiningInput, MiningResult } from '../lib/mining-calc';

// ---------------------------------------------------------------------------
// Worker message handler
// ---------------------------------------------------------------------------

self.onmessage = (event: MessageEvent<{ type: string; payload: Parameters<typeof calculateRewards>[0] }>) => {
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
