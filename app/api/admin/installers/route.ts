import { ADMIN_INSTALLERS_PROBE, installersUpstreamUrl } from '@/api/lib/adminInstallers';
import { guardAdminRoute } from '@/api/lib/adminAuth';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions } from '@/api/lib/http';

export { ADMIN_INSTALLERS_PATH, ADMIN_INSTALLERS_PROBE } from '@/api/lib/adminInstallers';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await guardAdminRoute(req, { minRole: ADMIN_INSTALLERS_PROBE.minRole });
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  try {
    const res = await fetch(installersUpstreamUrl(), {
      signal: AbortSignal.timeout(ADMIN_INSTALLERS_PROBE.fetchTimeoutMs),
    });
    const data = await res.json();
    if (!res.ok) {
      return corsJson(req, 502, { error: data.detail || 'Installers unavailable' });
    }
    return corsJson(req, 200, { platform: ADMIN_INSTALLERS_PROBE.platform, ...data });
  } catch {
    return corsJson(req, 503, { error: 'survey-engine unreachable' });
  }
}