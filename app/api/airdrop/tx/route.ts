import { getAllowedOrigin } from '../../lib/cors'
import { withRateLimit } from '../../lib/rateLimit'
import { parseTonNetwork } from '../../lib/tonapi'
import { tonAddressSchema } from '../../lib/validation'

export const config = { runtime: 'nodejs' }

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

  if (origin && allowedOrigin !== origin) {
    return jsonResponse({ ok: false, error: 'Forbidden' }, allowedOrigin, 403)
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        Vary: 'Origin',
      },
    })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, allowedOrigin, 405)
  }

  const limited = await withRateLimit(req, allowedOrigin, { keyPrefix: 'airdrop-tx', limit: 30, windowSeconds: 60 })
  if (limited) return limited

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON body' }, allowedOrigin, 400)
  }

  const walletRaw =
    typeof body === 'object' && body !== null && 'wallet' in body && typeof (body as { wallet?: unknown }).wallet === 'string'
      ? ((body as { wallet: string }).wallet ?? '').trim()
      : ''
  const network =
    typeof body === 'object' && body !== null && 'network' in body && typeof (body as { network?: unknown }).network === 'string'
      ? parseTonNetwork((body as { network: string }).network)
      : 'mainnet'

  const parsed = tonAddressSchema.safeParse(walletRaw)
  if (!parsed.success) {
    return jsonResponse({ ok: false, error: 'Invalid address' }, allowedOrigin, 400)
  }

  const to = (process.env.AIRDROP_CLAIM_CONTRACT ?? '').trim()
  if (!to) {
    return jsonResponse({ ok: false, error: 'not_configured', network }, allowedOrigin, 200)
  }

  const amountNanoTon = (process.env.AIRDROP_CLAIM_FEE_NANO_TON ?? '').trim() || '0'
  const payload = (process.env.AIRDROP_CLAIM_PAYLOAD_BASE64 ?? '').trim() || undefined

  return jsonResponse({ ok: true, to, amountNanoTon, payload, network }, allowedOrigin, 200)
}

