import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions } from '@/api/lib/http';
import {
  NEWSLETTER_UNSUBSCRIBE_PROBE,
  parseNewsletterUnsubscribeToken,
} from '../../lib/newsletterUnsubscribe';

export { NEWSLETTER_UNSUBSCRIBE_PATH, NEWSLETTER_UNSUBSCRIBE_PROBE } from '@/api/lib/newsletterUnsubscribe';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') return corsOptions(req, NEWSLETTER_UNSUBSCRIBE_PROBE.methods.join(', '));
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const token = parseNewsletterUnsubscribeToken(new URL(req.url));
  if (!token) return corsJson(req, 400, { error: NEWSLETTER_UNSUBSCRIBE_PROBE.missingTokenError });

  const db = getDb();
  const [sub] = await db
    .select()
    .from(schema.newsletterSubscriptions)
    .where(eq(schema.newsletterSubscriptions.unsubscribeToken, token))
    .limit(1);
  if (!sub) return corsJson(req, 404, { error: NEWSLETTER_UNSUBSCRIBE_PROBE.invalidTokenError });
  if (sub.status === 'unsubscribed') {
    return corsJson(req, 200, { ok: true, status: NEWSLETTER_UNSUBSCRIBE_PROBE.statusAlreadyUnsubscribed });
  }

  await db
    .update(schema.newsletterSubscriptions)
    .set({ status: 'unsubscribed', unsubscribedAt: new Date() })
    .where(and(eq(schema.newsletterSubscriptions.id, sub.id), eq(schema.newsletterSubscriptions.status, sub.status)));

  return new Response(
    JSON.stringify({ ok: true, status: NEWSLETTER_UNSUBSCRIBE_PROBE.statusUnsubscribed }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    },
  );
}