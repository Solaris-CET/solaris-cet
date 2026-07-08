import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions } from '@/api/lib/http';
import { queueNewsletterActivationEmails } from '@/api/lib/newsletterActivation';
import {
  NEWSLETTER_VERIFY_PROBE,
  parseNewsletterVerifyToken,
} from '../../lib/newsletterVerify';

export { NEWSLETTER_VERIFY_PATH, NEWSLETTER_VERIFY_PROBE } from '@/api/lib/newsletterVerify';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') return corsOptions(req, NEWSLETTER_VERIFY_PROBE.methods.join(', '));
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const token = parseNewsletterVerifyToken(new URL(req.url));
  if (!token) return corsJson(req, 400, { error: NEWSLETTER_VERIFY_PROBE.missingTokenError });

  const db = getDb();
  const [sub] = await db
    .select()
    .from(schema.newsletterSubscriptions)
    .where(eq(schema.newsletterSubscriptions.verifyToken, token))
    .limit(1);

  if (!sub) return corsJson(req, 404, { error: NEWSLETTER_VERIFY_PROBE.invalidTokenError });
  if (sub.status === 'active') {
    return corsJson(req, 200, { ok: true, status: NEWSLETTER_VERIFY_PROBE.statusAlreadyActive });
  }
  if (sub.status === 'unsubscribed') return corsJson(req, 409, { error: NEWSLETTER_VERIFY_PROBE.unsubscribedError });

  await db
    .update(schema.newsletterSubscriptions)
    .set({ status: 'active', verifiedAt: new Date() })
    .where(and(eq(schema.newsletterSubscriptions.id, sub.id), eq(schema.newsletterSubscriptions.status, 'pending')));

  const [contact] = await db.select().from(schema.contacts).where(eq(schema.contacts.id, sub.contactId)).limit(1);
  const email = contact?.email;
  if (email) {
    await queueNewsletterActivationEmails(req, email);
  }

  return new Response(JSON.stringify({ ok: true, status: NEWSLETTER_VERIFY_PROBE.statusVerified }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
  });
}