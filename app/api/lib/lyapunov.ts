export const LYAPUNOV_PATH = '/api/lyapunov';
export const LYAPUNOV_METHODS = 'POST, OPTIONS';

export const LYAPUNOV_PROBE = {
  path: LYAPUNOV_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  model: 'heuristic' as const,
  invalidJsonError: 'Invalid JSON body' as const,
  invalidStateError: 'Invalid state: expected numeric { balance, price, volatility }' as const,
};

export type LyapunovState = { balance: number; price: number; volatility: number };

export function toLyapunovFiniteNumber(v: unknown): number | null {
  if (typeof v !== 'number') return null;
  if (!Number.isFinite(v)) return null;
  return v;
}

export function parseLyapunovState(body: unknown): LyapunovState | null {
  const state =
    typeof body === 'object' && body !== null && 'state' in body
      ? ((body as { state?: unknown }).state as Record<string, unknown>)
      : {};
  const balance = toLyapunovFiniteNumber(state.balance);
  const price = toLyapunovFiniteNumber(state.price);
  const volatility = toLyapunovFiniteNumber(state.volatility);
  if (balance === null || price === null || volatility === null) return null;
  return { balance, price, volatility };
}

export function computeLyapunovScore(state: LyapunovState): { stable: boolean; score: number } {
  const score = state.balance * state.price - state.volatility;
  return { stable: score >= 0, score };
}