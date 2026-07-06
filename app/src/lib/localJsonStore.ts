type StoredEnvelope<T> = {
  v: 1
  ts: number
  data: T
}

function canUseStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined'
  } catch {
    return false
  }
}

export function readJson<T>(key: string): T | null {
  if (!canUseStorage()) return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function writeJson<T>(key: string, value: T): void {
  if (!canUseStorage()) return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    void 0
  }
}

export function readEnvelope<T>(key: string, maxAgeMs: number): T | null {
  const env = readJson<StoredEnvelope<T>>(key)
  if (!env || env.v !== 1 || typeof env.ts !== 'number') return null
  if (maxAgeMs > 0 && Date.now() - env.ts > maxAgeMs) return null
  return env.data
}

export function writeEnvelope<T>(key: string, data: T): void {
  writeJson<StoredEnvelope<T>>(key, { v: 1, ts: Date.now(), data })
}

