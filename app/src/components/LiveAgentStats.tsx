import { AlertTriangle, Brain, CheckCircle, Dna,Lightbulb, MessageCircle } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';

import {
  meshStandardBurstFromKey,
  shortSkillWhisper,
  skillSeedFromLabel,
} from '@/lib/meshSkillFeed';

// ─── Live counters that increment naturally over time ─────────────────────

interface Counter {
  label: string;
  base: number;
  perSecond: number;
  icon: typeof Brain;
  color: string;
}

const COUNTERS: Counter[] = [
  { label: 'Tasks Solved',    base: 1_847_293, perSecond: 4.7,  icon: CheckCircle,   color: 'text-emerald-400' },
  { label: 'Lessons Learned', base: 892_441,   perSecond: 2.1,  icon: Lightbulb,     color: 'text-solaris-gold' },
  { label: 'Conversations',   base: 3_294_817, perSecond: 8.3,  icon: MessageCircle, color: 'text-solaris-cyan' },
  { label: 'Alerts Resolved', base: 241_087,   perSecond: 0.9,  icon: AlertTriangle, color: 'text-purple-400' },
  { label: 'Skill Loci Live', base: 1_203_884, perSecond: 5.2,  icon: Dna,           color: 'text-fuchsia-400' },
];

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/**
 * True only in the browser after the client snapshot is active.
 * Server + hydration first pass use `getServerSnapshot` (false) so markup matches
 * and we avoid SSR/client drift for time-dependent UI.
 * @see https://react.dev/reference/react/useSyncExternalStore#adding-support-for-server-rendering
 */
function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/**
 * LiveAgentStats — live-incrementing counters showing cumulative
 * Solaris CET agent activity since network genesis.
 * Values start from realistic baselines and increment each second.
 */
const LiveAgentStats = () => {
  const isClient = useIsClient();
  const [counts, setCounts] = useState<number[]>(COUNTERS.map(c => c.base));

  useEffect(() => {
    if (!isClient) return;
    const interval = setInterval(() => {
      setCounts(prev => prev.map((v, i) => v + COUNTERS[i].perSecond));
    }, 1000);
    return () => clearInterval(interval);
  }, [isClient]);

  if (!isClient) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {COUNTERS.map((counter, i) => {
        const Icon = counter.icon;
        return (
          <div
            key={counter.label}
            className="bento-card p-4 border border-white/8 text-center shadow-depth"
            title={meshStandardBurstFromKey(`liveAgentStats|aggregate|${counter.label}`)}
          >
            <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-4 h-4 ${counter.color}`} />
            </div>
            <div className={`font-display font-black text-xl tabular-nums ${counter.color} number-reveal`}
              style={{ animationDelay: `${i * 0.1}s` }}>
              {formatNum(counts[i])}
            </div>
            <div className="text-solaris-muted text-[10px] font-mono uppercase tracking-wider mt-0.5">
              {counter.label}
            </div>
            <p
              className="mt-2 text-[9px] font-mono text-fuchsia-200/65 leading-snug line-clamp-2 border-t border-fuchsia-500/10 pt-1.5"
              title={shortSkillWhisper(skillSeedFromLabel(`liveAgentStats|${counter.label}`))}
            >
              {shortSkillWhisper(skillSeedFromLabel(`liveAgentStats|${counter.label}`))}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default LiveAgentStats;
