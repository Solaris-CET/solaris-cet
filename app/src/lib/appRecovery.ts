const DEFAULT_KEY = 'solaris_recover_once_v1'
const PENDING_ANALYTICS_KEY = 'solaris_pending_analytics_event_v1'
const RECOVERY_STATE_KEY = 'solaris_recovery_state_v1'

type RecoveryState = {
  count: number
  lastKey: string
  ts: number
}

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

function readRecoveryState(): RecoveryState | null {
  try {
    const raw = sessionStorage.getItem(RECOVERY_STATE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<RecoveryState>
    if (
      typeof parsed?.count === 'number' &&
      typeof parsed?.lastKey === 'string' &&
      typeof parsed?.ts === 'number'
    ) {
      return parsed as RecoveryState
    }
  } catch {
    void 0
  }
  return null
}

function writeRecoveryState(state: RecoveryState): void {
  try {
    sessionStorage.setItem(RECOVERY_STATE_KEY, JSON.stringify(state))
  } catch {
    void 0
  }
}

export function resetRecoveryState(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(DEFAULT_KEY)
    sessionStorage.removeItem(RECOVERY_STATE_KEY)
  } catch {
    void 0
  }
}

export async function recoverAppOnce(key = DEFAULT_KEY): Promise<void> {
  if (typeof window === 'undefined') return
  const now = Date.now()
  const current = readRecoveryState()
  const isSameBurst = current && current.lastKey === key && now - current.ts < 30_000
  const nextCount = isSameBurst ? current.count + 1 : 1
  if (nextCount > 2) return
  sessionStorage.setItem(key, String(nextCount))
  writeRecoveryState({ count: nextCount, lastKey: key, ts: now })

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
  url.searchParams.set('v', String(now))
  url.searchParams.set('recovery', String(nextCount))
  try {
    const payload = {
      name: 'pwa_recovery',
      ts: now,
      key,
      attempt: nextCount,
      pathname: url.pathname,
    }
    sessionStorage.setItem(PENDING_ANALYTICS_KEY, JSON.stringify(payload))
  } catch {
    void 0
  }
  window.location.replace(url.toString())
}
