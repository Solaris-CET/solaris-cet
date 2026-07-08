import { ExternalLink } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useTonNetwork } from '@/hooks/useTonNetwork'
import { CET_CONTRACT_ADDRESS } from '@/lib/cetContract'
import { truncateAddress } from '@/lib/utils'

type IndexedTx = {
  txHash: string
  occurredAt: string
  kind: string
}

function resolveContractFromPathname(pathname: string): string {
  const marker = '/contract'
  const idx = pathname.indexOf(marker)
  if (idx < 0) return ''
  const after = pathname.slice(idx + marker.length)
  const parts = after.split('/').filter(Boolean)
  const candidate = parts[0] ? decodeURIComponent(parts[0]) : ''
  return candidate.trim()
}

export default function ContractPage() {
  const { network, tonscanBaseUrl } = useTonNetwork()
  const [input, setInput] = useState('')
  const [txs, setTxs] = useState<IndexedTx[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const address = useMemo(() => {
    const path = typeof window === 'undefined' ? '' : window.location.pathname
    const fromPath = resolveContractFromPathname(path)
    return fromPath || CET_CONTRACT_ADDRESS
  }, [])

  useEffect(() => {
    setInput(address)
  }, [address])

  const load = useCallback(
    async (addr: string, signal: AbortSignal) => {
      if (!addr) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/ton/indexed-txs?address=${encodeURIComponent(addr)}&network=${encodeURIComponent(network)}&limit=50`,
          { cache: 'no-store', signal },
        )
        const json = (await res.json().catch(() => null)) as { ok?: unknown; items?: unknown; error?: unknown } | null
        if (!res.ok || json?.ok !== true || !Array.isArray(json.items)) {
          setTxs([])
          setError(typeof json?.error === 'string' ? json.error : 'unavailable')
          return
        }
        setTxs(json.items as IndexedTx[])
      } catch {
        setTxs([])
        setError('unavailable')
      } finally {
        setLoading(false)
      }
    },
    [network],
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(address, controller.signal)
    return () => controller.abort()
  }, [address, load])

  const explorerUrl = `${tonscanBaseUrl}/address/${encodeURIComponent(address)}`

  const applyAddress = () => {
    const next = input.trim()
    if (!next) return
    window.location.assign(`/contract/${encodeURIComponent(next)}`)
  }

  return (
    <main id="main-content" tabIndex={-1} className="relative min-h-[70vh] w-full pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0">
      <div className="section-padding-x max-w-5xl mx-auto w-full pt-24 pb-16">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-white text-2xl font-semibold tracking-tight">Contract</h1>
            <p className="mt-2 text-white/70 text-sm">Explorare contract / wallet pe TON + evenimente indexate.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/rwa" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">RWA</a>
            <a href="/tx-history" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">Tx</a>
            <a href="/profile" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">Profil</a>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="text-white font-semibold">Adresa</div>
              <div className="mt-3">
                <div className="text-xs text-white/60 font-mono">current</div>
                <div className="mt-1 text-white font-mono break-all">{address}</div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <label className="block">
                  <div className="text-xs text-white/60 font-mono">set</div>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="EQ..."
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white text-sm outline-none"
                  />
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={applyAddress}
                    className="px-4 py-3 rounded-xl bg-solaris-gold/20 text-solaris-gold border border-solaris-gold/30 hover:bg-solaris-gold/25"
                  >
                    Deschide
                  </button>
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
                  >
                    TONScan <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="text-white font-semibold">Shortcut</div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={`/contract/${encodeURIComponent(CET_CONTRACT_ADDRESS)}`}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 hover:bg-white/10"
                >
                  <div className="text-xs text-white/60 font-mono">CET master</div>
                  <div className="mt-1 text-white font-mono">{truncateAddress(CET_CONTRACT_ADDRESS, 7)}</div>
                </a>
                <a href="/brand-assets" className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 hover:bg-white/10">
                  <div className="text-xs text-white/60 font-mono">Brand</div>
                  <div className="mt-1 text-white font-semibold">Assets</div>
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-white font-semibold">Evenimente indexate</div>
                  <div className="mt-1 text-xs text-white/60 font-mono">Sursă: DB (job indexer).</div>
                </div>
                <div className="text-xs text-white/60 font-mono">{loading ? 'loading…' : `${txs.length} items`}</div>
              </div>

              {error ? <div className="mt-3 text-xs text-white/60">Eroare: {error}</div> : null}

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-white/60">
                      <th className="py-2 pr-3 font-mono text-xs">time</th>
                      <th className="py-2 pr-3 font-mono text-xs">kind</th>
                      <th className="py-2 pr-3 font-mono text-xs">hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txs.length ? (
                      txs.slice(0, 50).map((t) => (
                        <tr key={t.txHash} className="border-t border-white/10">
                          <td className="py-2 pr-3 text-white/70 font-mono text-xs whitespace-nowrap">{t.occurredAt}</td>
                          <td className="py-2 pr-3 text-white font-mono text-xs">{t.kind}</td>
                          <td className="py-2 pr-3">
                            <a
                              className="text-solaris-gold hover:underline font-mono text-xs"
                              href={`${tonscanBaseUrl}/tx/${encodeURIComponent(t.txHash)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {truncateAddress(t.txHash, 8)}
                            </a>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-6 text-white/60">
                          Nu există încă evenimente indexate pentru această adresă.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

