import { resolveCetPriceUsdFromEnv } from './publicV1Price';

export const PUBLIC_V2_PRICE_PATH = '/api/v2/price';
export const PUBLIC_V2_PRICE_METHODS = 'GET, OPTIONS';

export const PUBLIC_V2_PRICE_PROBE = {
  path: PUBLIC_V2_PRICE_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  apiVersion: 'v2' as const,
  assetSymbol: 'CET' as const,
  assetChain: 'TON' as const,
  priceDecimals: 6,
  rateLimitBucket: 'public-v2-price' as const,
  rateLimit: 180,
  rateWindowSeconds: 60,
};

export function buildPublicV2PriceBody(priceUsd: number | null, now = new Date()) {
  const resolved = priceUsd ?? 0;
  return {
    version: PUBLIC_V2_PRICE_PROBE.apiVersion,
    asset: { symbol: PUBLIC_V2_PRICE_PROBE.assetSymbol, chain: PUBLIC_V2_PRICE_PROBE.assetChain },
    price: { usd: resolved, decimals: PUBLIC_V2_PRICE_PROBE.priceDecimals },
    updatedAt: now.toISOString(),
    source: priceUsd ? 'env' : 'fallback',
  };
}

export { resolveCetPriceUsdFromEnv };