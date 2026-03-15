import { Activity, RefreshCw, ExternalLink } from 'lucide-react';
import { useLivePoolData } from '../hooks/use-live-pool-data';

const DEDUST_POOL_URL =
  'https://dedust.io/pools/EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB';

const formatUsd = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return '—';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(4)}`;
};

const formatPrice = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return '—';
  if (value < 0.001) return `$${value.toExponential(2)}`;
  return `$${value.toFixed(4)}`;
};

const LivePoolStats = () => {
  const { priceUsd, tvlUsd, volume24hUsd, tonPriceUsd, loading, error, lastUpdated } =
    useLivePoolData();

  const stats = [
    { label: 'CET Price', value: formatPrice(priceUsd), color: 'gold' },
    { label: 'TVL', value: formatUsd(tvlUsd), color: 'cyan' },
    { label: '24h Volume', value: formatUsd(volume24hUsd), color: 'emerald' },
    { label: 'TON Price', value: formatUsd(tonPriceUsd), color: 'purple' },
  ];

  return (
    <div className="glass-card p-5 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-solaris-cyan/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-solaris-cyan" />
          </div>
          <span className="hud-label text-solaris-cyan">Live DeDust Pool</span>
          {!loading && !error && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-mono">LIVE</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <RefreshCw className="w-3.5 h-3.5 text-solaris-muted animate-spin" />
          )}
          <a
            href={DEDUST_POOL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-solaris-muted hover:text-solaris-gold transition-colors"
          >
            DeDust
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Stats grid */}
      {error ? (
        <div className="text-center py-4 space-y-2">
          <p className="text-solaris-muted text-xs">
            Live data temporarily unavailable.{' '}
            <a
              href={DEDUST_POOL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-solaris-gold hover:underline inline-flex items-center gap-1"
            >
              View on DeDust
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
          <p className="text-solaris-muted/60 text-[11px]">
            Follow us on{' '}
            <a
              href="https://twitter.com/SolarisCET"
              target="_blank"
              rel="noopener noreferrer"
              className="text-solaris-cyan hover:underline"
            >
              Twitter / X
            </a>
            {' '}for real-time updates.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-busy={loading} aria-label={loading ? 'Loading pool stats' : undefined}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg bg-white/5">
                  <div className="text-solaris-muted text-[11px] mb-1 animate-pulse h-3 bg-white/10 rounded w-3/4" />
                  <div className="animate-pulse h-4 bg-white/10 rounded w-1/2" />
                </div>
              ))
            : stats.map((stat) => (
                <div key={stat.label} className="p-3 rounded-lg bg-white/5">
                  <div className="text-solaris-muted text-[11px] mb-1">{stat.label}</div>
                  <div
                    className={`font-mono font-semibold text-sm ${
                      stat.color === 'gold'
                        ? 'text-solaris-gold'
                        : stat.color === 'cyan'
                        ? 'text-solaris-cyan'
                        : stat.color === 'emerald'
                        ? 'text-emerald-400'
                        : 'text-purple-400'
                    }`}
                  >
                    {stat.value}
                  </div>
                </div>
              ))}
        </div>
      )}

      {/* Last updated */}
      {lastUpdated && !error && (
        <p className="text-[10px] text-solaris-muted mt-3 text-right font-mono">
          Updated {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default LivePoolStats;
