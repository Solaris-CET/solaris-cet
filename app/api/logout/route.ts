import { eq } from 'drizzle-orm';

import { getDb, schema } from '../../db/client';
import { requireAuth } from '../lib/auth';
import { jsonResponse, optionsResponse } from '../lib/http';
import { ensureAllowedOrigin } from '../lib/originGuard';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, 'POST, OPTIONS', 'Content-Type, Authorization');
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

