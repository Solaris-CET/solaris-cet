import { eq } from 'drizzle-orm';

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
  const [mfa] = await db.select().from(schema.userMfa).where(eq(schema.userMfa.userId, ctx.user.id)).limit(1);
  const enabled = Boolean(mfa?.enabledAt);
  const pending = Boolean(!enabled && (mfa?.secretEncrypted ?? '').trim());
  return corsJson(req, 200, { ok: true, enabled, pending });
}
