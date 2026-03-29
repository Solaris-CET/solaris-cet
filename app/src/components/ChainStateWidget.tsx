/**
 * ChainStateWidget.tsx
 *
 * Displays on-chain CET token and DeDust pool data from the static
 * `public/api/state.json` snapshot produced by the TON indexer.
 *
 * Uses React 19's `use()` API with a `<Suspense>` boundary so the
 * snapshot is fetched once and served from the PWA's StaleWhileRevalidate
 * cache on subsequent visits — zero RPC calls on initial page load.
 */

import { use, Suspense } from 'react';
import { Database, ExternalLink } from 'lucide-react';
import { shortSkillWhisper, skillSeedFromLabel } from '@/lib/meshSkillFeed';
import { chainStatePromise } from '../lib/chain-state';
import type { ChainState } from '../lib/chain-state';

// ── Inner component (suspends until chainStatePromise resolves) ──────────────

function ChainStateContent() {
  const state: ChainState = use(chainStatePromise);

  const { token, pool } = state;

  const updatedLabel = (() => {
    try {
      return new Date(state.updatedAt).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return state.updatedAt;
    }
  })();

  const rows: { label: string; value: string; color: string }[] = [
    {
      label: 'Total Supply',
      value: token.totalSupply ? `${parseFloat(token.totalSupply).toLocaleString()} ${token.symbol}` : '—',
      color: 'text-solaris-gold',
    },
    {
      label: 'TON Reserve',
      value: pool.reserveTon ? `${parseFloat(pool.reserveTon).toLocaleString(undefined, { maximumFractionDigits: 4 })} TON` : '—',
      color: 'text-solaris-cyan',
    },
    {
      label: 'CET Reserve',
      value: pool.reserveCet ? `${parseFloat(pool.reserveCet).toLocaleString(undefined, { maximumFractionDigits: 4 })} CET` : '—',
      color: 'text-solaris-gold',
    },
    {
      label: 'Spot Price',
      value: pool.priceTonPerCet ? `${parseFloat(pool.priceTonPerCet).toFixed(6)} TON/CET` : '—',
      color: 'text-emerald-400',
    },
  ];

  return (
    <div className="bento-card p-5 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-solaris-gold/10 flex items-center justify-center">
            <Database className="w-4 h-4 text-solaris-gold" />
          </div>
          <span className="hud-label text-solaris-gold">Chain Index</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-mono">CACHED</span>
          </span>
        </div>
        <a
          href={`https://dedust.io/pools/${pool.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-solaris-muted hover:text-solaris-gold transition-colors"
        >
          DeDust
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {rows.map((row) => (
          <div key={row.label} className="p-3 rounded-lg bg-white/5">
            <div className="text-solaris-muted text-[11px] mb-1">{row.label}</div>
            <div className={`font-mono font-semibold text-sm ${row.color}`}>
              {row.value}
            </div>
            <p
              className="mt-2 text-[9px] font-mono text-fuchsia-200/65 leading-snug line-clamp-2 border-t border-fuchsia-500/10 pt-1.5"
              title={shortSkillWhisper(skillSeedFromLabel(`chainIndex|${row.label}`))}
            >
              {shortSkillWhisper(skillSeedFromLabel(`chainIndex|${row.label}`))}
            </p>
          </div>
        ))}
      </div>

      {/* Timestamp */}
      <p className="text-[10px] text-solaris-muted mt-3 text-right font-mono">
        Indexed {updatedLabel}
      </p>
    </div>
  );
}

// ── Skeleton shown while the JSON is in-flight ───────────────────────────────

function ChainStateSkeleton() {
  return (
    <div className="bento-card p-5 lg:p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-solaris-gold/10 flex items-center justify-center">
          <Database className="w-4 h-4 text-solaris-gold opacity-50" />
        </div>
        <span className="hud-label text-solaris-gold opacity-50">Chain Index</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-3 rounded-lg bg-white/5 animate-pulse">
            <div className="h-3 w-16 bg-white/10 rounded mb-2" />
            <div className="h-4 w-24 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Public component with built-in Suspense boundary ────────────────────────

const ChainStateWidget = () => (
  <Suspense fallback={<ChainStateSkeleton />}>
    <ChainStateContent />
  </Suspense>
);

export default ChainStateWidget;
