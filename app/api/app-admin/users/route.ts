import { desc } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireAdminMfa, requireAuth } from '../../lib/auth';
import { jsonResponse, optionsResponse } from '../../lib/http';
import { ensureAllowedOrigin } from '../../lib/originGuard';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, 'GET, OPTIONS', 'Content-Type, Authorization, X-MFA-Code');
  }
  if (req.method !== 'GET') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse(req, { error: ctx.error }, ctx.status);
  const gate = await requireAdminMfa(req, ctx);
  if (!gate.ok) return jsonResponse(req, { error: gate.error }, gate.status);

  const url = new URL(req.url);
  const limitRaw = url.searchParams.get('limit') ?? '50';
  const limit = Math.max(1, Math.min(200, Number.parseInt(limitRaw, 10) || 50));

  const db = getDb();
  const users = await db
    .select({ id: schema.users.id, walletAddress: schema.users.walletAddress, role: schema.users.role, createdAt: schema.users.createdAt })
    .from(schema.users)
    .orderBy(desc(schema.users.createdAt))
    .limit(limit);
  return jsonResponse(req, { ok: true, users: users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })) });
}

