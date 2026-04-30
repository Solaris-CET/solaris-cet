import { CET_JETTON_MASTER_ADDRESS } from '../../src/constants/token';

type DexScreenerSearch = {
  pairs?: Array<{ priceUsd?: string | number | null; liquidity?: { usd?: number | null } | null }>;
};

export async function fetchCetPriceUsd(): Promise<{ priceUsd: number; source: 'dexscreener' | 'env' | 'fallback' }> {
  const fromEnv = String(process.env.CET_PRICE_USD ?? '').trim();
  if (fromEnv) {
    const n = Number(fromEnv);
    if (Number.isFinite(n) && n > 0) return { priceUsd: n, source: 'env' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(CET_JETTON_MASTER_ADDRESS)}`;
    const res = await fetch(url, { signal: controller.signal, headers: { 'Cache-Control': 'no-store' } });
    if (!res.ok) return { priceUsd: 0, source: 'fallback' };
    const data = (await res.json()) as DexScreenerSearch;
    const pairs = Array.isArray(data.pairs) ? data.pairs : [];
    const scored = pairs
      .map((p) => {
        const raw = p.priceUsd;
        const price = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : Number.NaN;
        const liq = typeof p.liquidity?.usd === 'number' ? p.liquidity.usd : 0;
        return { price, liq };
      })
      .filter((p) => Number.isFinite(p.price) && p.price > 0)
      .sort((a, b) => (b.liq || 0) - (a.liq || 0));
    const best = scored[0];
    if (!best) return { priceUsd: 0, source: 'fallback' };
    return { priceUsd: best.price, source: 'dexscreener' };
  } catch {
    return { priceUsd: 0, source: 'fallback' };
  } finally {
    clearTimeout(timer);
  }
}

