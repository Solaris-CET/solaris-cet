import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import { getAllowedOrigin } from '@/api/lib/cors';
import { GDPR_DELETE_PROBE } from '@/api/lib/gdprDelete';
import { corsJson, corsOptions } from '@/api/lib/http';
import { withRateLimit } from '@/api/lib/rateLimit';

export { GDPR_DELETE_PATH, GDPR_DELETE_PROBE } from '@/api/lib/gdprDelete';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req, GDPR_DELETE_PROBE.methods.join(', '));

  if (req.method !== 'DELETE') {
    return corsJson(req, 405, { error: 'Method not allowed' });
  }

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: GDPR_DELETE_PROBE.rateLimitKey,
    limit: GDPR_DELETE_PROBE.rateLimit,
    windowSeconds: GDPR_DELETE_PROBE.rateLimitWindowSeconds,
  });
  if (limited) return limited;

  const ctx = await requireAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const userId = ctx.user.id;

  const db = getDb();
  try {
    await db
      .update(schema.aiQueryLogs)
      .set({ userId: null, ipHash: null, query: GDPR_DELETE_PROBE.anonymizedQuery, responseHash: null })
      .where(eq(schema.aiQueryLogs.userId, userId));
  } catch {
    void 0;
  }

  try {
    await db
      .update(schema.analyticsEvents)
      .set({ userId: null, ipHash: null, uaHash: null })
      .where(eq(schema.analyticsEvents.userId, userId));
  } catch {
    void 0;
  }

  await db.delete(schema.users).where(eq(schema.users.id, userId));
  return corsJson(req, 200, { [GDPR_DELETE_PROBE.successField]: true });
}