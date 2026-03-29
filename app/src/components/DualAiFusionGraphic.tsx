import { useReducedMotion } from '../hooks/useReducedMotion';

/**
 * Visual diagram: Grok × Gemini converging on Solaris with RAV (Reason · Act · Verify)
 * as the unique orchestration layer — pure CSS/Tailwind, no external assets.
 */
export default function DualAiFusionGraphic() {
  const reduced = useReducedMotion();

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-[22vh] z-[8] w-[min(94vw,440px)] -translate-x-1/2 md:top-[27vh]"
      aria-hidden
    >
      <div className="relative mx-auto flex items-center justify-between gap-1 px-1 sm:gap-2">
        {/* Grok — Act lane */}
        <div className="flex min-w-0 flex-[0_0_26%] flex-col items-center gap-1.5">
          <div
            className="relative w-full max-w-[100px] rounded-2xl border border-amber-500/35 bg-gradient-to-b from-amber-950/80 to-zinc-950/90 px-2 py-2.5 text-center shadow-[0_0_24px_-4px_rgba(245,158,11,0.35)] backdrop-blur-sm sm:max-w-[110px] sm:py-3"
            title="xAI Grok — Act"
          >
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-200/90">
              Grok
            </div>
            <div className="mt-0.5 text-[10px] text-amber-100/70">Act</div>
          </div>
        </div>

        {/* Fusion beams + Solaris core */}
        <div className="relative flex min-w-0 flex-1 flex-col items-center justify-center">
          {/* Horizontal energy rails */}
          <div className="absolute inset-x-0 top-1/2 z-0 h-px -translate-y-1/2 bg-gradient-to-r from-amber-500/50 via-solaris-gold/60 to-blue-500/50" />
          <div
            className={
              reduced
                ? 'absolute inset-x-0 top-1/2 z-0 h-[3px] -translate-y-1/2 bg-gradient-to-r from-amber-500/20 via-solaris-gold/25 to-blue-500/20 blur-[6px]'
                : 'absolute inset-x-0 top-1/2 z-0 h-[3px] -translate-y-1/2 animate-pulse bg-gradient-to-r from-amber-500/25 via-solaris-gold/35 to-blue-500/25 blur-[8px]'
            }
          />

          <div className="relative z-10 flex flex-col items-center">
            {/* Outer RAV ring */}
            <div
              className="relative flex h-[min(28vw,120px)] w-[min(28vw,120px)] items-center justify-center rounded-full border border-solaris-gold/25 bg-zinc-950/60 shadow-[0_0_40px_-8px_rgba(242,201,76,0.45),inset_0_0_32px_rgba(46,231,255,0.06)] backdrop-blur-md sm:h-[128px] sm:w-[128px]"
              title="Solaris — Dual-AI core"
            >
              <div className="absolute inset-1 rounded-full border border-dashed border-solaris-cyan/20" />
              {/* RAV on ring: R→Gemini (Reason), A→Grok (Act), V→cross-verify */}
              <span
                className="absolute right-0 top-[18%] rounded-full bg-blue-500/20 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-blue-200/95 ring-1 ring-blue-400/30"
                title="Reason — Gemini"
              >
                R
              </span>
              <span
                className="absolute left-0 top-[18%] rounded-full bg-amber-500/20 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-amber-200/95 ring-1 ring-amber-400/30"
                title="Act — Grok"
              >
                A
              </span>
              <span
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-emerald-200/90 ring-1 ring-emerald-400/25"
                title="Verify"
              >
                V
              </span>

              {/* Solaris glyph */}
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-solaris-gold/30 via-amber-200/20 to-solaris-cyan/25 shadow-[0_0_28px_rgba(242,201,76,0.5)] ring-2 ring-solaris-gold/40 sm:h-16 sm:w-16">
                <div className="absolute inset-1 rounded-full bg-gradient-to-t from-zinc-950/90 to-zinc-900/40" />
                <svg
                  viewBox="0 0 32 32"
                  className="relative z-[1] h-8 w-8 text-solaris-gold drop-shadow-[0_0_12px_rgba(242,201,76,0.8)]"
                  fill="currentColor"
                  aria-hidden
                >
                  <circle cx="16" cy="16" r="5.5" className="opacity-95" />
                  <path
                    d="M16 3.5 L17.4 12.2 L16 9.8 L14.6 12.2 Z M16 28.5 L17.4 19.8 L16 22.2 L14.6 19.8 Z M3.5 16 L12.2 14.6 L9.8 16 L12.2 17.4 Z M28.5 16 L19.8 14.6 L22.2 16 L19.8 17.4 Z"
                    className="opacity-75"
                  />
                </svg>
              </div>
            </div>

            <div className="mt-2 text-center">
              <div className="font-display text-[11px] font-bold uppercase tracking-[0.35em] text-solaris-text/95 sm:text-xs">
                Solaris
              </div>
              <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.28em] text-solaris-cyan/90 sm:text-[10px]">
                RAV Protocol
              </div>
              <div className="mt-1 max-w-[200px] font-mono text-[8px] leading-tight text-solaris-muted/90 sm:text-[9px]">
                Reason · Act · Verify
              </div>
            </div>
          </div>
        </div>

        {/* Gemini — Reason lane */}
        <div className="flex min-w-0 flex-[0_0_26%] flex-col items-center gap-1.5">
          <div
            className="relative w-full max-w-[100px] rounded-2xl border border-blue-500/40 bg-gradient-to-b from-blue-950/85 to-zinc-950/90 px-2 py-2.5 text-center shadow-[0_0_24px_-4px_rgba(59,130,246,0.4)] backdrop-blur-sm sm:max-w-[110px] sm:py-3"
            title="Google Gemini — Reason"
          >
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-200/95">
              Gemini
            </div>
            <div className="mt-0.5 text-[10px] text-blue-100/75">Reason</div>
          </div>
        </div>
      </div>

      {/* Fusion caption — competitive positioning */}
      <p className="mt-3 text-center font-mono text-[8px] uppercase tracking-[0.2em] text-solaris-muted/70 sm:text-[9px]">
        Dual-AI fusion · single RAV orchestration
      </p>
    </div>
  );
}
