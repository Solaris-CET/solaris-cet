import { createContext, useCallback, useContext, useState } from 'react'

export type RegionCode = 'eu' | 'asia'

type RegionContextValue = {
  region: RegionCode
  setRegion: (region: RegionCode) => void
}

const KEY = 'solaris_region'

function resolveInitialRegion(): RegionCode {
  if (typeof window === 'undefined') return 'eu'
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'eu' || v === 'asia') return v
    return 'eu'
  } catch {
    return 'eu'
  }
}

export const RegionContext = createContext<RegionContextValue>({
  region: 'eu',
  setRegion: () => undefined,
})

export function useRegion() {
  return useContext(RegionContext)
}

export function useRegionState(): RegionContextValue {
  const [region, setRegionState] = useState<RegionCode>(resolveInitialRegion)

  const setRegion = useCallback((next: RegionCode) => {
    setRegionState(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      void 0
    }
  }, [])

  return { region, setRegion }
}

