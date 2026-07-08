import { and, desc, eq, isNull, sql } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import { corsJson, optionsResponse } from '@/api/lib/http';
import {
  buildSecuritySessionsPayload,
  mapSecuritySessionItem,
  normalizeSessionCount,
  SECURITY_SESSIONS_PROBE,
} from '../../lib/securitySessions';

export { SECURITY_SESSIONS_PATH, SECURITY_SESSIONS_PROBE } from '@/api/lib/securitySessions';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req, SECURITY_SESSIONS_PROBE.methods.join(', '));
  }
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await requireAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const db = getDb();
  const rows = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.userId, ctx.user.id))
    .orderBy(desc(schema.sessions.createdAt))
    .limit(SECURITY_SESSIONS_PROBE.listLimit);

  const now = Date.now();
  const sessions = rows.map((s) => mapSecuritySessionItem(s, now, ctx.sid));

  const [row] = await db
    .select({ c: sql<number>`count(*)`.as('c') })
    .from(schema.sessions)
    .where(and(eq(schema.sessions.userId, ctx.user.id), isNull(schema.sessions.revokedAt)));
  const notRevoked = normalizeSessionCount(row?.c);

  return corsJson(
    req,
    200,
    buildSecuritySessionsPayload({
      sessions,
      currentSessionId: ctx.sid,
      mfaEnabled: ctx.mfaEnabled,
      notRevokedCount: notRevoked,
    }),
  );
}