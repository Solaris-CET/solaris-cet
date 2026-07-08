import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireUser } from '@/api/lib/authUser';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions } from '@/api/lib/http';
import { buildPushTestNotification, PUSH_TEST_PROBE } from '@/api/lib/pushTest';
import { sendWebPush } from '@/api/lib/webPush';

export { PUSH_TEST_PATH, PUSH_TEST_PROBE } from '@/api/lib/pushTest';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req);
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: PUSH_TEST_PROBE.unauthenticatedStatus,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  const db = getDb();
  const subs = await db
    .select()
    .from(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.userId, user.id))
    .limit(PUSH_TEST_PROBE.subscriptionLimit);
  if (subs.length === 0) return corsJson(req, 200, { ok: true, delivered: 0 });

  const notification = buildPushTestNotification();
  let delivered = 0;
  for (const s of subs) {
    try {
      await sendWebPush(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        notification,
      );
      delivered += 1;
    } catch {
      void 0;
    }
  }

  return new Response(JSON.stringify({ ok: true, delivered }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
  });
}