export const ADMIN_TOKEN_PATH = '/api/admin/token';
export const ADMIN_TOKEN_METHODS = 'GET, PUT, OPTIONS';

export const ADMIN_TOKEN_SYMBOL = 'CET';

export const ADMIN_TOKEN_PROBE = {
  path: ADMIN_TOKEN_PATH,
  methods: ['GET', 'PUT', 'OPTIONS'] as const,
  authRequired: true,
  getMinRole: 'viewer' as const,
  putMinRole: 'editor' as const,
  unauthenticatedStatus: 401,
  symbol: ADMIN_TOKEN_SYMBOL,
  auditAction: 'TOKEN_DATA_UPDATED' as const,
  maxDecimalLength: 80,
};

export function asTokenDecimalString(v: unknown): string | null {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;
    if (!/^[0-9]+(\.[0-9]+)?$/.test(s)) return null;
    if (s.length > ADMIN_TOKEN_PROBE.maxDecimalLength) return null;
    return s;
  }
  return null;
}

export type TokenPutBody =
  | { ok: true; priceUsd: string; totalSupply: string; circulatingSupply: string }
  | { ok: false; error: 'Valori invalide' };

export function parseTokenPutBody(body: unknown): TokenPutBody {
  const priceUsd = asTokenDecimalString(typeof body === 'object' && body !== null ? (body as { priceUsd?: unknown }).priceUsd : null);
  const totalSupply = asTokenDecimalString(typeof body === 'object' && body !== null ? (body as { totalSupply?: unknown }).totalSupply : null);
  const circulatingSupply = asTokenDecimalString(
    typeof body === 'object' && body !== null ? (body as { circulatingSupply?: unknown }).circulatingSupply : null,
  );
  if (!priceUsd || !totalSupply || !circulatingSupply) return { ok: false, error: 'Valori invalide' };
  return { ok: true, priceUsd, totalSupply, circulatingSupply };
}