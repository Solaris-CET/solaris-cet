import { useTonWallet } from '@tonconnect/ui-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { type TransactionRow,TransactionTable } from '@/components/TransactionTable'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { useDataSaver } from '@/hooks/useDataSaver'
import { useDocumentHidden } from '@/hooks/useDocumentHidden'
import { useJwtSession } from '@/hooks/useJwtSession'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useTonNetwork } from '@/hooks/useTonNetwork'
import { readEnvelope, writeEnvelope } from '@/lib/localJsonStore'

type TxItem = {
  hash: string
  now: string
  type: string
  lt?: string
  amountNanoTon?: string
}

export default function TxHistoryPage() {
  const wallet = useTonWallet()
  const address = wallet?.account?.address?.trim() ?? ''
  const { token } = useJwtSession()
  const { network, tonscanBaseUrl } = useTonNetwork()
  const online = useOnlineStatus()
  const hidden = useDocumentHidden()
  const { enabled: dataSaver } = useDataSaver()
  const [items, setItems] = useState<TxItem[]>([])
  const [filter, setFilter] = useState<'all' | 'transfer' | 'contract' | 'staking'>('all')
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const pullRef = useRef<{ y0: number; pulling: boolean; dy: number }>({ y0: 0, pulling: false, dy: 0 })
  const [pullDy, setPullDy] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const cacheKey = useMemo(() => {
    if (!address) return ''
    return `solaris_tx_cache:${network}:${address}:${filter}`
  }, [address, filter, network])

  const fetchFirstPage = useCallback(async (signal: AbortSignal) => {
    if (!address) return
    if (!online || hidden) return
    setLoading(true)
    setError(null)
    try {
      if (filter === 'staking') {
        if (!token) {
          setError('unauthorized')
          setItems([])
          return
        }
        const res = await fetch('/api/web3/intents', {
          cache: 'no-store',
          signal,
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = (await res.json()) as { ok?: unknown; intents?: unknown }
        if (!res.ok || json.ok !== true || !Array.isArray(json.intents)) {
          setError('unavailable')
          setItems([])
          return
        }
        const stakingItems = (json.intents as Array<{ id?: string; type?: string; status?: string; createdAt?: string }>).filter((r) =>
          r?.type === 'stake' || r?.type === 'unstake' || r?.type === 'claim'
        )
        const next = stakingItems
          .map((r) => ({
            hash: r.id ?? '',
            now: r.createdAt ?? '',
            type: `${r.type ?? 'staking'}:${r.status ?? 'created'}`,
          }))
          .filter((r) => r.hash)
        setItems(next)
        setCursor(null)
        setHasMore(false)
        if (cacheKey) writeEnvelope(cacheKey, next)
      } else {
        const res = await fetch(
          `/api/ton/txs?address=${encodeURIComponent(address)}&network=${encodeURIComponent(network)}&type=${encodeURIComponent(filter)}&limit=20`,
          { cache: 'no-store', signal },
        )
        const json = (await res.json()) as { ok?: unknown; items?: unknown; error?: unknown; nextCursor?: unknown }
        if (!res.ok || json.ok !== true || !Array.isArray(json.items)) {
          setError(typeof json.error === 'string' ? json.error : 'unavailable')
          setItems([])
          setCursor(null)
          setHasMore(false)
          return
        }
        const next = json.items as TxItem[]
        setItems(next)
        const nextCursor = typeof json.nextCursor === 'string' && json.nextCursor ? json.nextCursor : null
        setCursor(nextCursor)
        setHasMore(Boolean(nextCursor && next.length >= 20))
        if (cacheKey) writeEnvelope(cacheKey, next)
      }
    } catch {
      const cached = cacheKey ? readEnvelope<TxItem[]>(cacheKey, 1000 * 60 * 60 * 24 * 3) : null
      if (cached) {
        setItems(cached)
        setError(null)
        setCursor(null)
        setHasMore(false)
      } else {
        setError('unavailable')
        setItems([])
        setCursor(null)
        setHasMore(false)
      }
    } finally {
      setLoading(false)
    }
  }, [address, cacheKey, filter, hidden, network, online, token])

  const fetchMore = useCallback(async () => {
    if (!address) return
    if (filter === 'staking') return
    if (!cursor || !hasMore) return
    if (!online || hidden) return
    setLoadingMore(true)
    try {
      const res = await fetch(
        `/api/ton/txs?address=${encodeURIComponent(address)}&network=${encodeURIComponent(network)}&type=${encodeURIComponent(filter)}&limit=20&beforeLt=${encodeURIComponent(cursor)}`,
        { cache: 'no-store' },
      )
      const json = (await res.json()) as { ok?: unknown; items?: unknown; nextCursor?: unknown }
      if (!res.ok || json.ok !== true || !Array.isArray(json.items)) {
        setHasMore(false)
        return
      }
      const next = json.items as TxItem[]
      setItems((prev) => {
        const merged = [...prev, ...next]
        if (cacheKey && next.length) writeEnvelope(cacheKey, merged)
        return merged
      })
      const nextCursor = typeof json.nextCursor === 'string' && json.nextCursor ? json.nextCursor : null
      setCursor(nextCursor)
      setHasMore(Boolean(nextCursor && next.length >= 20))
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [address, cacheKey, cursor, filter, hasMore, hidden, network, online])

  useEffect(() => {
    if (!address) return
    let alive = true
    const controller = new AbortController()
    const cached = cacheKey ? readEnvelope<TxItem[]>(cacheKey, 1000 * 60 * 60 * 24 * 3) : null
    if (cached) setItems(cached)
    void fetchFirstPage(controller.signal)
    const intervalMs = dataSaver ? 90_000 : 30_000
    const id = window.setInterval(() => {
      if (!alive) return
      if (items.length <= 20) void fetchFirstPage(controller.signal)
    }, intervalMs)
    return () => {
      alive = false
      controller.abort()
      window.clearInterval(id)
    }
  }, [address, cacheKey, dataSaver, fetchFirstPage, filter, items.length, network, token])

  const doRefresh = useCallback(async () => {
    if (!address) return
    setRefreshing(true)
    const controller = new AbortController()
    try {
      await fetchFirstPage(controller.signal)
    } finally {
      controller.abort()
      setRefreshing(false)
    }
  }, [address, fetchFirstPage])

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (window.scrollY > 0) return
      const t = e.touches[0]
      if (!t) return
      pullRef.current = { y0: t.clientY, pulling: true, dy: 0 }
    }
    const onMove = (e: TouchEvent) => {
      const st = pullRef.current
      if (!st.pulling) return
      if (window.scrollY > 0) {
        st.pulling = false
        setPullDy(0)
        return
      }
      const t = e.touches[0]
      if (!t) return
      const dy = Math.max(0, t.clientY - st.y0)
      st.dy = dy
      setPullDy(Math.min(90, dy * 0.55))
    }
    const onEnd = () => {
      const st = pullRef.current
      const should = st.pulling && st.dy > 90
      st.pulling = false
      st.dy = 0
      setPullDy(0)
      if (should) void doRefresh()
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    window.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [doRefresh])

  const rows = useMemo(() => items, [items])
  const tableRows = useMemo(() => rows as TransactionRow[], [rows])
  const { elementRef, isVisible } = useIntersectionObserver<HTMLDivElement>({
    rootMargin: '600px',
    freezeOnceVisible: false,
    threshold: 0,
  })

  useEffect(() => {
    if (!isVisible) return
    if (loading || loadingMore || refreshing) return
    void fetchMore()
  }, [fetchMore, isVisible, loading, loadingMore, refreshing])

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[70vh] px-6 py-20">
      <div className="max-w-5xl mx-auto">
        {pullDy || refreshing ? (
          <div className="fixed top-[max(4.25rem,calc(env(safe-area-inset-top)+4.25rem))] inset-x-0 z-[901] pointer-events-none">
            <div className="mx-auto w-fit rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[11px] text-white/70">
              {refreshing ? 'Se actualizează…' : 'Trage pentru refresh'}
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-white text-2xl font-semibold tracking-tight">Istoric tranzacții</h1>
            <p className="mt-2 text-white/70 text-sm">Indexer via TonAPI + linkuri TONScan.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/wallet" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">Wallet</a>
            <a href="/settings" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">Setări</a>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="text-xs text-white/60 font-mono">Wallet</div>
          <div className="mt-1 text-sm text-white font-mono break-all">{address ? address : 'Neconectat'}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className={
                filter === 'all'
                  ? 'px-3 py-2 rounded-xl bg-solaris-gold/20 text-solaris-gold text-xs font-mono'
                  : 'px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono'
              }
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={
                filter === 'transfer'
                  ? 'px-3 py-2 rounded-xl bg-solaris-gold/20 text-solaris-gold text-xs font-mono'
                  : 'px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono'
              }
              onClick={() => setFilter('transfer')}
            >
              Transfer
            </button>
            <button
              type="button"
              className={
                filter === 'contract'
                  ? 'px-3 py-2 rounded-xl bg-solaris-gold/20 text-solaris-gold text-xs font-mono'
                  : 'px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono'
              }
              onClick={() => setFilter('contract')}
            >
              Contract
            </button>
            <button
              type="button"
              className={
                filter === 'staking'
                  ? 'px-3 py-2 rounded-xl bg-solaris-gold/20 text-solaris-gold text-xs font-mono'
                  : 'px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono'
              }
              onClick={() => setFilter('staking')}
            >
              Staking
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="text-xs text-white/60 font-mono">Rețea: {network}</div>
            {filter !== 'staking' && hasMore ? (
              <div className="text-xs text-white/60 font-mono">{rows.length} loaded</div>
            ) : null}
          </div>

          <TransactionTable rows={tableRows} tonscanBaseUrl={tonscanBaseUrl} loading={loading} error={error} />
          {filter !== 'staking' && hasMore ? (
            <div ref={elementRef} className="p-4 border-t border-white/10 text-center text-xs text-white/60">
              {loadingMore ? 'Se încarcă mai multe…' : 'Scroll pentru mai multe'}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}
