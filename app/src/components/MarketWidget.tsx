import { useEffect, useMemo, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, formatUsd } from '@/lib/utils';

type MarketSnapshot = {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number | null;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
  fdvUsd: number | null;
  change24hPct: number | null;
  lastUpdated: string | null;
};

type ApiResponse = {
  ok: boolean;
  source?: string;
  cached?: boolean;
  stale?: boolean;
  fetchedAt?: string;
  data?: MarketSnapshot;
};

function fmtPct(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}

export default function MarketWidget({ coinId = 'the-open-network' }: { coinId?: string }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const url = useMemo(() => `/api/market/coingecko?id=${encodeURIComponent(coinId)}&vs=usd`, [coinId]);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    fetch(url, { method: 'GET', headers: { Accept: 'application/json' }, signal: ac.signal })
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((json) => setData(json))
      .catch(() => setData({ ok: false }))
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [url]);

  const s = data?.data ?? null;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-white/60 font-mono">Market data</div>
          <div className="mt-1 text-white font-semibold">
            {s ? `${s.name} (${s.symbol})` : loading ? 'Încarc…' : '—'}
          </div>
        </div>
        <div className="text-[11px] text-white/55 font-mono">
          {data?.ok && data?.fetchedAt ? `updated: ${new Date(data.fetchedAt).toLocaleTimeString()}` : ''}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
              <Skeleton className="h-3 w-2/3 bg-white/10" />
              <Skeleton className="h-5 w-1/2 bg-white/10" />
            </div>
          ))
        ) : (
          <>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-[11px] text-white/55">Price</div>
              <div className="mt-1 font-mono text-white tabular-nums">{formatPrice(s?.priceUsd ?? null)}</div>
              <div className="mt-1 text-[11px] text-white/55">{fmtPct(s?.change24hPct)}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-[11px] text-white/55">Market cap</div>
              <div className="mt-1 font-mono text-white tabular-nums">{formatUsd(s?.marketCapUsd ?? null)}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-[11px] text-white/55">Vol (24h)</div>
              <div className="mt-1 font-mono text-white tabular-nums">{formatUsd(s?.volume24hUsd ?? null)}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-[11px] text-white/55">FDV</div>
              <div className="mt-1 font-mono text-white tabular-nums">{formatUsd(s?.fdvUsd ?? null)}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

