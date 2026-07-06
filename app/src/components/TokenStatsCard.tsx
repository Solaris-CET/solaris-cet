import { Database } from 'lucide-react'
import { Suspense, use } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { TOKEN_DECIMALS } from '@/constants/token'
import { useLivePoolData } from '@/hooks/use-live-pool-data'
import type { ChainState } from '@/lib/chain-state'
import { chainStatePromise } from '@/lib/chain-state'
import { shortSkillWhisper, skillSeedFromLabel } from '@/lib/meshSkillFeed'

function fmtNumber(v: number, opts?: Intl.NumberFormatOptions) {
  try {
    return v.toLocaleString(undefined, opts)
  } catch {
    return String(v)
  }
}

function fmtUsd(v: number) {
  return `$${fmtNumber(v, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
}

function TokenStatsCardContent() {
  const state: ChainState = use(chainStatePromise)
  const pool = useLivePoolData()

  const supply = state.token.totalSupply ? Number.parseFloat(state.token.totalSupply) : null
  const priceUsd = pool.priceUsd
  const marketCap = supply && priceUsd ? supply * priceUsd : null
  const updatedLabel = (() => {
    try {
      return new Date(state.updatedAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return state.updatedAt
    }
  })()

  const rows: Array<{ label: string; value: string; color: string }> = [
    {
      label: 'Price',
      value: priceUsd ? fmtUsd(priceUsd) : '—',
      color: 'text-emerald-300',
    },
    {
      label: 'TVL',
      value: pool.tvlUsd ? fmtUsd(pool.tvlUsd) : '—',
      color: 'text-solaris-cyan',
    },
    {
      label: 'Total Supply',
      value:
        supply !== null && Number.isFinite(supply)
          ? `${fmtNumber(supply, { minimumFractionDigits: 0, maximumFractionDigits: TOKEN_DECIMALS })} ${state.token.symbol}`
          : '—',
      color: 'text-solaris-gold',
    },
    {
      label: 'Market Cap',
      value: marketCap ? fmtUsd(marketCap) : '—',
      color: 'text-fuchsia-200',
    },
  ]

  return (
    <div className="bento-card p-5 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-solaris-gold/10 flex items-center justify-center">
            <Database className="w-4 h-4 text-solaris-gold" aria-hidden />
          </div>
          <span className="hud-label text-solaris-gold">Token Stats</span>
          {pool.loading ? (
            <span className="text-[10px] text-white/60 font-mono">LIVE…</span>
          ) : pool.error ? (
            <span className="text-[10px] text-red-300 font-mono">LIVE ERR</span>
          ) : (
            <span className="text-[10px] text-emerald-300 font-mono">LIVE OK</span>
          )}
        </div>
        <span className="text-[10px] text-solaris-muted font-mono">Indexed {updatedLabel}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {rows.map((row) => (
          <div key={row.label} className="p-3 rounded-lg bg-white/5">
            <div className="text-solaris-muted text-[11px] mb-1">{row.label}</div>
            <div className={`font-mono font-semibold text-sm ${row.color}`}>{row.value}</div>
            <p
              className="mt-2 text-[9px] font-mono text-fuchsia-200/65 leading-snug line-clamp-2 border-t border-fuchsia-500/10 pt-1.5"
              title={shortSkillWhisper(skillSeedFromLabel(`tokenStats|${row.label}`))}
            >
              {shortSkillWhisper(skillSeedFromLabel(`tokenStats|${row.label}`))}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function TokenStatsCardSkeleton() {
  return (
    <div className="bento-card p-5 lg:p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-solaris-gold/10 flex items-center justify-center" />
        <div className="flex-1">
          <Skeleton className="h-4 w-28 bg-white/10" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-16 rounded-lg bg-white/10" />
        <Skeleton className="h-16 rounded-lg bg-white/10" />
        <Skeleton className="h-16 rounded-lg bg-white/10" />
        <Skeleton className="h-16 rounded-lg bg-white/10" />
      </div>
    </div>
  )
}

export function TokenStatsCard() {
  return (
    <Suspense fallback={<TokenStatsCardSkeleton />}>
      <TokenStatsCardContent />
    </Suspense>
  )
}

