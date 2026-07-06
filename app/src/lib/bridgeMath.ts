export const BRIDGE_SIM_LIMITS = {
  minCET: 0.01,
  maxCET: 500,
  baseFeeCET: 0.05,
  feeBps: 20,
  etaMs: 25_000,
} as const;

export const CET_DECIMALS = 6n;
export const CET_SCALE = 10n ** CET_DECIMALS;

export function microToCET(micro: bigint): number {
  return Number(micro) / Number(CET_SCALE);
}

export function parseCETToMicro(input: unknown): bigint | null {
  if (typeof input !== 'string') return null;
  const s = input.trim();
  if (!s) return null;
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const [wholeRaw, fracRaw = ''] = s.split('.');
  const whole = BigInt(wholeRaw);
  const frac = fracRaw.slice(0, Number(CET_DECIMALS)).padEnd(Number(CET_DECIMALS), '0');
  const fracMicro = BigInt(frac || '0');
  return whole * CET_SCALE + fracMicro;
}

export function computeFeeMicro(amountMicro: bigint): bigint {
  const base = BigInt(Math.round(BRIDGE_SIM_LIMITS.baseFeeCET * Number(CET_SCALE)));
  const bps = BigInt(BRIDGE_SIM_LIMITS.feeBps);
  const variable = (amountMicro * bps) / 10_000n;
  return variable > base ? variable : base;
}

