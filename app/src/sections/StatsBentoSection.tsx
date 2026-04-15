import { ScrollFadeUp } from '@/components/ScrollFadeUp';
import { ScrollStaggerFadeUp } from '@/components/ScrollStaggerFadeUp';
import { Users, Coins, Zap, Clock, Shield, TrendingUp, Globe, ArrowRight } from 'lucide-react';
import AnimatedCounter from '../components/AnimatedCounter';
import GlowOrbs from '../components/GlowOrbs';
import MeshSkillRibbon from '../components/MeshSkillRibbon';
import { meshStandardBurstFromKey, meshWhisperFromKey } from '@/lib/meshSkillFeed';
import { useLanguage } from '../hooks/useLanguage';
import { CET_FIXED_SUPPLY_CAP, TASK_AGENT_MESH_TOTAL } from '@/lib/domainPillars';
import { TOKEN_DECIMALS } from '../constants/token';

/** Overrides global `.bento-card:hover` (translate/scale/shadow) with the bento gold glow spec. */
const BENTO_TILE_INTERACTION =
  'transition-all duration-300 hover:!-translate-y-1 hover:!scale-100 hover:!shadow-[0_0_15px_rgba(234,179,8,0.2)]';

const TRUST_BADGES = [
  { icon: Shield, label: 'Cyberscope Audited' },
  { icon: TrendingUp, label: 'KYC Verified' },
  { icon: Globe, label: 'Open Source' },
];

// ─── Component ────────────────────────────────────────────────────────────

/**
 * StatsBento — a bento-grid layout displaying the 4 core Solaris CET numbers
 * with animated counters, badge labels, and a trust bar.
 * Placed after Hero, before Intelligence Core (problem narrative).
 */
