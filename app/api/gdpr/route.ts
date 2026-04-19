import { eq } from 'drizzle-orm';
import { getAllowedOrigin } from '../lib/cors';
import { getDb, schema } from '../../db/client';
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
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'DELETE') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  try {
    const body: unknown = await req.json();
    let userId = '';
    if (body && typeof body === 'object' && 'userId' in body) {
      const v = (body as Record<string, unknown>).userId;
      if (typeof v === 'string') userId = v;
    }
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing userId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
      });
    }

    const db = getDb();
    const secrets = getJwtSecretsFromEnv();
    if (secrets.length === 0) {
      return new Response(JSON.stringify({ error: 'Not configured' }), {
        status: 501,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
      });
    }
    const auth = req.headers.get('Authorization') ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const decoded = token ? verifyJwtWithSecrets(token, secrets) : null;
    const wallet = decoded && typeof decoded.wallet === 'string' ? decoded.wallet : null;
    if (!wallet) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
      });
    }

    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
    if (!user || user.walletAddress !== wallet) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
      });
    }
    await db.delete(schema.users).where(eq(schema.users.id, userId));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }
}
