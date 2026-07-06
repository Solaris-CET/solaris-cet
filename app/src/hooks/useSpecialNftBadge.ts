import { useTonWallet } from '@tonconnect/ui-react'
import { useEffect, useMemo, useState } from 'react'

import { useTonNetwork } from './useTonNetwork'

type NftItem = { address: string; collectionAddress?: string }

export function useSpecialNftBadge() {
  const wallet = useTonWallet()
  const address = wallet?.account?.address?.trim() ?? ''
  const { network } = useTonNetwork()
  const [items, setItems] = useState<NftItem[]>([])

  useEffect(() => {
    if (!address) {
      setItems([])
      return
    }
    let alive = true
    const controller = new AbortController()
    const run = async () => {
      try {
        const res = await fetch(`/api/ton/nfts?owner=${encodeURIComponent(address)}&network=${encodeURIComponent(network)}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const json = (await res.json()) as { ok?: unknown; items?: unknown }
        if (!alive) return
        if (!res.ok || json.ok !== true || !Array.isArray(json.items)) {
          setItems([])
          return
        }
        setItems(json.items as NftItem[])
      } catch {
        if (!alive) return
        setItems([])
      }
    }
    void run()
    return () => {
      alive = false
      controller.abort()
    }
  }, [address, network])

  const hasSpecial = useMemo(() => {
    const specialCollection = String(import.meta.env.VITE_SPECIAL_NFT_COLLECTION_ADDRESS ?? '').trim()
    if (!specialCollection) return false
    return items.some((n) => n.collectionAddress === specialCollection)
  }, [items])

  return { hasSpecial }
}

