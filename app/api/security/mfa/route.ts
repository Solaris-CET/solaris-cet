import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import { corsJson, optionsResponse } from '@/api/lib/http';
import { buildUserMfaStatus, USER_MFA_STATUS_PROBE } from '@/api/lib/userMfaStatus';

export { USER_MFA_STATUS_PATH, USER_MFA_STATUS_PROBE } from '@/api/lib/userMfaStatus';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsResponse(req, USER_MFA_STATUS_PROBE.methods.join(', '));
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await requireAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const db = getDb();
  const [mfa] = await db.select().from(schema.userMfa).where(eq(schema.userMfa.userId, ctx.user.id)).limit(1);
  return corsJson(req, 200, buildUserMfaStatus(mfa));
}