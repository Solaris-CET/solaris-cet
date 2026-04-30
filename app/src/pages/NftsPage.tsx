import { useTonWallet } from '@tonconnect/ui-react'
import { BadgeCheck,ImageIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import AppImage from '@/components/AppImage'
import { Skeleton } from '@/components/ui/skeleton'
import { useTonNetwork } from '@/hooks/useTonNetwork'

type NftItem = {
  address: string
  name?: string
  image?: string
  collectionAddress?: string
  collectionName?: string
}

export default function NftsPage() {
  const wallet = useTonWallet()
  const address = wallet?.account?.address?.trim() ?? ''
  const { network } = useTonNetwork()
  const [items, setItems] = useState<NftItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!address) return
    let alive = true
    const controller = new AbortController()
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/ton/nfts?owner=${encodeURIComponent(address)}&network=${encodeURIComponent(network)}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const json = (await res.json()) as { ok?: unknown; items?: unknown; error?: unknown }
        if (!alive) return
        if (!res.ok || json.ok !== true || !Array.isArray(json.items)) {
          setError(typeof json.error === 'string' ? json.error : 'unavailable')
          setItems([])
          return
        }
        setItems(json.items as NftItem[])
      } catch {
        if (!alive) return
        setError('unavailable')
        setItems([])
      } finally {
        if (alive) setLoading(false)
      }
    }
    void run()
    return () => {
      alive = false
      controller.abort()
    }
  }, [address, network])

  const specialOwned = useMemo(() => {
    const special = String(import.meta.env.VITE_SPECIAL_NFT_COLLECTION_ADDRESS ?? '').trim()
    if (!special) return false
    return items.some((n) => n.collectionAddress === special)
  }, [items])

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[70vh] px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-white text-2xl font-semibold tracking-tight">NFT Gallery</h1>
            <p className="mt-2 text-white/70 text-sm">NFT-urile deținute în wallet (rețea: {network}).</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/wallet" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
              Wallet
            </a>
            <a href="/settings" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
              Setări
            </a>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 flex items-center justify-between gap-4">
          <div className="text-sm text-white/70">Wallet: <span className="font-mono">{address ? address : 'Neconectat'}</span></div>
          {specialOwned ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20">
              <BadgeCheck className="w-4 h-4 text-emerald-300" aria-hidden />
              <span className="text-xs font-mono text-emerald-200">SPECIAL NFT</span>
            </div>
          ) : (
            <div className="text-xs font-mono text-white/50">Fără badge</div>
          )}
        </div>

        {loading ? (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
                <div className="aspect-[4/3] bg-white/[0.03] p-3">
                  <Skeleton className="w-full h-full rounded-xl bg-white/10" />
                </div>
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-2/3 bg-white/10" />
                  <Skeleton className="h-3 w-1/2 bg-white/10" />
                  <Skeleton className="h-3 w-full bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6 text-white/70">
            Eroare: {error}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-white/40" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="text-white font-semibold">Galerie goală</div>
                <div className="text-sm text-white/60">
                  Nu am găsit NFT-uri pentru acest wallet. Conectează wallet-ul sau verifică rețeaua.
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/wallet" className="btn-filled-gold">
                Deschide Wallet
              </a>
              <a href="/settings" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
                Setări
              </a>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((n) => (
              <div
                key={n.address}
                className="nft-glow-card rounded-2xl border border-white/10 bg-black/30 overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="aspect-[4/3] bg-white/[0.03] flex items-center justify-center">
                    {n.image ? (
                      <AppImage src={n.image} alt={n.name ?? 'NFT'} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-white/30" aria-hidden />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-white font-semibold truncate">{n.name ?? 'NFT'}</div>
                    <div className="mt-1 text-xs text-white/60 truncate">{n.collectionName ?? n.collectionAddress ?? 'Unknown collection'}</div>
                    <div className="mt-3 text-[11px] font-mono text-white/50 break-all">{n.address}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
