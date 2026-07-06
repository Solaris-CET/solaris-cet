import { getDb } from '../../../../db/client';
import { getAllowedOrigin } from '../../../lib/cors';
import { corsJson, corsOptions, readJson } from '../../../lib/http';
import { withRateLimit } from '../../../lib/rateLimit';
import { bootstrapGamification, bumpAffiliateClick, todayKeyUtc } from '../../lib/gamification';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const allowedOrigin = getAllowedOrigin(req.headers.get('origin'));
  const limited = await withRateLimit(req, allowedOrigin, { keyPrefix: 'affiliate-click', limit: 120, windowSeconds: 60 });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: 'Invalid JSON' });
  }
  const code = typeof (body as { code?: unknown })?.code === 'string' ? (body as { code: string }).code.trim() : '';
  if (!code) return corsJson(req, 400, { error: 'Invalid code' });

  const db = getDb();
  await bootstrapGamification(db);
  await bumpAffiliateClick(db, code, todayKeyUtc());
  return corsJson(req, 200, { ok: true });
}

