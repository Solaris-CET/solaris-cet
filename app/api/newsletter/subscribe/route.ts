import { nanoid } from 'nanoid';

import { getDb, schema } from '../../../db/client';
import { getAllowedOrigin } from '../../lib/cors';
import { newsletterVerifyEmail } from '../../lib/emailTemplates';
import { corsJson, corsOptions, isValidEmail, readJson } from '../../lib/http';
import { publicOrigin } from '../../lib/publicOrigin';

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
    return corsJson(req, 400, { error: 'Invalid JSON' });
  }

  const email = typeof (body as { email?: unknown })?.email === 'string' ? (body as { email: string }).email.trim() : '';
  const locale = typeof (body as { locale?: unknown })?.locale === 'string' ? (body as { locale: string }).locale.trim().slice(0, 12) : null;
  const consent = (body as { consent?: unknown })?.consent === true;
  if (!consent) return corsJson(req, 400, { error: 'Consent required' });
  if (!isValidEmail(email)) return corsJson(req, 400, { error: 'Invalid email' });

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
    template: 'newsletter_verify',
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
