import { eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireAdminAuth } from '../../lib/adminAuth';
import { getAllowedOrigin } from '../../lib/cors';
import { corsJson, corsOptions } from '../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });

  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const db = getDb();
  const [admin] = await db.select().from(schema.adminAccounts).where(eq(schema.adminAccounts.id, ctx.admin.id)).limit(1);
  const enabled = Boolean(admin?.mfaEnabledAt);
  const pending = Boolean(!enabled && admin?.mfaSecretEncrypted);
  return corsJson(req, 200, { ok: true, enabled, pending });
}

