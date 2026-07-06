import { desc, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireUser } from '../../lib/authUser';
import { getAllowedOrigin } from '../../lib/cors';
import { corsJson, corsOptions } from '../../lib/http';
import { withRateLimit } from '../../lib/rateLimit';

export const config = { runtime: 'nodejs' };

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const limited = await withRateLimit(req, allowedOrigin, { keyPrefix: 'gdpr_export', limit: 10, windowSeconds: 3600 });
  if (limited) return limited;

  const user = await requireUser(req);
  if (!user) return corsJson(req, 401, { error: 'Unauthorized' });

  const db = getDb();

  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1);
  if (!u) return corsJson(req, 404, { error: 'User not found' });

  const [settings] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, user.id)).limit(1);
  const [prefs] = await db
    .select()
    .from(schema.notificationPreferences)
    .where(eq(schema.notificationPreferences.userId, user.id))
    .limit(1);
  const [tg] = await db.select().from(schema.telegramLinks).where(eq(schema.telegramLinks.userId, user.id)).limit(1);

  const consentProofs = await db
    .select()
    .from(schema.consentProofs)
    .where(eq(schema.consentProofs.userId, user.id))
    .orderBy(desc(schema.consentProofs.createdAt))
    .limit(2000);

  const contacts = await db
    .select()
    .from(schema.contacts)
    .where(eq(schema.contacts.userId, user.id))
    .orderBy(desc(schema.contacts.createdAt))
    .limit(50);

  const points = await db
    .select()
    .from(schema.pointsLedger)
    .where(eq(schema.pointsLedger.userId, user.id))
    .orderBy(desc(schema.pointsLedger.createdAt))
    .limit(5000);

  const referralsAsReferrer = await db
    .select()
    .from(schema.referrals)
    .where(eq(schema.referrals.referrerUserId, user.id))
    .orderBy(desc(schema.referrals.createdAt))
    .limit(5000);

  const referralsAsReferred = await db
    .select()
    .from(schema.referrals)
    .where(eq(schema.referrals.referredUserId, user.id))
    .orderBy(desc(schema.referrals.createdAt))
    .limit(1);

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    user: {
      id: u.id,
      walletAddress: u.walletAddress,
      referralCode: u.referralCode ?? null,
      points: u.points,
      role: u.role,
      createdAt: iso(u.createdAt),
    },
    userSettings: settings
      ? {
          displayName: settings.displayName ?? null,
          email: settings.email ?? null,
          emailRemindersEnabled: settings.emailRemindersEnabled,
          telegramNotificationsEnabled: settings.telegramNotificationsEnabled,
          createdAt: iso(settings.createdAt),
          updatedAt: iso(settings.updatedAt),
        }
      : null,
    notificationPreferences: prefs
      ? {
          marketingNewsletter: prefs.marketingNewsletter,
          priceAlertsEmail: prefs.priceAlertsEmail,
          pushEnabled: prefs.pushEnabled,
          updatedAt: iso(prefs.updatedAt),
        }
      : null,
    telegramLink: tg
      ? {
          chatId: tg.chatId,
          username: tg.username ?? null,
          linkedAt: iso(tg.linkedAt),
        }
      : null,
    consentProofs: consentProofs.map((p) => ({
      id: p.id,
      consentKey: p.consentKey,
      essential: p.essential,
      analytics: p.analytics,
      marketing: p.marketing,
      policyVersion: p.policyVersion,
      policyHash: p.policyHash ?? null,
      source: p.source,
      ipHash: p.ipHash ?? null,
      userAgent: p.userAgent ?? null,
      meta: p.meta ?? null,
      createdAt: iso(p.createdAt),
    })),
    contacts: contacts.map((c) => ({
      id: c.id,
      email: c.email ?? null,
      name: c.name ?? null,
      createdAt: iso(c.createdAt),
    })),
    pointsLedger: points.map((p) => ({
      id: p.id,
      delta: p.delta,
      reason: p.reason,
      dedupeKey: p.dedupeKey ?? null,
      meta: p.meta ?? null,
      createdAt: iso(p.createdAt),
    })),
    referrals: {
      asReferrer: referralsAsReferrer.map((r) => ({
        id: r.id,
        referrerUserId: r.referrerUserId,
        referredUserId: r.referredUserId,
        codeUsed: r.codeUsed,
        createdAt: iso(r.createdAt),
      })),
      asReferred: referralsAsReferred.map((r) => ({
        id: r.id,
        referrerUserId: r.referrerUserId,
        referredUserId: r.referredUserId,
        codeUsed: r.codeUsed,
        createdAt: iso(r.createdAt),
      })),
    },
    limits: {
      consentProofs: 2000,
      contacts: 50,
      pointsLedger: 5000,
      referralsAsReferrer: 5000,
    },
  };

  const body = JSON.stringify(exportPayload, null, 2);
  const filename = `solaris-cet-data-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Cache-Control': 'no-store',
    },
  });
}
