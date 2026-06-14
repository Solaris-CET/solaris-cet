import { getDb, schema } from '../../../db/client';
import { eq } from 'drizzle-orm';
import { sendPushNotification } from '../../lib/webPush';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  // Only allow internal requests (same host)
  const host = req.headers.get('host') || '';
  const internalHost = process.env.INTERNAL_HOST || 'localhost';
  if (!host.includes(internalHost) && !host.includes('127.0.0.1') && !host.includes('::1')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  let body: { title?: string; body?: string; data?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const title = body.title || 'Notificare Solaris CET';
  const notificationBody = body.body || '';
  const data = body.data || {};

  const db = getDb();
  const adminSubscriptions = await db
    .select()
    .from(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.userType, 'admin'));

  let delivered = 0;
  for (const sub of adminSubscriptions) {
    try {
      await sendPushNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
        payload: JSON.stringify({ title, body: notificationBody, data, icon: '/icon-192.png', badge: '/badge-72.png' }),
      });
      delivered++;
    } catch (err) {
      console.error('Failed to send push to admin:', err);
    }
  }

  return new Response(JSON.stringify({ success: true, delivered }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
