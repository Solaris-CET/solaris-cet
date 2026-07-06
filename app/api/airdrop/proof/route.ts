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

type StoredProof = { amountNanoCET: string; proof: string[]; index: number }

function parseProofsEnv(): Record<string, StoredProof> | null {
  const raw = (process.env.AIRDROP_PROOFS_JSON ?? '').trim()
  if (!raw) return null
  try {
    const json = JSON.parse(raw) as unknown
    if (!json || typeof json !== 'object') return null
    return json as Record<string, StoredProof>
  } catch {
    return null
  }
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

  const limited = await withRateLimit(req, allowedOrigin, { keyPrefix: 'airdrop-proof', limit: 60, windowSeconds: 60 })
  if (limited) return limited

  const url = new URL(req.url)
  const walletRaw = (url.searchParams.get('wallet') ?? '').trim()
  const network = parseTonNetwork(url.searchParams.get('network'))
  const parsed = tonAddressSchema.safeParse(walletRaw)
  if (!parsed.success) {
    return jsonResponse({ ok: false, eligible: false, wallet: walletRaw, error: 'Invalid address' }, allowedOrigin, 400)
  }
  const wallet = parsed.data.toString()

  const merkleRoot = (process.env.AIRDROP_MERKLE_ROOT ?? '').trim()
  const expiresAt = (process.env.AIRDROP_EXPIRES_AT ?? '').trim()
  const proofs = parseProofsEnv()
  if (!merkleRoot || !proofs) {
    return jsonResponse({ ok: false, eligible: false, wallet, error: 'not_configured', network }, allowedOrigin, 200)
  }

  const rec = proofs[wallet]
  if (!rec) {
    return jsonResponse({ ok: true, eligible: false, wallet, merkleRoot, expiresAt: expiresAt || undefined, network }, allowedOrigin, 200)
  }

  return jsonResponse(
    {
      ok: true,
      eligible: true,
      wallet,
      amountNanoCET: rec.amountNanoCET,
      merkleRoot,
      proof: rec.proof,
      index: rec.index,
      expiresAt: expiresAt || undefined,
      network,
    },
    allowedOrigin,
    200,
  )
}

