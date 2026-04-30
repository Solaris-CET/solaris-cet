import { eq } from 'drizzle-orm';

import { getDb, schema } from '../../db/client';
import { requireAuth } from '../lib/auth';
import { getAllowedOrigin } from '../lib/cors';
import { corsJson, corsOptions } from '../lib/http';
import { withRateLimit } from '../lib/rateLimit';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req, 'DELETE, OPTIONS');

  if (req.method !== 'DELETE') {
    return corsJson(req, 405, { error: 'Method not allowed' });
  }

  const limited = await withRateLimit(req, allowedOrigin, { keyPrefix: 'gdpr_delete', limit: 5, windowSeconds: 3600 });
  if (limited) return limited;

  const ctx = await requireAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const userId = ctx.user.id;

  const db = getDb();
  try {
    await db
      .update(schema.aiQueryLogs)
      .set({ userId: null, ipHash: null, query: '[deleted]', responseHash: null })
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
  return corsJson(req, 200, { success: true });
}
