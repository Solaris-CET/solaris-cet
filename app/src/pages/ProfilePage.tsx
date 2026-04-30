import { useTonWallet } from '@tonconnect/ui-react'
import { ExternalLink } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useJwtSession } from '@/hooks/useJwtSession'
import { useTonNetwork } from '@/hooks/useTonNetwork'
import { truncateAddress } from '@/lib/utils'

type Profile = {
  email: string | null
  user: { walletAddress: string; role: string }
  preferences: { marketingNewsletter: boolean; priceAlertsEmail: boolean; pushEnabled: boolean }
  newsletter: { status: string; createdAt: string } | null
}

type IndexedTx = {
  txHash: string
  occurredAt: string
  kind: string
}

function resolveAddressFromPathname(pathname: string): string {
  const marker = '/profile'
  const idx = pathname.indexOf(marker)
  if (idx < 0) return ''
  const after = pathname.slice(idx + marker.length)
  const parts = after.split('/').filter(Boolean)
  const candidate = parts[0] ? decodeURIComponent(parts[0]) : ''
  return candidate.trim()
}

export default function ProfilePage() {
  const wallet = useTonWallet()
  const walletAddress = wallet?.account?.address?.trim() ?? ''
  const { token, isAuthenticated } = useJwtSession()
  const { network, tonscanBaseUrl } = useTonNetwork()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [txs, setTxs] = useState<IndexedTx[]>([])
  const [loading, setLoading] = useState(false)

  const address = useMemo(() => {
    const path = typeof window === 'undefined' ? '' : window.location.pathname
    const fromPath = resolveAddressFromPathname(path)
    return fromPath || walletAddress
  }, [walletAddress])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    void (async () => {
      setLoading(true)
      try {
        if (token) {
          const res = await fetch('/api/account/profile', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
          const json = (await res.json().catch(() => null)) as (Profile & { ok?: unknown }) | null
          if (!cancelled && res.ok && json && json.ok === true) setProfile(json)
        }

        if (address) {
          const res = await fetch(
            `/api/ton/indexed-txs?address=${encodeURIComponent(address)}&network=${encodeURIComponent(network)}&limit=30`,
            { cache: 'no-store', signal: controller.signal },
          )
          const json = (await res.json().catch(() => null)) as { ok?: unknown; items?: unknown }
          if (!cancelled && res.ok && json?.ok === true && Array.isArray(json.items)) {
            setTxs(json.items as IndexedTx[])
          } else if (!cancelled) {
            setTxs([])
          }
        } else if (!cancelled) {
          setTxs([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [address, network, token])

  const explorerUrl = address ? `${tonscanBaseUrl}/address/${encodeURIComponent(address)}` : ''

  return (
    <main id="main-content" tabIndex={-1} className="relative min-h-[70vh] w-full pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0">
      <div className="section-padding-x max-w-5xl mx-auto w-full pt-24 pb-16">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-white text-2xl font-semibold tracking-tight">Profil</h1>
            <p className="mt-2 text-white/70 text-sm">Stare sesiune + activitate on-chain indexată.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/app" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">App</a>
            <a href="/tx-history" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">Tx</a>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="text-white font-semibold">Identitate</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-white/60">Rețea</div>
                  <div className="text-white font-mono">{network}</div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-white/60">Wallet</div>
                  <div className="text-white font-mono break-all">{address ? truncateAddress(address, 6) : '—'}</div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-white/60">Rol</div>
                  <div className="text-white font-mono">{profile?.user?.role ?? (isAuthenticated ? 'user' : 'guest')}</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {explorerUrl ? (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-solaris-gold/20 text-solaris-gold border border-solaris-gold/30 hover:bg-solaris-gold/25"
                  >
                    TONScan <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
                <a href="/login" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
                  Login
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="text-white font-semibold">Preferințe</div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                  <div className="text-xs text-white/60 font-mono">Newsletter</div>
                  <div className="mt-1 text-white font-semibold">{profile?.newsletter?.status ?? '—'}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                  <div className="text-xs text-white/60 font-mono">Push</div>
                  <div className="mt-1 text-white font-semibold">{profile?.preferences?.pushEnabled ? 'on' : 'off'}</div>
                </div>
              </div>
              {!token ? <div className="mt-3 text-xs text-white/60">Conectează-te ca să vezi datele de cont.</div> : null}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-white font-semibold">Tranzacții indexate</div>
                  <div className="mt-1 text-xs text-white/60 font-mono">Sursă: DB (populat de job-ul indexer).</div>
                </div>
                <div className="text-xs text-white/60 font-mono">{loading ? 'loading…' : `${txs.length} items`}</div>
              </div>

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
                      txs.slice(0, 30).map((t) => (
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
                          {address ? 'Nu există încă evenimente indexate pentru această adresă.' : 'Conectează un wallet sau folosește /profile/<address>.'}
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

