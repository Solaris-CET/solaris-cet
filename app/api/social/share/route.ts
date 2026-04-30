import { getDb, schema } from '../../../db/client';
import { requireAuth } from '../../lib/auth';
import { getAllowedOrigin } from '../../lib/cors';
import { jsonResponse, optionsResponse } from '../../lib/http';
import { ensureAllowedOrigin } from '../../lib/originGuard';
import { awardPoints } from '../../lib/points';
import { withRateLimit } from '../../lib/rateLimit';

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

  const allowedOrigin = getAllowedOrigin(req.headers.get('origin'));
  const limited = await withRateLimit(req, allowedOrigin, { keyPrefix: 'share', limit: 12, windowSeconds: 60 });
  if (limited) return limited;

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse(req, { error: ctx.error }, ctx.status);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: 'Invalid JSON body' }, 400);
  }
  const platform =
    typeof body === 'object' &&
    body !== null &&
    'platform' in body &&
    typeof (body as { platform?: unknown }).platform === 'string'
      ? (body as { platform: string }).platform.trim().slice(0, 40)
      : '';
  const url =
    typeof body === 'object' &&
    body !== null &&
    'url' in body &&
    typeof (body as { url?: unknown }).url === 'string'
      ? (body as { url: string }).url.trim().slice(0, 600)
      : '';

  if (!platform || !url) return jsonResponse(req, { error: 'Invalid request' }, 400);

  const day = new Date().toISOString().slice(0, 10);
  const db = getDb();

  try {
    await db.insert(schema.shareEvents).values({ userId: ctx.user.id, platform, url, day });
  } catch {
    return jsonResponse(req, { ok: true, awarded: false });
  }

  const { awarded } = await awardPoints(db, ctx.user.id, 2, 'share', {
    dedupeKey: `share:${day}:${platform}:${url}`,
    meta: { platform, url, day, activity: 'social_share' },
  });
  return jsonResponse(req, { ok: true, awarded });
}
