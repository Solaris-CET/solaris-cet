import { createAuthChallenge } from '../../lib/authChallenges'
import { getAllowedOrigin } from '../../lib/cors'
import { withRateLimit } from '../../lib/rateLimit'

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

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    })
  }

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, allowedOrigin, 405)
  }

  const limited = await withRateLimit(req, allowedOrigin, { keyPrefix: 'auth-challenge', limit: 40, windowSeconds: 60 })
  if (limited) return limited

  const ch = createAuthChallenge(5 * 60 * 1000)
  return jsonResponse({ payload: ch.payload, expiresAt: ch.expiresAt }, allowedOrigin, 200)
}
