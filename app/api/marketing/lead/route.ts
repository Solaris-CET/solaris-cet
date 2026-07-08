import { and, eq, ne } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { getDb, schema } from '@/db/client';
import { getAllowedOrigin } from '@/api/lib/cors';
import { newsletterVerifyEmail } from '@/api/lib/emailTemplates';
import { corsJson, corsOptions, isValidEmail, readJson } from '@/api/lib/http';
import {
  MARKETING_LEAD_PROBE,
  parseMarketingLeadBody,
} from '../../lib/marketingLead';
import { publicOrigin } from '@/api/lib/publicOrigin';

export { MARKETING_LEAD_PATH, MARKETING_LEAD_PROBE } from '@/api/lib/marketingLead';

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
    return corsJson(req, 400, { error: MARKETING_LEAD_PROBE.invalidJsonError });
  }

  const parsed = parseMarketingLeadBody(body);
  if (!parsed) return corsJson(req, 400, { error: MARKETING_LEAD_PROBE.invalidJsonError });
  const { email, name, locale, consent, newsletter, pageUrl, utm } = parsed;

  if (!consent) return corsJson(req, 400, { error: MARKETING_LEAD_PROBE.consentRequiredError });
  if (!isValidEmail(email)) return corsJson(req, 400, { error: MARKETING_LEAD_PROBE.invalidEmailError });

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