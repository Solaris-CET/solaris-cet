import { and, eq, isNull, ne } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import { corsJson, optionsResponse } from '@/api/lib/http';
import {
  buildRevokeAllTelegramMessage,
  SESSION_REVOKE_ALL_PROBE,
} from '../../../lib/sessionRevokeAll';
import { notifyUserSecurityTelegram, verifyUserMfaGate } from '@/api/lib/userMfaShared';

export { SESSION_REVOKE_ALL_PATH, SESSION_REVOKE_ALL_PROBE } from '@/api/lib/sessionRevokeAll';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req, SESSION_REVOKE_ALL_PROBE.methods.join(', '), SESSION_REVOKE_ALL_PROBE.allowHeaders);
  }
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await requireAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  if (!ctx.sid) return corsJson(req, 400, { error: SESSION_REVOKE_ALL_PROBE.missingSessionIdError });

  if (ctx.mfaEnabled) {
    const gate = await verifyUserMfaGate(req, ctx.user.id);
    if (!gate.ok) return corsJson(req, gate.status, { error: gate.error });
  }

  const db = getDb();
  const res = await db
    .update(schema.sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(schema.sessions.userId, ctx.user.id), ne(schema.sessions.id, ctx.sid), isNull(schema.sessions.revokedAt)))
    .returning({ id: schema.sessions.id });

  if (res.length > 0) {
    try {
      await notifyUserSecurityTelegram(ctx.user.id, buildRevokeAllTelegramMessage(res.length));
    } catch {
      void 0;
    }
  }

  return corsJson(req, 200, { ok: true, revokedCount: res.length });
}