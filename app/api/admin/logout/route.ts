import { eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { writeAdminAudit } from '../../lib/adminAudit';
import { requireAdminAuth } from '../../lib/adminAuth';
import { corsJson, corsOptions } from '../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });
  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const db = getDb();
  await db.update(schema.adminSessions).set({ revokedAt: new Date() }).where(eq(schema.adminSessions.id, ctx.sessionId));
  await writeAdminAudit(req, ctx, 'ADMIN_LOGOUT', 'admin_session', ctx.sessionId);
  return corsJson(req, 200, { ok: true });
}

