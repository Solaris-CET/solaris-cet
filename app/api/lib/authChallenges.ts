import crypto from 'node:crypto'

type ChallengeRecord = { payload: string; expiresAtMs: number }

const challenges = new Map<string, ChallengeRecord>()

function cleanup(now: number) {
  for (const [k, v] of challenges.entries()) {
    if (v.expiresAtMs <= now) challenges.delete(k)
  }
}

export function createAuthChallenge(ttlMs: number): { payload: string; expiresAt: string } {
  const now = Date.now()
  cleanup(now)
  const payload = crypto.randomBytes(24).toString('base64url')
  const expiresAtMs = now + ttlMs
  challenges.set(payload, { payload, expiresAtMs })
  return { payload, expiresAt: new Date(expiresAtMs).toISOString() }
}

export function consumeAuthChallenge(payload: string): boolean {
  const now = Date.now()
  cleanup(now)
  const rec = challenges.get(payload)
  if (!rec) return false
  if (rec.expiresAtMs <= now) {
    challenges.delete(payload)
    return false
  }
  challenges.delete(payload)
  return true
}
