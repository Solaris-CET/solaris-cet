import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import { jsonResponse, optionsResponse } from '@/api/lib/http';
import { ensureAllowedOrigin } from '@/api/lib/originGuard';
import {
  buildTelegramLinkCodeExpiry,
  buildTelegramLinkCodeResponse,
  normalizeTelegramLinkCode,
  TELEGRAM_LINK_CODE_PROBE,
} from '../../lib/telegramLinkCode';

export { TELEGRAM_LINK_CODE_PATH, TELEGRAM_LINK_CODE_PROBE } from '@/api/lib/telegramLinkCode';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, TELEGRAM_LINK_CODE_PROBE.methods.join(', '), TELEGRAM_LINK_CODE_PROBE.allowHeaders);
  }
  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse(req, { error: ctx.error }, ctx.status);

  const db = getDb();
  const expiresAt = buildTelegramLinkCodeExpiry();
  const code = normalizeTelegramLinkCode(nanoid(TELEGRAM_LINK_CODE_PROBE.codeLength));

  await db.delete(schema.telegramLinkCodes).where(eq(schema.telegramLinkCodes.userId, ctx.user.id));
  await db.insert(schema.telegramLinkCodes).values({ code, userId: ctx.user.id, expiresAt });
  return jsonResponse(req, buildTelegramLinkCodeResponse(code, expiresAt));
}