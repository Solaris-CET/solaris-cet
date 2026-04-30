import { createContext, useCallback, useContext, useMemo, useState } from 'react'

type JwtSessionContextValue = {
  token: string | null
  setToken: (token: string | null) => void
  isAuthenticated: boolean
}

const KEY = 'solaris_jwt'

function resolveInitialToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const v = localStorage.getItem(KEY)
    return v && v.trim() ? v.trim() : null
  } catch {
    return null
  }
}

export const JwtSessionContext = createContext<JwtSessionContextValue>({
  token: null,
  setToken: () => undefined,
  isAuthenticated: false,
})

export function useJwtSession() {
  return useContext(JwtSessionContext)
}

export function useJwtSessionState(): JwtSessionContextValue {
  const [token, setTokenState] = useState<string | null>(resolveInitialToken)

  const setToken = useCallback((next: string | null) => {
    setTokenState(next)
    try {
      if (!next) localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, next)
    } catch {
      void 0
    }
  }, [])

  const isAuthenticated = useMemo(() => Boolean(token), [token])

  return { token, setToken, isAuthenticated }
}

