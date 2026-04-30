import { createContext, useCallback, useContext, useMemo, useState } from 'react'

export type TonNetwork = 'mainnet' | 'testnet'

type TonNetworkContextValue = {
  network: TonNetwork
  setNetwork: (network: TonNetwork) => void
  tonapiBaseUrl: string
  tonscanBaseUrl: string
}

const KEY = 'solaris_ton_network'

function resolveInitialNetwork(): TonNetwork {
  if (typeof window === 'undefined') return 'mainnet'
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'mainnet' || v === 'testnet') return v
    return 'mainnet'
  } catch {
    return 'mainnet'
  }
}

export const TonNetworkContext = createContext<TonNetworkContextValue>({
  network: 'mainnet',
  setNetwork: () => undefined,
  tonapiBaseUrl: 'https://tonapi.io',
  tonscanBaseUrl: 'https://tonscan.org',
})

export function useTonNetwork() {
  return useContext(TonNetworkContext)
}

export function useTonNetworkState(): TonNetworkContextValue {
  const [network, setNetworkState] = useState<TonNetwork>(resolveInitialNetwork)

  const setNetwork = useCallback((next: TonNetwork) => {
    setNetworkState(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      void 0
    }
  }, [])

  const { tonapiBaseUrl, tonscanBaseUrl } = useMemo(() => {
    if (network === 'testnet') {
      return { tonapiBaseUrl: 'https://testnet.tonapi.io', tonscanBaseUrl: 'https://testnet.tonscan.org' }
    }
    return { tonapiBaseUrl: 'https://tonapi.io', tonscanBaseUrl: 'https://tonscan.org' }
  }, [network])

  return { network, setNetwork, tonapiBaseUrl, tonscanBaseUrl }
}

