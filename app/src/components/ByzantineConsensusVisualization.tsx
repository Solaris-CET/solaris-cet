import { useLanguage } from "@/hooks/useLanguage"
import { interpolatePlaceholders } from "@/lib/numerals"

const NODE_COUNT = 21
const HONEST = 19
const FAULTY = 1
const TOTAL = NODE_COUNT

/**
 * Illustrative BFT-style cluster (narrative — not a live TON validator map).
 */
export function ByzantineConsensusVisualization() {
  const { t } = useLanguage()
  const a = t.sectionAria

  return (
    <div
      className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm"
      role="group"
      aria-label={a.bftConsensusDemo}
    >
      <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400 mb-2">
        {a.bftConsensusHeading}
      </h3>
      <p className="text-solaris-muted text-sm mb-5 max-w-xl">{a.bftConsensusDemo}</p>

      <div
        className="grid grid-cols-7 gap-2 max-w-[400px] mx-auto justify-items-center"
        role="list"
        aria-label={a.bftConsensusHeading}
      >
        {Array.from({ length: NODE_COUNT }, (_, i) => {
          const isLeader = i === 0
          const isByzantine = i === 10
          const cls = isLeader
            ? "border-solaris-gold text-solaris-gold shadow-[0_0_16px_rgba(242,201,76,0.35)] motion-safe:animate-bft-leader"
            : isByzantine
              ? "border-red-500/80 text-red-400/90 motion-safe:animate-bft-glitch"
              : "border-emerald-500/70 text-emerald-400/90 motion-safe:animate-bft-honest"
          const nodeLabel = isLeader
            ? a.bftNodeLeader
            : isByzantine
              ? a.bftNodeByzantine
              : a.bftNodeHonest
          return (
            <div
              key={i}
              role="listitem"
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center text-[9px] font-mono ${cls}`}
              title={nodeLabel}
              aria-label={`${nodeLabel} · ${i + 1}`}
            >
              {i + 1}
            </div>
          )
        })}
      </div>

      <div className="mt-5 flex flex-wrap justify-between gap-3 text-[11px] font-mono text-slate-500">
        <span className="text-emerald-400/90">
          {interpolatePlaceholders(a.bftStatsHonest, { honest: HONEST, total: TOTAL })}
        </span>
        <span className="text-red-400/80">
          {interpolatePlaceholders(a.bftStatsFaulty, { faulty: FAULTY, total: TOTAL })}
        </span>
        <span className="text-solaris-gold/80">{a.bftStatsTolerance}</span>
      </div>
      <p className="mt-2 text-[10px] text-slate-600 font-mono">{a.bftEducationalNote}</p>
    </div>
  )
}
