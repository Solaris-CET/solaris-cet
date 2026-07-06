import { and, desc, eq, isNotNull } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireUser } from '../../lib/authUser';
import { getAllowedOrigin } from '../../lib/cors';
import { corsJson, corsOptions, isValidEmail, readJson } from '../../lib/http';

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

  const emailRaw = typeof (body as { email?: unknown })?.email === 'string' ? (body as { email: string }).email.trim() : '';
  const email = emailRaw ? emailRaw.toLowerCase() : '';
  if (email && !isValidEmail(email)) return corsJson(req, 400, { error: 'Invalid email' });

  const marketingNewsletter = Boolean((body as { marketingNewsletter?: unknown })?.marketingNewsletter);
  const priceAlertsEmail = Boolean((body as { priceAlertsEmail?: unknown })?.priceAlertsEmail);
  const pushEnabled = Boolean((body as { pushEnabled?: unknown })?.pushEnabled);

  if (email) {
    await db
      .insert(schema.contacts)
      .values({ userId: user.id, email })
      .onConflictDoUpdate({ target: schema.contacts.email, set: { userId: user.id, email } });
  }

  await db
    .insert(schema.notificationPreferences)
    .values({ userId: user.id, marketingNewsletter, priceAlertsEmail, pushEnabled, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.notificationPreferences.userId,
      set: { marketingNewsletter, priceAlertsEmail, pushEnabled, updatedAt: new Date() },
    });

  return corsJson(req, 200, { ok: true });
}

