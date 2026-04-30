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

  const limited = await withRateLimit(req, allowedOrigin, { keyPrefix: 'ton-nfts', limit: 90, windowSeconds: 60 })
  if (limited) return limited

  const url = new URL(req.url)
  const ownerRaw = (url.searchParams.get('owner') ?? '').trim()
  const network = parseTonNetwork(url.searchParams.get('network'))
  const parsed = tonAddressSchema.safeParse(ownerRaw)
  if (!parsed.success) {
    return jsonResponse({ ok: false, error: 'Invalid address' }, allowedOrigin, 400)
  }
  const owner = parsed.data.toString()

  const r = await fetchTonapiJson<Record<string, unknown>>(
    network,
    `/v2/accounts/${encodeURIComponent(owner)}/nfts?limit=200&offset=0&indirect_ownership=false`,
    { timeoutMs: 6500 },
  )
  if (!r.ok) {
    return jsonResponse({ ok: false, error: 'unavailable' }, allowedOrigin, 200)
  }

  const rawItems =
    (Array.isArray((r.data as { nft_items?: unknown }).nft_items) && (r.data as { nft_items: unknown[] }).nft_items) ||
    (Array.isArray((r.data as { items?: unknown }).items) && (r.data as { items: unknown[] }).items) ||
    []

  const items = rawItems
    .map((it): Record<string, unknown> | null => (it && typeof it === 'object' ? (it as Record<string, unknown>) : null))
    .filter((it): it is Record<string, unknown> => Boolean(it))
    .map((it) => {
      const address = typeof it.address === 'string' ? it.address : ''
      const meta = it.metadata && typeof it.metadata === 'object' ? (it.metadata as Record<string, unknown>) : null
      const name = meta && typeof meta.name === 'string' ? meta.name : typeof it.name === 'string' ? it.name : undefined
      const image = meta && typeof meta.image === 'string' ? meta.image : undefined
      const collection = it.collection && typeof it.collection === 'object' ? (it.collection as Record<string, unknown>) : null
      const collectionAddress = collection && typeof collection.address === 'string' ? collection.address : undefined
      const collectionName =
        collection && collection.metadata && typeof collection.metadata === 'object'
          ? (collection.metadata as Record<string, unknown>)
          : null
      const cn = collectionName && typeof collectionName.name === 'string' ? collectionName.name : undefined
      return { address, name, image, collectionAddress, collectionName: cn }
    })
    .filter((it) => typeof it.address === 'string' && it.address.trim().length > 0)

  return jsonResponse({ ok: true, owner, network, items }, allowedOrigin, 200)
}
