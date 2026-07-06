import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { getDb, schema } from '../../../db/client';
import { requireAuth } from '../../lib/auth';
import { jsonResponse, optionsResponse } from '../../lib/http';
import { ensureAllowedOrigin } from '../../lib/originGuard';

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

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse(req, { error: ctx.error }, ctx.status);

  const db = getDb();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const code = nanoid(10).toUpperCase();

  await db.delete(schema.telegramLinkCodes).where(eq(schema.telegramLinkCodes.userId, ctx.user.id));
  await db.insert(schema.telegramLinkCodes).values({ code, userId: ctx.user.id, expiresAt });
  return jsonResponse(req, { code, expiresAt });
}

