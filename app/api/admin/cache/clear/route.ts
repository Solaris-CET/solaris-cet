import { writeAdminAudit } from '../../../lib/adminAudit';
import { requireAdminAuth, requireAdminRole } from '../../../lib/adminAuth';
import { corsJson, corsOptions } from '../../../lib/http';
import { redisDel } from '../../../lib/upstashRedis';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });
  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const ok = requireAdminRole(ctx, 'admin');
  if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });

  const keys = ['cet-state-json', 'cet-ai:onchain:v1'];
  const res = await redisDel(keys);
  await writeAdminAudit(req, ctx, 'CACHE_CLEARED', 'cache', null, { keys, deleted: res.deleted, hasRedis: res.ok });
  return corsJson(req, 200, { ok: true, deleted: res.deleted, keys, redisConfigured: res.ok });
}

