import { and, desc, eq, isNull, sql } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireAuth } from '../../lib/auth';
import { corsJson, optionsResponse } from '../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsResponse(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await requireAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const db = getDb();
  const rows = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.userId, ctx.user.id))
    .orderBy(desc(schema.sessions.createdAt))
    .limit(50);

  const now = Date.now();
  const sessions = rows.map((s) => ({
    id: s.id,
    createdAt: s.createdAt.toISOString(),
    lastUsedAt: s.lastUsedAt ? s.lastUsedAt.toISOString() : null,
    expiresAt: s.expiresAt.toISOString(),
    revokedAt: s.revokedAt ? s.revokedAt.toISOString() : null,
    ip: s.ip ?? null,
    userAgent: s.userAgent ?? null,
    active: !s.revokedAt && s.expiresAt.getTime() > now,
    current: Boolean(ctx.sid && s.id === ctx.sid),
  }));

  const [row] = await db
    .select({ c: sql<number>`count(*)`.as('c') })
    .from(schema.sessions)
    .where(and(eq(schema.sessions.userId, ctx.user.id), isNull(schema.sessions.revokedAt)));
  const notRevoked = typeof row?.c === 'number' ? row.c : 0;

  return corsJson(req, 200, {
    ok: true,
    currentSessionId: ctx.sid,
    mfaEnabled: ctx.mfaEnabled,
    sessions,
    counts: { total: rows.length, notRevoked },
  });
}
