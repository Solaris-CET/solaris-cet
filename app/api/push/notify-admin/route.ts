import { eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { withRateLimit } from '../../lib/rateLimit';
import { sendWebPush } from '../../lib/webPush';

export const config = { runtime: 'nodejs' };

type NotifyAdminBody = { title?: string; body?: string; data?: Record<string, unknown> };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const token = (process.env.INTERNAL_PUSH_TOKEN ?? '').trim();
  if (!token) return jsonResponse({ error: 'Push notify-admin not configured' }, 501);

  const auth = req.headers.get('authorization') || '';
  if (auth !== `Bearer ${token}`) return jsonResponse({ error: 'Forbidden' }, 403);

  const rateLimited = await withRateLimit(req, '*', {
    keyPrefix: 'push_notify_admin',
    limit: 30,
    windowSeconds: 60,
  });
  if (rateLimited) return rateLimited;

  let body: NotifyAdminBody;
  try {
    body = (await req.json()) as NotifyAdminBody;
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const titleRaw = typeof body.title === 'string' ? body.title.trim() : '';
  const notificationBodyRaw = typeof body.body === 'string' ? body.body.trim() : '';
  const title = (titleRaw || 'Notificare Solaris CET').slice(0, 120);
  const notificationBody = notificationBodyRaw.slice(0, 400);
  const data = body.data && typeof body.data === 'object' ? body.data : {};

  let adminSubscriptions: Array<{ endpoint: string; p256dh: string; auth: string }>;
  try {
    const db = getDb();
    adminSubscriptions = await db
      .select({
        endpoint: schema.pushSubscriptions.endpoint,
        p256dh: schema.pushSubscriptions.p256dh,
        auth: schema.pushSubscriptions.auth,
      })
      .from(schema.pushSubscriptions)
      .innerJoin(schema.users, eq(schema.pushSubscriptions.userId, schema.users.id))
      .where(eq(schema.users.role, 'admin'))
      .limit(100);
  } catch {
    return jsonResponse({ ok: false, degraded: true, delivered: 0 }, 503);
  }

  let delivered = 0;
  for (const sub of adminSubscriptions) {
    try {
      await sendWebPush(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        { title, body: notificationBody, data, icon: '/icon-192.png', badge: '/badge-72.png' },
      );
      delivered++;
    } catch (err) {
      console.error('Failed to send push to admin:', err);
    }
  }

  return jsonResponse({ success: true, delivered }, 200);
}
