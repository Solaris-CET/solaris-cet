import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import {
  isInternalPushAuthorized,
  parsePushNotifyAdminBody,
  PUSH_NOTIFY_ADMIN_PROBE,
  readInternalPushToken,
} from '../../lib/pushNotifyAdmin';
import { withRateLimit } from '@/api/lib/rateLimit';
import { sendWebPush } from '@/api/lib/webPush';

export { PUSH_NOTIFY_ADMIN_PATH, PUSH_NOTIFY_ADMIN_PROBE } from '@/api/lib/pushNotifyAdmin';

export const config = { runtime: 'nodejs' };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const token = readInternalPushToken();
  if (!token) return jsonResponse({ error: PUSH_NOTIFY_ADMIN_PROBE.notConfiguredError }, PUSH_NOTIFY_ADMIN_PROBE.notConfiguredStatus);
  if (!isInternalPushAuthorized(req, token)) {
    return jsonResponse({ error: PUSH_NOTIFY_ADMIN_PROBE.forbiddenError }, PUSH_NOTIFY_ADMIN_PROBE.forbiddenStatus);
  }

  const rateLimited = await withRateLimit(req, '*', {
    keyPrefix: PUSH_NOTIFY_ADMIN_PROBE.rateLimitKey,
    limit: PUSH_NOTIFY_ADMIN_PROBE.rateLimit,
    windowSeconds: PUSH_NOTIFY_ADMIN_PROBE.rateWindowSeconds,
  });
  if (rateLimited) return rateLimited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: PUSH_NOTIFY_ADMIN_PROBE.invalidJsonError }, 400);
  }

  const parsed = parsePushNotifyAdminBody(body);
  if (!parsed) return jsonResponse({ error: PUSH_NOTIFY_ADMIN_PROBE.invalidJsonError }, 400);
  const { title, body: notificationBody, data } = parsed;

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
      .where(eq(schema.users.role, PUSH_NOTIFY_ADMIN_PROBE.adminRole))
      .limit(PUSH_NOTIFY_ADMIN_PROBE.adminSubscriptionLimit);
  } catch {
    return jsonResponse({ ok: false, degraded: true, delivered: 0 }, 503);
  }

  let delivered = 0;
  for (const sub of adminSubscriptions) {
    try {
      await sendWebPush(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        {
          title,
          body: notificationBody,
          data,
          icon: PUSH_NOTIFY_ADMIN_PROBE.pushIcon,
          badge: PUSH_NOTIFY_ADMIN_PROBE.pushBadge,
        },
      );
      delivered++;
    } catch (err) {
      console.error('Failed to send push to admin:', err);
    }
  }

  return jsonResponse({ success: true, delivered }, 200);
}