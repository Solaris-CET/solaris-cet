/**
 * Deployment artifact seal: short git hash + build ISO timestamp (injected at build via vite.config).
 */
import { useLanguage } from "../hooks/useLanguage"

export function BuildSeal() {
  const { t } = useLanguage()
  const commit = import.meta.env.VITE_GIT_COMMIT_HASH || "unknown"
  const buildTime = import.meta.env.VITE_BUILD_TIMESTAMP || ""
  const date = buildTime.slice(0, 10)
  const ariaLabel = t.common.buildSealAriaLabel.replace("{commit}", commit).replace("{date}", date)

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[200] opacity-30 transition-opacity motion-reduce:transition-none hover:pointer-events-auto hover:opacity-100"
      role="status"
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <div className="rounded border border-white/10 bg-slate-950/90 px-3 py-1 font-mono text-[9px] tracking-widest text-slate-500 shadow-lg backdrop-blur-sm">
        <span aria-hidden={true}>BUILD:</span>
        <span className="ml-1 text-solaris-gold/80" aria-hidden={true}>
          {commit}
        </span>
        <span className="mx-1 text-slate-600" aria-hidden={true}>
          |
        </span>
        <span aria-hidden={true}>{date}</span>
      </div>
    </div>
  )
}
