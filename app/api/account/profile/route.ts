import { and, desc, eq, isNotNull } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { parseProfileUpdateBody } from '@/api/lib/accountProfile';
import { requireUser } from '@/api/lib/authUser';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';

export { ACCOUNT_PROFILE_PATH, ACCOUNT_PROFILE_PROBE } from '@/api/lib/accountProfile';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, POST, OPTIONS');

  const user = await requireUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  const db = getDb();

  if (req.method === 'GET') {
    const [prefs] = await db
      .select()
      .from(schema.notificationPreferences)
      .where(eq(schema.notificationPreferences.userId, user.id))
      .limit(1);

    const [contact] = await db
      .select()
      .from(schema.contacts)
      .where(and(eq(schema.contacts.userId, user.id), isNotNull(schema.contacts.email)))
      .orderBy(desc(schema.contacts.createdAt))
      .limit(1);

    let newsletter: { status: string; createdAt: string } | null = null;
    if (contact?.id) {
      const [sub] = await db
        .select()
        .from(schema.newsletterSubscriptions)
        .where(eq(schema.newsletterSubscriptions.contactId, contact.id))
        .orderBy(desc(schema.newsletterSubscriptions.createdAt))
        .limit(1);
      if (sub) {
        newsletter = { status: sub.status, createdAt: sub.createdAt.toISOString() };
      }
    }

    return corsJson(req, 200, {
      ok: true,
      user: { walletAddress: user.walletAddress, role: user.role },
      email: contact?.email ?? null,
      preferences: {
        marketingNewsletter: prefs?.marketingNewsletter ?? false,
        priceAlertsEmail: prefs?.priceAlertsEmail ?? false,
        pushEnabled: prefs?.pushEnabled ?? false,
      },
      newsletter,
    });
  }

  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: 'Invalid JSON' });
  }

  const parsed = parseProfileUpdateBody(body);
  if ('error' in parsed) return corsJson(req, 400, { error: parsed.error });

  if (parsed.email) {
    await db
      .insert(schema.contacts)
      .values({ userId: user.id, email: parsed.email })
      .onConflictDoUpdate({ target: schema.contacts.email, set: { userId: user.id, email: parsed.email } });
  }

  await db
    .insert(schema.notificationPreferences)
    .values({
      userId: user.id,
      marketingNewsletter: parsed.marketingNewsletter,
      priceAlertsEmail: parsed.priceAlertsEmail,
      pushEnabled: parsed.pushEnabled,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.notificationPreferences.userId,
      set: {
        marketingNewsletter: parsed.marketingNewsletter,
        priceAlertsEmail: parsed.priceAlertsEmail,
        pushEnabled: parsed.pushEnabled,
        updatedAt: new Date(),
      },
    });

  return corsJson(req, 200, { ok: true });
}