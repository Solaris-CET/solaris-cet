import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { shortSkillWhisper } from '@/lib/meshSkillFeed';

interface MeshSkillRibbonProps {
  /** Shifts the whisper sequence vs other tickers on the page */
  saltOffset?: number;
  className?: string;
  /** Tighter strip for footers / tickers */
  variant?: 'default' | 'compact';
}

/**
 * Rotating one-liner of recombinant mesh skills — for team / marketing surfaces.
 */
const MeshSkillRibbon = ({ saltOffset = 60, className = '', variant = 'default' }: MeshSkillRibbonProps) => {
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      setTick((n) => n + 1);
    }, 5400);
    return () => window.clearInterval(id);
  }, [reduce]);

  const line = shortSkillWhisper(tick + saltOffset);

  if (variant === 'compact') {
    return (
      <div
        className={`rounded-lg border border-fuchsia-500/15 bg-fuchsia-500/[0.04] px-3 py-2 ${className}`}
        aria-live="polite"
        aria-label="Mesh skill sample"
      >
        <p
          className="text-[10px] sm:text-[11px] font-mono text-fuchsia-200/85 leading-snug line-clamp-1 text-center"
          title={line}
        >
          {line}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/[0.05] px-4 py-3 mb-8 ${className}`}
      aria-live="polite"
      aria-label="Sample recombinant skill expression from the agent mesh"
    >
      <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-fuchsia-400/90 mb-1">
        Mesh skill sample · live rotation
      </div>
      <p className="text-xs sm:text-sm font-mono text-fuchsia-100/88 leading-snug line-clamp-2" title={line}>
        {line}
      </p>
    </div>
  );
};

export default MeshSkillRibbon;
