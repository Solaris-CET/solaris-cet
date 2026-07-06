type CoinGeckoSimplePrice = {
  [coinId: string]: {
    usd?: unknown;
  };
};

function toNum(v: unknown): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : Number.NaN;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export async function fetchTonPriceUsd(): Promise<{ priceUsd: number; source: 'coingecko' | 'fallback' }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd';
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json', 'Cache-Control': 'no-store' } });
    if (!res.ok) return { priceUsd: 0, source: 'fallback' };
    const data = (await res.json()) as CoinGeckoSimplePrice;
    const priceUsd = toNum(data?.['the-open-network']?.usd);
    if (!priceUsd) return { priceUsd: 0, source: 'fallback' };
    return { priceUsd, source: 'coingecko' };
  } catch {
    return { priceUsd: 0, source: 'fallback' };
  } finally {
    clearTimeout(timer);
  }
}

