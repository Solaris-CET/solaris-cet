const DEFAULT_KEY = 'solaris_recover_once_v1'
const PENDING_ANALYTICS_KEY = 'solaris_pending_analytics_event_v1'

function asString(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'message' in value) {
    const msg = (value as { message?: unknown }).message
    if (typeof msg === 'string') return msg
  }
  try {
    return String(value)
  } catch {
    return ''
  }
}

export function isChunkLoadFailure(value: unknown): boolean {
  const msg = asString(value)
  if (!msg) return false
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /Expected a JavaScript module script but the server responded with a MIME type/i.test(msg) ||
    /Loading chunk \d+ failed/i.test(msg) ||
    /ChunkLoadError/i.test(msg)
  )
}

export async function recoverAppOnce(key = DEFAULT_KEY): Promise<void> {
  if (typeof window === 'undefined') return
  if (sessionStorage.getItem(key)) return
  sessionStorage.setItem(key, '1')

  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister().catch(() => false)))
    }

    if (typeof caches !== 'undefined') {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
  } catch {
    void 0
  }

  const url = new URL(window.location.href)
  url.searchParams.set('v', String(Date.now()))
  try {
    const payload = {
      name: 'pwa_recovery',
      ts: Date.now(),
      key,
      pathname: url.pathname,
    }
    sessionStorage.setItem(PENDING_ANALYTICS_KEY, JSON.stringify(payload))
  } catch {
    void 0
  }
  window.location.replace(url.toString())
}
