import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { getAllowedOrigin } from '../../lib/cors';
import { newsletterWelcomeEmail, onboardingEmail } from '../../lib/emailTemplates';
import { corsJson, corsOptions } from '../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const url = new URL(req.url);
  const token = String(url.searchParams.get('token') ?? '').trim();
  if (!token) return corsJson(req, 400, { error: 'Missing token' });

  const db = getDb();
  const [sub] = await db
    .select()
    .from(schema.newsletterSubscriptions)
    .where(eq(schema.newsletterSubscriptions.verifyToken, token))
    .limit(1);

  if (!sub) return corsJson(req, 404, { error: 'Invalid token' });
  if (sub.status === 'active') return corsJson(req, 200, { ok: true, status: 'already_active' });
  if (sub.status === 'unsubscribed') return corsJson(req, 409, { error: 'Unsubscribed' });

  await db
    .update(schema.newsletterSubscriptions)
    .set({ status: 'active', verifiedAt: new Date() })
    .where(and(eq(schema.newsletterSubscriptions.id, sub.id), eq(schema.newsletterSubscriptions.status, 'pending')));

  const [contact] = await db.select().from(schema.contacts).where(eq(schema.contacts.id, sub.contactId)).limit(1);
  const email = contact?.email;
  if (email) {
    const welcome = newsletterWelcomeEmail(req);
    await db.insert(schema.emailOutbox).values({
      toEmail: email,
      template: 'newsletter_welcome',
      subject: welcome.subject,
      html: welcome.html,
      textBody: welcome.text,
      sendAfter: new Date(Date.now() + 15_000),
    });
    const s1 = onboardingEmail(req, 1);
    const s2 = onboardingEmail(req, 2);
    const s3 = onboardingEmail(req, 3);
    await db.insert(schema.emailOutbox).values([
      {
        toEmail: email,
        template: 'onboarding_1',
        subject: s1.subject,
        html: s1.html,
        textBody: s1.text,
        sendAfter: new Date(Date.now() + 60 * 60 * 1000),
      },
      {
        toEmail: email,
        template: 'onboarding_2',
        subject: s2.subject,
        html: s2.html,
        textBody: s2.text,
        sendAfter: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
      {
        toEmail: email,
        template: 'onboarding_3',
        subject: s3.subject,
        html: s3.html,
        textBody: s3.text,
        sendAfter: new Date(Date.now() + 96 * 60 * 60 * 1000),
      },
    ]);
  }

  return new Response(JSON.stringify({ ok: true, status: 'verified' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
  });
}

