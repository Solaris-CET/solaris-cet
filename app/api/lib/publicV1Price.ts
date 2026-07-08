export const PUBLIC_V1_PRICE_PATH = '/api/v1/price';
export const PUBLIC_V1_PRICE_METHODS = 'GET, OPTIONS';

export const PUBLIC_V1_PRICE_PROBE = {
  path: PUBLIC_V1_PRICE_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  apiVersion: 'v1' as const,
  asset: 'CET' as const,
  rateLimitBucket: 'public-v1-price' as const,
  rateLimit: 120,
  rateWindowSeconds: 60,
  envPriceKey: 'CET_PRICE_USD' as const,
};

export function resolveCetPriceUsdFromEnv(env: NodeJS.ProcessEnv = process.env): number | null {
  const v = String(env[PUBLIC_V1_PRICE_PROBE.envPriceKey] ?? '').trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function buildPublicV1PriceBody(priceUsd: number | null, now = new Date()) {
  const resolved = priceUsd ?? 0;
  return {
    version: PUBLIC_V1_PRICE_PROBE.apiVersion,
    asset: PUBLIC_V1_PRICE_PROBE.asset,
    priceUsd: resolved,
    updatedAt: now.toISOString(),
    source: priceUsd ? 'env' : 'fallback',
  };
}