import {
Brain, Code2, Coins,   Crown, FileCheck,
Globe,
Palette, Shield, TrendingUp,   Users, } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useNearScreen } from '@/hooks/useNearScreen';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  meshStandardBurstFromKey,
  meshWhisperFromKey,
  skillCaptionForDept,
} from '@/lib/meshSkillFeed';

interface DeptIntel {
  id: string;
  name: string;
  icon: typeof Crown;
  color: string;
  bar: string;
  /** Target intelligence index (display 0–100 scale) */
  target: number;
  /** Starting point before animation */
  base: number;
}

const departments: DeptIntel[] = [
  { id: 'customer-ops', name: 'Customer Operations', icon: Users, color: 'text-cyan-400', bar: 'bg-cyan-400', target: 94, base: 62 },
  { id: 'engineering', name: 'Engineering', icon: Code2, color: 'text-blue-400', bar: 'bg-blue-400', target: 97, base: 68 },
  { id: 'sales', name: 'Sales & Growth', icon: TrendingUp, color: 'text-emerald-400', bar: 'bg-emerald-400', target: 91, base: 58 },
  { id: 'data-intelligence', name: 'Data & Intelligence', icon: Brain, color: 'text-purple-400', bar: 'bg-purple-400', target: 99, base: 72 },
  { id: 'finance', name: 'Finance & Analytics', icon: Coins, color: 'text-solaris-gold', bar: 'bg-solaris-gold', target: 93, base: 64 },
  { id: 'marketing', name: 'Marketing & Content', icon: Globe, color: 'text-orange-400', bar: 'bg-orange-400', target: 89, base: 55 },
  { id: 'product-design', name: 'Product & Design', icon: Palette, color: 'text-pink-400', bar: 'bg-pink-400', target: 90, base: 57 },
  { id: 'security', name: 'Security & Compliance', icon: Shield, color: 'text-red-400', bar: 'bg-red-400', target: 98, base: 70 },
  { id: 'legal', name: 'Legal & Risk', icon: FileCheck, color: 'text-amber-400', bar: 'bg-amber-400', target: 96, base: 66 },
  { id: 'research', name: 'Research & Innovation', icon: Crown, color: 'text-solaris-cyan', bar: 'bg-solaris-cyan', target: 100, base: 74 },
];

/**
 * Per-department intelligence index with bars that grow toward targets and slowly drift upward while visible.
 */
const DepartmentIntelligenceScores = () => {
  const { isNearScreen, fromRef } = useNearScreen({ distance: '120px' });
  const prefersReducedMotion = useReducedMotion();

  const initial = useMemo(
    () => Object.fromEntries(departments.map(d => [d.id, d.base])) as Record<string, number>,
    []
  );

  const [scores, setScores] = useState<Record<string, number>>(initial);
  const [skillTick, setSkillTick] = useState(0);

  // Rotating recombinant captions per department (mesh-bound)
  useEffect(() => {
    if (!isNearScreen || prefersReducedMotion) return;
    const id = window.setInterval(() => {
      setSkillTick((t) => t + 1);
    }, 5200);
    return () => window.clearInterval(id);
  }, [isNearScreen, prefersReducedMotion]);

  // Reduced motion: snap bars to target when section is visible (no animation).
  useEffect(() => {
    if (!prefersReducedMotion || !isNearScreen) return;
    const id = requestAnimationFrame(() => {
      setScores(Object.fromEntries(departments.map(d => [d.id, d.target])) as Record<string, number>);
    });
    return () => cancelAnimationFrame(id);
  }, [prefersReducedMotion, isNearScreen]);

  // Ramp from base → target when section nears viewport
  useEffect(() => {
    if (!isNearScreen || prefersReducedMotion) return;

    const duration = 2400;
    const start = performance.now();
    const from = { ...initial };

    let frame: number;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - (1 - t) ** 3;
      const next: Record<string, number> = {};
      for (const d of departments) {
        next[d.id] = from[d.id]! + (d.target - from[d.id]!) * ease;
      }
      setScores(next);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [isNearScreen, prefersReducedMotion, initial]);

  // Ongoing “learning” tick while on screen (capped below 100.5)
  useEffect(() => {
    if (!isNearScreen || prefersReducedMotion) return;
    const id = window.setInterval(() => {
      setScores(prev => {
        const next = { ...prev };
        for (const d of departments) {
          const cap = d.target + 0.35;
          const bump = Math.random() * 0.12;
          next[d.id] = Math.min(cap, (next[d.id] ?? d.target) + bump);
        }
        return next;
      });
    }, 1400);
    return () => window.clearInterval(id);
  }, [isNearScreen, prefersReducedMotion]);

  return (
    <div ref={fromRef} className="bento-card border border-white/10 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Brain className="w-4 h-4 text-solaris-gold" />
        <span className="hud-label text-solaris-gold text-[10px]">DEPARTMENT INTELLIGENCE · DYNAMIC SCORE</span>
      </div>
      <p className="text-solaris-muted text-xs mb-5 max-w-2xl">
        Each division runs thousands of specialists; the intelligence index aggregates retrieval quality, dual-model
        agreement, and task success — rising as the mesh trains on live corpora.
      </p>

      <ul className="space-y-3.5">
        {departments.map(d => {
          const Icon = d.icon;
          const v = scores[d.id] ?? d.base;
          const pct = Math.min(100, Math.max(0, v));
          const skillLine = skillCaptionForDept(d.id, skillTick);
          const rowMeshTitle = [
            meshStandardBurstFromKey(`deptIntel|row|${d.id}`),
            meshWhisperFromKey(`deptIntel|whisper|${d.id}`),
          ].join('\n—\n');
          const captionTitle = `${skillLine}\n—\n${meshWhisperFromKey(`deptIntel|caption|${d.id}|${skillTick}`)}`;
          return (
            <li
              key={d.id}
              className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3"
              title={rowMeshTitle}
            >
              <div className="flex items-center gap-2 min-w-0 sm:w-[200px] shrink-0">
                <div className={`w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 ${d.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span
                  className="text-[11px] sm:text-xs text-solaris-text truncate"
                  title={meshWhisperFromKey(`deptIntel|name|${d.id}`)}
                >
                  {d.name}
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full ${d.bar} transition-[width] duration-500 ease-out shadow-[0_0_12px_rgba(242,201,76,0.15)]`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`font-mono text-xs tabular-nums w-12 text-right shrink-0 ${d.color}`}>
                    {pct.toFixed(1)}
                  </span>
                </div>
                <p
                  className="text-[9px] font-mono text-white/35 leading-snug truncate pl-0 sm:pl-9"
                  title={captionTitle}
                >
                  {skillLine}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default DepartmentIntelligenceScores;
