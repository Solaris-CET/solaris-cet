import { Activity, RefreshCw, ExternalLink } from 'lucide-react';
import { useLivePoolData } from '../hooks/use-live-pool-data';
import { useLanguage } from '../hooks/useLanguage';
import { formatUsd, formatPrice } from '../lib/utils';
import { shortSkillWhisper, skillSeedFromLabel } from '@/lib/meshSkillFeed';
import { Skeleton } from '@/components/ui/skeleton';
import { DEDUST_POOL_PAGE_URL } from '@/lib/dedustUrls';

const LivePoolStats = () => {
  const { t } = useLanguage();
  const { priceUsd, tvlUsd, volume24hUsd, tonPriceUsd, loading, error, lastUpdated } =
    useLivePoolData();

  const stats = [
    { meshKey: 'cetPrice', label: t.livePool.labelCetPrice, value: formatPrice(priceUsd), color: 'gold' },
    { meshKey: 'tvl', label: t.livePool.labelTvl, value: formatUsd(tvlUsd), color: 'cyan' },
    { meshKey: 'volume24h', label: t.livePool.labelVolume24h, value: formatUsd(volume24hUsd), color: 'emerald' },
    { meshKey: 'tonPrice', label: t.livePool.labelTonPrice, value: formatUsd(tonPriceUsd), color: 'purple' },
  ];

  return (
    <div className="bento-card p-5 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-solaris-cyan/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-solaris-cyan" />
          </div>
          <span className="hud-label text-solaris-cyan">{t.livePool.title}</span>
          {!loading && !error && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-mono">{t.livePool.liveBadge}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <RefreshCw className="w-3.5 h-3.5 text-solaris-muted animate-spin" />
          )}
          <a
            href={DEDUST_POOL_PAGE_URL}
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
            {t.livePool.errorUnavailable}{' '}
            <a
              href={DEDUST_POOL_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-solaris-gold hover:underline inline-flex items-center gap-1"
            >
              {t.livePool.viewOnDedust}
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
          {lastUpdated && (
            <p className="text-solaris-muted/60 text-[11px] font-mono">
              {t.livePool.lastCachedPrefix} {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <p className="text-solaris-muted/60 text-[11px]">
            {t.livePool.followPrefix}{' '}
            <a
              href="https://twitter.com/SolarisCET"
              target="_blank"
              rel="noopener noreferrer"
              className="text-solaris-cyan hover:underline"
            >
              {t.livePool.twitterX}
            </a>
            {' '}
            {t.livePool.followSuffix}
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
          aria-busy={loading}
          aria-label={loading ? t.livePool.loadingAria : undefined}
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg bg-white/5 space-y-2">
                  <Skeleton className="h-3 w-3/4 bg-white/10" />
                  <Skeleton className="h-5 w-1/2 bg-solaris-gold/15" />
                </div>
              ))
            : stats.map((stat) => (
                <div key={stat.meshKey} className="p-3 rounded-lg bg-white/5">
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
                  <p
                    className="mt-2 text-[9px] font-mono text-fuchsia-200/65 leading-snug line-clamp-2 border-t border-fuchsia-500/10 pt-1.5"
                    title={shortSkillWhisper(skillSeedFromLabel(`dedust|${stat.meshKey}`))}
                  >
                    {shortSkillWhisper(skillSeedFromLabel(`dedust|${stat.meshKey}`))}
                  </p>
                </div>
              ))}
        </div>
      )}

      {/* Last updated */}
      {lastUpdated && !error && (
        <p className="text-[10px] text-solaris-muted mt-3 text-right font-mono">
          {t.livePool.updatedPrefix} {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default LivePoolStats;
