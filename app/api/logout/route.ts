import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import { jsonResponse, optionsResponse } from '@/api/lib/http';
import { LOGOUT_PROBE } from '@/api/lib/logout';
import { ensureAllowedOrigin } from '@/api/lib/originGuard';

export { LOGOUT_PATH, LOGOUT_PROBE } from '@/api/lib/logout';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, LOGOUT_PROBE.methods.join(', '), 'Content-Type, Authorization');
  }
  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse(req, { error: ctx.error }, ctx.status);

  if (!ctx.sid) return jsonResponse(req, { ok: true });
  const db = getDb();
  await db.update(schema.sessions).set({ revokedAt: new Date() }).where(eq(schema.sessions.id, ctx.sid));
  return jsonResponse(req, { ok: true });
}