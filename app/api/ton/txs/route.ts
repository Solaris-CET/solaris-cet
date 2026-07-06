import { getAllowedOrigin } from '../../lib/cors'
import { withRateLimit } from '../../lib/rateLimit'
import { fetchTonapiJson, parseTonNetwork } from '../../lib/tonapi'
import { tonAddressSchema } from '../../lib/validation'

export const config = { runtime: 'edge' }

function jsonResponse(body: unknown, allowedOrigin: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Cache-Control': 'no-store',
    },
  })
}

function asString(v: unknown): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return ''
}

function asDigitsString(v: unknown): string {
  const s = asString(v).trim()
  return /^\d+$/.test(s) ? s : ''
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin')
  const allowedOrigin = getAllowedOrigin(origin)

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        Vary: 'Origin',
      },
    })
  }

  if (req.method !== 'GET') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, allowedOrigin, 405)
  }

  const limited = await withRateLimit(req, allowedOrigin, { keyPrefix: 'ton-txs', limit: 120, windowSeconds: 60 })
  if (limited) return limited

  const url = new URL(req.url)
  const addressRaw = (url.searchParams.get('address') ?? '').trim()
  const type = (url.searchParams.get('type') ?? 'all').trim()
  const network = parseTonNetwork(url.searchParams.get('network'))
  const limitRaw = (url.searchParams.get('limit') ?? '').trim()
  const beforeLtRaw = (url.searchParams.get('beforeLt') ?? url.searchParams.get('before_lt') ?? url.searchParams.get('cursor') ?? '').trim()
  const parsed = tonAddressSchema.safeParse(addressRaw)
  if (!parsed.success) {
    return jsonResponse({ ok: false, error: 'Invalid address' }, allowedOrigin, 400)
  }
  const address = parsed.data.toString()

  const limit = (() => {
    const n = Number.parseInt(limitRaw || '20', 10)
    if (!Number.isFinite(n) || n <= 0) return 20
    return Math.min(50, Math.max(1, n))
  })()
  const beforeLt = asDigitsString(beforeLtRaw)

  const r = await fetchTonapiJson<Record<string, unknown>>(
    network,
    `/v2/accounts/${encodeURIComponent(address)}/events?limit=${encodeURIComponent(String(limit))}${beforeLt ? `&before_lt=${encodeURIComponent(beforeLt)}` : ''}`,
    { timeoutMs: 6500 },
  )
  if (!r.ok) {
    return jsonResponse({ ok: false, error: 'unavailable' }, allowedOrigin, 200)
  }

  const rawEvents =
    (Array.isArray((r.data as { events?: unknown }).events) && (r.data as { events: unknown[] }).events) ||
    (Array.isArray((r.data as { items?: unknown }).items) && (r.data as { items: unknown[] }).items) ||
    []

  const items = rawEvents
    .map((e): Record<string, unknown> | null => (e && typeof e === 'object' ? (e as Record<string, unknown>) : null))
    .filter((e): e is Record<string, unknown> => Boolean(e))
    .map((e) => {
      const hash = asString(e.event_id) || asString(e.tx_hash) || asString(e.hash)
      const now = asString(e.timestamp) || asString(e.time) || ''
      const lt = asDigitsString(e.lt) || asDigitsString(e.transaction_lt) || asDigitsString(e.logical_time)
      const actions = Array.isArray(e.actions) ? (e.actions as unknown[]) : []
      const firstAction = actions[0] && typeof actions[0] === 'object' ? (actions[0] as Record<string, unknown>) : null
      const actionType = firstAction ? asString(firstAction.type) : ''
      const inferredType = actionType ? actionType.toLowerCase() : ''
      const kind = inferredType.includes('transfer') ? 'transfer' : inferredType ? 'contract' : 'contract'
      return { hash, now, type: kind, lt }
    })
    .filter((it) => it.hash)
    .filter((it) => (type === 'all' ? true : it.type === type))

  const nextCursor = items.length ? asDigitsString(items[items.length - 1]?.lt) : ''
  return jsonResponse({ ok: true, address, network, items, nextCursor: nextCursor || null }, allowedOrigin, 200)
}
