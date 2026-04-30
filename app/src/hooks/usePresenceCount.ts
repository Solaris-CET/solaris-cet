import { useEffect, useState } from 'react'

export function usePresenceCount(enabled: boolean) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return
    let es: EventSource | null = null
    let closed = false

    const open = () => {
      try {
        es = new EventSource('/api/realtime/presence')
        es.onmessage = (ev) => {
          const parsed = JSON.parse(ev.data) as { count?: unknown }
          const v = typeof parsed?.count === 'number' ? parsed.count : null
          if (typeof v === 'number') setCount(v)
        }
        es.onerror = () => {
          if (closed) return
          try {
            es?.close()
          } catch {
            void 0
          }
          es = null
        }
      } catch {
        es = null
      }
    }

    open()
    const retry = window.setInterval(() => {
      if (closed) return
      if (es) return
      open()
    }, 2500)

    return () => {
      closed = true
      window.clearInterval(retry)
      try {
        es?.close()
      } catch {
        void 0
      }
      es = null
    }
  }, [enabled])

  return { count }
}

