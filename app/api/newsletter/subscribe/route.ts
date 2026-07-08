import { nanoid } from 'nanoid';

import { getDb, schema } from '@/db/client';
import { getAllowedOrigin } from '@/api/lib/cors';
import { newsletterVerifyEmail } from '@/api/lib/emailTemplates';
import { corsJson, corsOptions, isValidEmail, readJson } from '@/api/lib/http';
import {
  NEWSLETTER_SUBSCRIBE_PROBE,
  parseNewsletterSubscribeBody,
} from '../../lib/newsletterSubscribe';
import { publicOrigin } from '@/api/lib/publicOrigin';

export { NEWSLETTER_SUBSCRIBE_PATH, NEWSLETTER_SUBSCRIBE_PROBE } from '@/api/lib/newsletterSubscribe';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') return corsOptions(req);
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: NEWSLETTER_SUBSCRIBE_PROBE.invalidJsonError });
  }

  const parsed = parseNewsletterSubscribeBody(body);
  if (!parsed) return corsJson(req, 400, { error: NEWSLETTER_SUBSCRIBE_PROBE.invalidJsonError });
  const { email, locale, consent } = parsed;

  if (!consent) return corsJson(req, 400, { error: NEWSLETTER_SUBSCRIBE_PROBE.consentRequiredError });
  if (!isValidEmail(email)) return corsJson(req, 400, { error: NEWSLETTER_SUBSCRIBE_PROBE.invalidEmailError });

  const db = getDb();
  const [contact] = await db
    .insert(schema.contacts)
    .values({ email })
    .onConflictDoUpdate({ target: schema.contacts.email, set: { email } })
    .returning();

  const verifyToken = nanoid(32);
  const unsubscribeToken = nanoid(32);
  await db.insert(schema.newsletterSubscriptions).values({
    contactId: contact.id,
    status: 'pending',
    verifyToken,
    unsubscribeToken,
    locale,
  });

  const originPublic = publicOrigin(req);
  const verifyUrl = `${originPublic}/newsletter/verify?token=${encodeURIComponent(verifyToken)}`;
  const unsubscribeUrl = `${originPublic}/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  const tpl = newsletterVerifyEmail(req, { verifyUrl, unsubscribeUrl });
  await db.insert(schema.emailOutbox).values({
    toEmail: email,
    template: NEWSLETTER_SUBSCRIBE_PROBE.verifyTemplate,
    subject: tpl.subject,
    html: tpl.html,
    textBody: tpl.text,
    payload: { verifyUrl, unsubscribeUrl },
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
  });
}