const StatsBento = () => {
  const { t } = useLanguage();

  const stats = [
    {
      id: 'agents',
      value: TASK_AGENT_MESH_TOTAL,
      label: t.statsBento.labelAgents,
      sublabel: t.statsBento.sublabelAgents,
      suffix: '',
      icon: Users,
      color: 'text-solaris-gold',
      border: 'border-solaris-gold/20',
      glow: 'rgba(242,201,76,0.12)',
      size: 'lg',          // large bento cell
      accentClass: 'text-gradient-gold',
      badge: t.statsBento.badgeLive,
      badgeColor: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
    },
    {
      id: 'supply',
      value: CET_FIXED_SUPPLY_CAP,
      label: t.statsBento.labelSupply,
      sublabel: t.statsBento.sublabelSupply,
      suffix: ' CET',
      icon: Coins,
      color: 'text-solaris-cyan',
      border: 'border-solaris-cyan/20',
      glow: 'rgba(46,231,255,0.10)',
      size: 'sm',
      accentClass: 'text-gradient-cyan',
      badge: t.statsBento.badgeScarce,
      badgeColor: 'bg-solaris-cyan/10 text-solaris-cyan border-solaris-cyan/30',
    },
    {
      id: 'tps',
      value: 2,
      label: t.statsBento.labelTps,
      sublabel: t.statsBento.sublabelTps,
      suffix: 's',
      icon: Zap,
      color: 'text-purple-400',
      border: 'border-purple-400/20',
      glow: 'rgba(139,92,246,0.10)',
      size: 'sm',
      accentClass: 'text-gradient-aurora',
      badge: t.statsBento.badgeFastest,
      badgeColor: 'bg-purple-400/10 text-purple-400 border-purple-400/30',
    },
    {
      id: 'years',
      value: 90,
      label: t.statsBento.labelYears,
      sublabel: t.statsBento.sublabelYears,
      suffix: '',
      icon: Clock,
      color: 'text-emerald-400',
      border: 'border-emerald-400/20',
      glow: 'rgba(16,185,129,0.10)',
      size: 'sm',
      accentClass: '',
      badge: t.statsBento.badgeLongTerm,
      badgeColor: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
    },
  ] as const;

  const [agentStat, ...smallStats] = stats;

  return (
    <section
      id="stats"
      aria-label={t.sectionAria.statsBento}
      className="relative section-glass section-padding-y overflow-hidden mesh-bg"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-amber-400/35 to-transparent"
        aria-hidden
      />
      {/* Aurora + orbs background */}
      <div className="absolute inset-0 aurora-bg opacity-60 pointer-events-none" aria-hidden="true" />
      <GlowOrbs variant="aurora" />

      <div className="relative z-10 section-padding-x max-w-7xl mx-auto w-full">

        {/* Section tag */}
        <div className="flex items-center gap-3 mb-10 justify-center md:justify-start">
          <span className="live-dot" />
          <span className="hud-label text-solaris-gold">{t.statsBento.networkAtAGlance}</span>
        </div>

        {/* Bento grid — asymmetric 12-col layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 auto-rows-min w-full">
          {/* ── Large hero stat — AI Agents ── */}
          <ScrollFadeUp className="lg:col-span-6 lg:row-span-2">
            <div
              className={`bento-stat bento-card p-8 lg:p-10 ${agentStat.border} shadow-depth ${BENTO_TILE_INTERACTION}`}
              title={`${meshStandardBurstFromKey('statsBento|agents|heroPanel')}\n—\n${meshWhisperFromKey('statsBento|agents|heroWhisper')}`}
            >
            {/* Ambient glow */}
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${agentStat.glow} 0%, transparent 70%)`, filter: 'blur(40px)', transform: 'translate(30%, -30%)' }}
              aria-hidden="true"
            />

            {/* Badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-semibold mb-6 ${agentStat.badgeColor}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              {agentStat.badge}
            </div>

            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-solaris-gold/10 border border-solaris-gold/20 flex items-center justify-center mb-6">
              <agentStat.icon className="w-7 h-7 text-solaris-gold" />
            </div>

            {/* Number */}
            <div className="font-display font-black text-[clamp(56px,8vw,96px)] leading-none tracking-tighter mb-2">
              <AnimatedCounter
                end={agentStat.value}
                duration={2.5}
                className="text-shimmer"
                meshTitleKey={`statsBento|${agentStat.id}`}
              />
            </div>

            {/* Label */}
            <h3 className="font-display font-bold text-xl text-solaris-text mb-2">{agentStat.label}</h3>
            <p className="text-solaris-muted text-sm leading-relaxed">{agentStat.sublabel}</p>

            {/* CTA */}
            <a
              href="#team"
              className="mt-6 inline-flex items-center gap-2 text-solaris-gold text-sm font-semibold hover:gap-3 transition-all duration-200"
            >
              {t.statsBento.meetAgents} <ArrowRight className="w-4 h-4 text-solaris-gold" />
            </a>
            </div>
          </ScrollFadeUp>

          {/* ── 3 stats + trust — right stack ── */}
          <div className="lg:col-span-6 flex flex-col gap-4 lg:gap-5">
            <ScrollStaggerFadeUp className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
              {smallStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.id} className={`bento-stat bento-card p-6 ${stat.border} shadow-depth ${BENTO_TILE_INTERACTION}`}>
                    <div
                      className="absolute top-0 left-0 w-32 h-32 rounded-full pointer-events-none"
                      style={{ background: `radial-gradient(circle, ${stat.glow} 0%, transparent 70%)`, filter: 'blur(24px)', transform: 'translate(-30%, -30%)' }}
                      aria-hidden="true"
                    />

                    {/* Badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold mb-4 ${stat.badgeColor}`}>
                      {stat.badge}
                    </span>

                    {/* Icon */}
                    <div className="w-9 h-9 rounded-xl bg-solaris-gold/10 border border-solaris-gold/15 flex items-center justify-center mb-3">
                      <Icon className="w-[18px] h-[18px] text-solaris-gold" />
                    </div>

                    {/* Number */}
                    <div className="font-display font-black text-[clamp(28px,4vw,44px)] leading-none tracking-tighter mb-1">
                      <AnimatedCounter
                        end={stat.value}
                        duration={2}
                        suffix={stat.suffix}
                        decimals={stat.id === 'supply' ? TOKEN_DECIMALS : 0}
                        className={stat.accentClass || stat.color}
                        meshTitleKey={`statsBento|${stat.id}`}
                      />
                    </div>

                    <p className="text-solaris-text text-sm font-semibold mb-1">{stat.label}</p>
                    <p className="text-solaris-muted text-xs leading-relaxed">{stat.sublabel}</p>
                  </div>
                );
              })}
            </ScrollStaggerFadeUp>

            {/* Trust bar */}
            <div
              className={`bento-stat bento-card p-5 border border-white/5 shadow-depth flex flex-col md:flex-row items-center gap-5 ${BENTO_TILE_INTERACTION}`}
            >
              <p className="text-solaris-muted text-xs font-mono uppercase tracking-widest shrink-0">{t.statsBento.verifiedBy}</p>
              <div className="flex flex-wrap items-center gap-4 flex-1">
                {TRUST_BADGES.map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-2 text-xs font-semibold text-solaris-text">
                    <Icon className="w-3.5 h-3.5 text-solaris-gold shrink-0" />
                    {label}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                <span className="text-emerald-400 text-xs font-mono font-bold">ALL SYSTEMS LIVE</span>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-8 max-w-3xl mx-auto w-full">
          <MeshSkillRibbon variant="compact" saltOffset={1020} className="border-fuchsia-500/12 bg-fuchsia-500/[0.03]" />
        </div>
      </div>
    </section>
  );
};

export default StatsBento;
