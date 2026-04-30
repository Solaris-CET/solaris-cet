import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { getAllowedOrigin } from '../../lib/cors';
import { corsJson, corsOptions } from '../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const url = new URL(req.url);
  const token = String(url.searchParams.get('token') ?? '').trim();
  if (!token) return corsJson(req, 400, { error: 'Missing token' });

  const db = getDb();
  const [sub] = await db
    .select()
    .from(schema.newsletterSubscriptions)
    .where(eq(schema.newsletterSubscriptions.unsubscribeToken, token))
    .limit(1);
  if (!sub) return corsJson(req, 404, { error: 'Invalid token' });
  if (sub.status === 'unsubscribed') return corsJson(req, 200, { ok: true, status: 'already_unsubscribed' });

  await db
    .update(schema.newsletterSubscriptions)
    .set({ status: 'unsubscribed', unsubscribedAt: new Date() })
    .where(and(eq(schema.newsletterSubscriptions.id, sub.id), eq(schema.newsletterSubscriptions.status, sub.status)));

  return new Response(JSON.stringify({ ok: true, status: 'unsubscribed' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
  });
}

