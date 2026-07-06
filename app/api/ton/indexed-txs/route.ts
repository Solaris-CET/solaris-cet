import { and, desc, eq } from 'drizzle-orm'

import { getDb, schema } from '../../../db/client'
import { getAllowedOrigin } from '../../lib/cors'
import { corsJson, corsOptions } from '../../lib/http'
import { withRateLimit } from '../../lib/rateLimit'
import { parseTonNetwork } from '../../lib/tonapi'
import { tonAddressSchema } from '../../lib/validation'

export const config = { runtime: 'nodejs' }

function asInt(value: string | null, fallback: number): number {
  const raw = (value ?? '').trim()
  if (!raw) return fallback
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n)) return fallback
  return n
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS')
  if (req.method !== 'GET') return corsJson(req, 405, { ok: false, error: 'Method not allowed' })

  const allowedOrigin = getAllowedOrigin(req.headers.get('origin'))

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: 'ton-indexed-txs',
    limit: 120,
    windowSeconds: 60,
  })
  if (limited) return limited

  const url = new URL(req.url)
  const addressRaw = (url.searchParams.get('address') ?? '').trim()
  const parsed = tonAddressSchema.safeParse(addressRaw)
  if (!parsed.success) return corsJson(req, 400, { ok: false, error: 'Invalid address' })
  const address = parsed.data.toString()

  const network = parseTonNetwork(url.searchParams.get('network'))
  const limit = Math.max(1, Math.min(100, asInt(url.searchParams.get('limit'), 50)))

  const db = getDb()
  const rows = await db
    .select({ txHash: schema.tonIndexedTransactions.txHash, kind: schema.tonIndexedTransactions.kind, occurredAt: schema.tonIndexedTransactions.occurredAt })
    .from(schema.tonIndexedTransactions)
    .where(and(eq(schema.tonIndexedTransactions.network, network), eq(schema.tonIndexedTransactions.address, address)))
    .orderBy(desc(schema.tonIndexedTransactions.occurredAt))
    .limit(limit)

  const items = rows.map((r) => ({ txHash: r.txHash, kind: r.kind, occurredAt: r.occurredAt.toISOString() }))
  return corsJson(req, 200, { ok: true, network, address, items })
}
