import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { getAllowedOrigin } from '@/api/lib/cors';
import { queueNewsletterActivationEmails } from '@/api/lib/newsletterActivation';
import {
  isValidNewsletterConfirmToken,
  NEWSLETTER_CONFIRM_PROBE,
  parseNewsletterConfirmToken,
} from '../../lib/newsletterConfirm';
import { withRateLimit } from '@/api/lib/rateLimit';

export { NEWSLETTER_CONFIRM_PATH, NEWSLETTER_CONFIRM_PROBE } from '@/api/lib/newsletterConfirm';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (origin && allowedOrigin !== origin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        Vary: 'Origin',
        'Cache-Control': 'no-store',
      },
    });
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': NEWSLETTER_CONFIRM_PROBE.methods.join(', '),
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

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: NEWSLETTER_CONFIRM_PROBE.rateLimitKey,
    limit: NEWSLETTER_CONFIRM_PROBE.rateLimit,
    windowSeconds: NEWSLETTER_CONFIRM_PROBE.rateWindowSeconds,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: NEWSLETTER_CONFIRM_PROBE.invalidJsonError }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  const token = parseNewsletterConfirmToken(body);
  if (!isValidNewsletterConfirmToken(token)) {
    return new Response(JSON.stringify({ status: NEWSLETTER_CONFIRM_PROBE.statusInvalid }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  const db = getDb();
  const [record] = await db
    .select()
    .from(schema.newsletterSubscriptions)
    .where(eq(schema.newsletterSubscriptions.verifyToken, token))
    .limit(1);

  if (!record) {
    return new Response(JSON.stringify({ status: NEWSLETTER_CONFIRM_PROBE.statusInvalid }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  if (record.status === 'active') {
    return new Response(JSON.stringify({ status: NEWSLETTER_CONFIRM_PROBE.statusAlreadyConfirmed }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  await db
    .update(schema.newsletterSubscriptions)
    .set({ status: 'active', verifiedAt: new Date() })
    .where(and(eq(schema.newsletterSubscriptions.id, record.id), eq(schema.newsletterSubscriptions.status, 'pending')));

  const [contact] = await db.select().from(schema.contacts).where(eq(schema.contacts.id, record.contactId)).limit(1);
  const email = contact?.email;
  if (email) {
    await queueNewsletterActivationEmails(req, email);
  }

  return new Response(JSON.stringify({ status: NEWSLETTER_CONFIRM_PROBE.statusConfirmed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
  });
}