import { desc, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireUser } from '@/api/lib/authUser';
import { getAllowedOrigin } from '@/api/lib/cors';
import { buildGdprExportFilename, GDPR_EXPORT_PROBE, isoDateString } from '@/api/lib/gdprExport';
import { corsJson, corsOptions } from '@/api/lib/http';
import { withRateLimit } from '@/api/lib/rateLimit';

export { GDPR_EXPORT_PATH, GDPR_EXPORT_PROBE } from '@/api/lib/gdprExport';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') return corsOptions(req, GDPR_EXPORT_PROBE.methods.join(', '));
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: GDPR_EXPORT_PROBE.rateLimitKey,
    limit: GDPR_EXPORT_PROBE.rateLimit,
    windowSeconds: GDPR_EXPORT_PROBE.rateLimitWindowSeconds,
  });
  if (limited) return limited;

  const user = await requireUser(req);
  if (!user) return corsJson(req, GDPR_EXPORT_PROBE.unauthenticatedStatus, { error: 'Unauthorized' });

  const db = getDb();

  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1);
  if (!u) return corsJson(req, 404, { error: GDPR_EXPORT_PROBE.notFoundError });

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
    .limit(GDPR_EXPORT_PROBE.consentProofsLimit);

  const contacts = await db
    .select()
    .from(schema.contacts)
    .where(eq(schema.contacts.userId, user.id))
    .orderBy(desc(schema.contacts.createdAt))
    .limit(GDPR_EXPORT_PROBE.contactsLimit);

  const points = await db
    .select()
    .from(schema.pointsLedger)
    .where(eq(schema.pointsLedger.userId, user.id))
    .orderBy(desc(schema.pointsLedger.createdAt))
    .limit(GDPR_EXPORT_PROBE.pointsLedgerLimit);

  const referralsAsReferrer = await db
    .select()
    .from(schema.referrals)
    .where(eq(schema.referrals.referrerUserId, user.id))
    .orderBy(desc(schema.referrals.createdAt))
    .limit(GDPR_EXPORT_PROBE.referralsAsReferrerLimit);

  const referralsAsReferred = await db
    .select()
    .from(schema.referrals)
    .where(eq(schema.referrals.referredUserId, user.id))
    .orderBy(desc(schema.referrals.createdAt))
    .limit(GDPR_EXPORT_PROBE.referralsAsReferredLimit);

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    user: {
      id: u.id,
      walletAddress: u.walletAddress,
      referralCode: u.referralCode ?? null,
      points: u.points,
      role: u.role,
      createdAt: isoDateString(u.createdAt),
    },
    userSettings: settings
      ? {
          displayName: settings.displayName ?? null,
          email: settings.email ?? null,
          emailRemindersEnabled: settings.emailRemindersEnabled,
          telegramNotificationsEnabled: settings.telegramNotificationsEnabled,
          createdAt: isoDateString(settings.createdAt),
          updatedAt: isoDateString(settings.updatedAt),
        }
      : null,
    notificationPreferences: prefs
      ? {
          marketingNewsletter: prefs.marketingNewsletter,
          priceAlertsEmail: prefs.priceAlertsEmail,
          pushEnabled: prefs.pushEnabled,
          updatedAt: isoDateString(prefs.updatedAt),
        }
      : null,
    telegramLink: tg
      ? {
          chatId: tg.chatId,
          username: tg.username ?? null,
          linkedAt: isoDateString(tg.linkedAt),
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
      createdAt: isoDateString(p.createdAt),
    })),
    contacts: contacts.map((c) => ({
      id: c.id,
      email: c.email ?? null,
      name: c.name ?? null,
      createdAt: isoDateString(c.createdAt),
    })),
    pointsLedger: points.map((p) => ({
      id: p.id,
      delta: p.delta,
      reason: p.reason,
      dedupeKey: p.dedupeKey ?? null,
      meta: p.meta ?? null,
      createdAt: isoDateString(p.createdAt),
    })),
    referrals: {
      asReferrer: referralsAsReferrer.map((r) => ({
        id: r.id,
        referrerUserId: r.referrerUserId,
        referredUserId: r.referredUserId,
        codeUsed: r.codeUsed,
        createdAt: isoDateString(r.createdAt),
      })),
      asReferred: referralsAsReferred.map((r) => ({
        id: r.id,
        referrerUserId: r.referrerUserId,
        referredUserId: r.referredUserId,
        codeUsed: r.codeUsed,
        createdAt: isoDateString(r.createdAt),
      })),
    },
    limits: {
      consentProofs: GDPR_EXPORT_PROBE.consentProofsLimit,
      contacts: GDPR_EXPORT_PROBE.contactsLimit,
      pointsLedger: GDPR_EXPORT_PROBE.pointsLedgerLimit,
      referralsAsReferrer: GDPR_EXPORT_PROBE.referralsAsReferrerLimit,
    },
  };

  const body = JSON.stringify(exportPayload, null, 2);
  const filename = buildGdprExportFilename(new Date());

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