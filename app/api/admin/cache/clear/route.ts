import { writeAdminAudit } from '@/api/lib/adminAudit';
import { ADMIN_CACHE_CLEAR_KEYS, ADMIN_CACHE_CLEAR_PROBE } from '@/api/lib/adminCacheClear';
import { guardAdminRoute } from '@/api/lib/adminAuth';
import { corsJson, corsOptions } from '@/api/lib/http';
import { redisDel } from '@/api/lib/upstashRedis';

export { ADMIN_CACHE_CLEAR_PATH, ADMIN_CACHE_CLEAR_PROBE } from '@/api/lib/adminCacheClear';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });
  const ctx = await guardAdminRoute(req, { minRole: ADMIN_CACHE_CLEAR_PROBE.minRole });
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const keys = [...ADMIN_CACHE_CLEAR_KEYS];
  const res = await redisDel(keys);
  await writeAdminAudit(req, ctx, ADMIN_CACHE_CLEAR_PROBE.auditAction, 'cache', null, {
    keys,
    deleted: res.deleted,
    hasRedis: res.ok,
  });
  return corsJson(req, 200, { ok: true, deleted: res.deleted, keys, redisConfigured: res.ok });
}