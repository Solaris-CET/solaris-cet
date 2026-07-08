import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireUser } from '@/api/lib/authUser';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';
import { parsePushUnsubscribeEndpoint, PUSH_UNSUBSCRIBE_PROBE } from '@/api/lib/pushUnsubscribe';

export { PUSH_UNSUBSCRIBE_PATH, PUSH_UNSUBSCRIBE_PROBE } from '@/api/lib/pushUnsubscribe';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req);
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: PUSH_UNSUBSCRIBE_PROBE.unauthenticatedStatus,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: PUSH_UNSUBSCRIBE_PROBE.invalidJsonError });
  }

  const endpoint = parsePushUnsubscribeEndpoint(body);
  if (!endpoint) return corsJson(req, 400, { error: PUSH_UNSUBSCRIBE_PROBE.missingEndpointError });

  const db = getDb();
  await db
    .delete(schema.pushSubscriptions)
    .where(and(eq(schema.pushSubscriptions.userId, user.id), eq(schema.pushSubscriptions.endpoint, endpoint)));

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
  });
}