import { desc } from 'drizzle-orm'
import { getAllowedOrigin } from '../../lib/cors'
import { requireCron } from '../../lib/cron'
import { corsJson, corsOptions } from '../../lib/http'
import { fetchTonapiJson, parseTonNetwork } from '../../lib/tonapi'
import { tonAddressSchema } from '../../lib/validation'
import { getDb, schema } from '../../../db/client'
import { CET_CONTRACT_ADDRESS } from '../../../src/lib/cetContract'

export const config = { runtime: 'nodejs' }

type TonEvent = Record<string, unknown>

function asString(v: unknown): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return ''
}

function extractEventKind(event: TonEvent): string {
  const actions = Array.isArray(event.actions) ? (event.actions as unknown[]) : []
  const first = actions[0] && typeof actions[0] === 'object' ? (actions[0] as Record<string, unknown>) : null
  const t = first ? asString(first.type).toLowerCase() : ''
  if (!t) return 'contract'
  if (t.includes('transfer')) return 'transfer'
  return 'contract'
}

function extractEventHash(event: TonEvent): string {
  return asString(event.event_id) || asString(event.tx_hash) || asString(event.hash)
}

function extractEventTimestampIso(event: TonEvent): string {
  const raw = asString(event.timestamp) || asString(event.time) || ''
  if (!raw) return ''
  if (/^\d+$/.test(raw)) {
    const n = Number(raw)
    if (Number.isFinite(n) && n > 0) {
      const ms = raw.length >= 13 ? n : n * 1000
      return new Date(ms).toISOString()
    }
  }
  const parsed = Date.parse(raw)
  if (Number.isFinite(parsed)) return new Date(parsed).toISOString()
  return ''
}

async function upsertEventsForAddress(params: { network: 'mainnet' | 'testnet'; address: string; limit: number }) {
  const db = getDb()
  const r = await fetchTonapiJson<Record<string, unknown>>(
    params.network,
    `/v2/accounts/${encodeURIComponent(params.address)}/events?limit=${params.limit}`,
    { timeoutMs: 6500 },
  )
  if (!r.ok) return { ok: false as const, inserted: 0 }

  const rawEvents =
    (Array.isArray((r.data as { events?: unknown }).events) && (r.data as { events: unknown[] }).events) ||
    (Array.isArray((r.data as { items?: unknown }).items) && (r.data as { items: unknown[] }).items) ||
    []

  let inserted = 0
  for (const e0 of rawEvents) {
    if (!e0 || typeof e0 !== 'object') continue
    const e = e0 as TonEvent
    const txHash = extractEventHash(e)
    if (!txHash) continue
    const occurredAtIso = extractEventTimestampIso(e)
    if (!occurredAtIso) continue
    const kind = extractEventKind(e)

    const res = await db
      .insert(schema.tonIndexedTransactions)
      .values({
        network: params.network,
        address: params.address,
        txHash,
        kind,
        occurredAt: new Date(occurredAtIso),
        raw: e,
      })
      .onConflictDoNothing()

    inserted += Array.isArray(res) ? res.length : 0
  }

  return { ok: true as const, inserted }
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin')
  const allowedOrigin = getAllowedOrigin(origin)

  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS')
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' })
  if (!requireCron(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    })
  }

  const url = new URL(req.url)
  const network = parseTonNetwork(url.searchParams.get('network'))
  const limit = Math.max(5, Math.min(50, Number(url.searchParams.get('limit') ?? '30') || 30))

  const db = getDb()
  const targets = await db
    .select({ walletAddress: schema.users.walletAddress })
    .from(schema.users)
    .orderBy(desc(schema.users.createdAt))
    .limit(200)

  const uniq = new Set<string>()
  const addresses: string[] = []
  const contractParsed = tonAddressSchema.safeParse(CET_CONTRACT_ADDRESS)
  if (contractParsed.success) {
    const a = contractParsed.data.toString()
    uniq.add(a)
    addresses.push(a)
  }
  for (const t of targets) {
    const raw = (t.walletAddress ?? '').trim()
    if (!raw) continue
    const parsed = tonAddressSchema.safeParse(raw)
    if (!parsed.success) continue
    const a = parsed.data.toString()
    if (uniq.has(a)) continue
    uniq.add(a)
    addresses.push(a)
    if (addresses.length >= 60) break
  }

  let inserted = 0
  let processed = 0
  for (const address of addresses) {
    processed += 1
    const r = await upsertEventsForAddress({ network, address, limit })
    if (r.ok) inserted += r.inserted
  }

  return corsJson(req, 200, { ok: true, network, processed, inserted })
}
