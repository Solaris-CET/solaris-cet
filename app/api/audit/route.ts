import { getDb, schema } from '../../db/client';
import { getAllowedOrigin } from '../lib/cors';
import { getJwtSecretsFromEnv, verifyJwtWithSecrets } from '../lib/jwt';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  try {
    const body: unknown = await req.json();
    const auth = req.headers.get('Authorization') ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const secrets = getJwtSecretsFromEnv();
    const decoded = token && secrets.length > 0 ? verifyJwtWithSecrets(token, secrets) : null;
    const walletFromToken = decoded && typeof decoded.wallet === 'string' ? decoded.wallet : null;

    const payload = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    const action = typeof payload.action === 'string' ? payload.action : 'unknown';
    const details =
      payload.details === undefined ? undefined : JSON.stringify(payload.details);

    let mode: 'db' | 'stdout' = 'stdout';
    try {
      const db = getDb();
      await db.insert(schema.auditLogs).values({
        walletAddress: walletFromToken ?? (typeof payload.walletAddress === 'string' ? payload.walletAddress : null),
        action,
        details,
      });
      mode = 'db';
    } catch {
      const wallet = walletFromToken
        ? `${walletFromToken.slice(0, 6)}…${walletFromToken.slice(-6)}`
        : null;
      console.warn('[AUDIT_FALLBACK]', { wallet, action, hasDetails: Boolean(details) });
    }

    return new Response(JSON.stringify({ success: true, mode }), {
      status: mode === 'db' ? 201 : 202,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }
}
