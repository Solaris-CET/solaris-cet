import { Activity, Cpu, Globe, Layers, Lock, TrendingUp } from 'lucide-react';
import { useEffect,useMemo, useState } from 'react';

import { ScrollFadeUp } from '@/components/ScrollFadeUp';
import { ScrollStaggerFadeUp } from '@/components/ScrollStaggerFadeUp';
import { shortSkillWhisper, skillSeedFromLabel } from '@/lib/meshSkillFeed';

import GlowOrbs from '../components/GlowOrbs';
import { useLanguage } from '../hooks/useLanguage';

// ─── Live network stats that increment over time ──────────────────────────

interface LiveStat {
  label: string;
  base: number;
  perSecond: number;
  unit: string;
  icon: typeof Activity;
  color: string;
  border: string;
  description: string;
}

function buildLiveStats(tx: { stats: Record<string, { label: string; description: string }> }): LiveStat[] {
  return [
    {
      label: tx.stats.blocksProcessed.label,
      base: 48_291_047,
      perSecond: 5,
      unit: '',
      icon: Layers,
      color: 'text-solaris-cyan',
      border: 'border-solaris-cyan/20',
      description: tx.stats.blocksProcessed.description,
    },
    {
      label: tx.stats.transactions.label,
      base: 2_841_903_512,
      perSecond: 120,
      unit: '',
      icon: Activity,
      color: 'text-solaris-gold',
      border: 'border-solaris-gold/20',
      description: tx.stats.transactions.description,
    },
    {
      label: tx.stats.validatorsActive.label,
      base: 340,
      perSecond: 0,
      unit: '',
      icon: Lock,
      color: 'text-emerald-400',
      border: 'border-emerald-400/20',
      description: tx.stats.validatorsActive.description,
    },
    {
      label: tx.stats.agentActions.label,
      base: 12_847_293,
      perSecond: 8.4,
      unit: '',
      icon: Cpu,
      color: 'text-purple-400',
      border: 'border-purple-400/20',
      description: tx.stats.agentActions.description,
    },
    {
      label: tx.stats.countriesReached.label,
      base: 147,
      perSecond: 0,
      unit: '',
      icon: Globe,
      color: 'text-pink-400',
      border: 'border-pink-400/20',
      description: tx.stats.countriesReached.description,
    },
    {
      label: tx.stats.uptime.label,
      base: 99.97,
      perSecond: 0,
      unit: '%',
      icon: TrendingUp,
      color: 'text-amber-400',
      border: 'border-amber-400/20',
      description: tx.stats.uptime.description,
    },
  ];
}

function formatLive(n: number, unit: string): string {
  if (unit === '%') return `${n.toFixed(2)}%`;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(1)}K`;
  return Math.floor(n).toString();
}

// ─── Component ────────────────────────────────────────────────────────────

/**
 * NetworkPulseSection — a live dashboard of TON network + Solaris CET metrics.
 * Stats increment every second to show a living, breathing network.
 */
const NetworkPulseSection = () => {
  const { t, lang } = useLanguage();
  const tx = t.networkPulseUi;
  const LIVE_STATS = useMemo(() => buildLiveStats(tx), [tx]);

  const [counts, setCounts] = useState<number[]>(LIVE_STATS.map(s => s.base));
  const [pulse, setPulse]   = useState(false);

  // Live increment
  useEffect(() => {
    const interval = setInterval(() => {
      setCounts(prev => prev.map((v, i) => v + LIVE_STATS[i].perSecond));
      setPulse(p => !p);
    }, 1000);
    return () => clearInterval(interval);
  }, [LIVE_STATS]);

  return (
    <section
      id="network-pulse"
      aria-label={t.sectionAria.networkPulse}
      className="relative section-glass section-padding-y overflow-hidden mesh-bg"
    >
      <GlowOrbs variant="mixed" />

      {/* Scan overlay */}
      <div className="scan-overlay absolute inset-0 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 section-padding-x max-w-7xl mx-auto w-full">

        {/* Header */}
        <ScrollFadeUp className="flex items-center justify-between mb-12 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-2.5 h-2.5 rounded-full bg-emerald-400 transition-opacity duration-500 ${pulse ? 'opacity-100' : 'opacity-40'}`}
                   style={{ boxShadow: '0 0 8px #10b981' }} />
              <span className="hud-label text-emerald-400">
                {tx.kicker}
              </span>
            </div>
            <h2 className="font-display font-bold text-[clamp(28px,3.5vw,48px)] text-solaris-text">
              {tx.titleLead} <span className="text-gradient-cyan">{tx.titleHighlight}</span> {tx.titleTail}
            </h2>
            <p className="text-solaris-muted text-base mt-2 max-w-xl">
              {tx.subtitle}
            </p>
          </div>
          <div className="bento-card px-5 py-3 border border-emerald-400/20 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-mono text-xs font-bold">
              {tx.mainnetBlockLabel.replace('{block}', Math.floor(counts[0]).toLocaleString(lang))}
            </span>
          </div>
        </ScrollFadeUp>

        {/* Stats grid */}
        <ScrollStaggerFadeUp className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          {LIVE_STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`pulse-card bento-card p-6 border ${stat.border} shadow-depth relative overflow-hidden group`}
              >
                {/* bg glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${
                      stat.color.replace('text-', '').replace('solaris-', '#')
                    }15 0%, transparent 60%)`,
                  }}
                  aria-hidden="true"
                />

                {/* Icon */}
                <div className={`w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center mb-4`}>
                  <Icon className={`w-[18px] h-[18px] ${stat.color}`} />
                </div>

                {/* Live number */}
                <div className={`font-display font-black text-[clamp(24px,3.5vw,40px)] leading-none tabular-nums mb-1 ${stat.color}`}>
                  {formatLive(counts[i], stat.unit)}
                </div>

                <div className="text-solaris-text text-sm font-semibold mb-1">{stat.label}</div>
                <div className="text-solaris-muted text-xs leading-relaxed">{stat.description}</div>
                <p
                  className="mt-2 text-[10px] font-mono text-fuchsia-200/70 leading-snug line-clamp-2 border-t border-fuchsia-500/10 pt-2"
                  title={shortSkillWhisper(skillSeedFromLabel(`pulse|${stat.label}`))}
                >
                  {shortSkillWhisper(skillSeedFromLabel(`pulse|${stat.label}`))}
                </p>

                {/* Pulse dot for incrementing stats */}
                {stat.perSecond > 0 && (
                  <div className="absolute top-4 right-4">
                    <div className={`w-2 h-2 rounded-full ${stat.color.replace('text-', 'bg-')} transition-opacity duration-500 ${pulse ? 'opacity-100' : 'opacity-30'}`}
                         style={{ boxShadow: `0 0 6px currentColor` }} />
                  </div>
                )}
              </div>
            );
          })}
        </ScrollStaggerFadeUp>

        {/* Bottom note */}
        <p className="text-solaris-muted/40 text-[11px] font-mono text-center mt-6">
          {tx.footnote}
        </p>

      </div>
    </section>
  );
};

export default NetworkPulseSection;
