import { and, eq, ne } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { getDb, schema } from '../../../db/client';
import { getAllowedOrigin } from '../../lib/cors';
import { newsletterVerifyEmail } from '../../lib/emailTemplates';
import { corsJson, corsOptions, isValidEmail, readJson } from '../../lib/http';
import { publicOrigin } from '../../lib/publicOrigin';

export const config = { runtime: 'nodejs' };

type UTM = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  li_fat_id?: string;
  campaign?: string;
};

function pickUtm(input: unknown): UTM | null {
  if (!input || typeof input !== 'object') return null;
  const v = input as Record<string, unknown>;
  const take = (k: keyof UTM) => (typeof v[k] === 'string' && String(v[k]).trim() ? String(v[k]).trim().slice(0, 180) : undefined);
  const out: UTM = {
    utm_source: take('utm_source'),
    utm_medium: take('utm_medium'),
    utm_campaign: take('utm_campaign'),
    utm_term: take('utm_term'),
    utm_content: take('utm_content'),
    gclid: take('gclid'),
    fbclid: take('fbclid'),
    li_fat_id: take('li_fat_id'),
    campaign: take('campaign'),
  };
  const has = Object.values(out).some((x) => typeof x === 'string' && x);
  return has ? out : null;
}

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
  const name = typeof (body as { name?: unknown })?.name === 'string' ? (body as { name: string }).name.trim().slice(0, 160) : null;
  const locale = typeof (body as { locale?: unknown })?.locale === 'string' ? (body as { locale: string }).locale.trim().slice(0, 12) : null;
  const consent = (body as { consent?: unknown })?.consent === true;
  const newsletter = (body as { newsletter?: unknown })?.newsletter !== false;
  const pageUrl = typeof (body as { pageUrl?: unknown })?.pageUrl === 'string' ? (body as { pageUrl: string }).pageUrl.trim().slice(0, 500) : null;
  const utm = pickUtm((body as { utm?: unknown })?.utm);

  if (!consent) return corsJson(req, 400, { error: 'Consent required' });
  if (!isValidEmail(email)) return corsJson(req, 400, { error: 'Invalid email' });

  const db = getDb();
  const [contact] = await db
    .insert(schema.contacts)
    .values({ email, name })
    .onConflictDoUpdate({ target: schema.contacts.email, set: { email, name } })
    .returning();

  const [conversation] = await db
    .insert(schema.crmConversations)
    .values({
      contactId: contact.id,
      status: 'open',
      pageUrl,
      utm: utm ?? undefined,
    })
    .returning();

  let subscribed = false;
  if (newsletter) {
    const existing = await db
      .select({ id: schema.newsletterSubscriptions.id })
      .from(schema.newsletterSubscriptions)
      .where(and(eq(schema.newsletterSubscriptions.contactId, contact.id), ne(schema.newsletterSubscriptions.status, 'unsubscribed')))
      .limit(1);

    if (existing.length === 0) {
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
        payload: { verifyUrl, unsubscribeUrl, utm: utm ?? undefined, pageUrl: pageUrl ?? undefined },
      });
      subscribed = true;
    }
  }

  return new Response(JSON.stringify({ ok: true, conversationId: conversation?.id ?? null, subscribed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
  });
}

