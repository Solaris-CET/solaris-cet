import { and, eq, isNull } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import { corsJson, optionsResponse, readJson } from '@/api/lib/http';
import { parseSessionRevokeId, SESSION_REVOKE_PROBE } from '@/api/lib/sessionRevoke';
import { notifyUserSecurityTelegram, verifyUserMfaGate } from '@/api/lib/userMfaShared';

export { SESSION_REVOKE_PATH, SESSION_REVOKE_PROBE } from '@/api/lib/sessionRevoke';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req, SESSION_REVOKE_PROBE.methods.join(', '), SESSION_REVOKE_PROBE.allowHeaders);
  }
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await requireAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const body = await readJson(req).catch(() => null);
  const sessionId = parseSessionRevokeId(body);
  if (!sessionId) return corsJson(req, 400, { error: SESSION_REVOKE_PROBE.invalidSessionIdError });

  if (ctx.mfaEnabled) {
    const gate = await verifyUserMfaGate(req, ctx.user.id);
    if (!gate.ok) return corsJson(req, gate.status, { error: gate.error });
  }

  const db = getDb();
  const res = await db
    .update(schema.sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(schema.sessions.id, sessionId), eq(schema.sessions.userId, ctx.user.id), isNull(schema.sessions.revokedAt)))
    .returning();
  if (res.length === 0) return corsJson(req, SESSION_REVOKE_PROBE.notFoundStatus, { error: SESSION_REVOKE_PROBE.notFoundError });

  try {
    await notifyUserSecurityTelegram(ctx.user.id, SESSION_REVOKE_PROBE.telegramMessage);
  } catch {
    void 0;
  }

  return corsJson(req, 200, { ok: true, revoked: res[0].id === ctx.sid, sessionId });
}