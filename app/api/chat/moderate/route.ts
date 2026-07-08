import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import {
  CHAT_MODERATE_PROBE,
  isChatModeratorRole,
  parseChatModerateAction,
  parseChatModeratePostBody,
} from '../../lib/chatModerate';
import { jsonResponse, optionsResponse } from '@/api/lib/http';
import { ensureAllowedOrigin } from '@/api/lib/originGuard';

export { CHAT_MODERATE_PATH, CHAT_MODERATE_PROBE } from '@/api/lib/chatModerate';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, CHAT_MODERATE_PROBE.methods.join(', '), 'Content-Type, Authorization');
  }
  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse(req, { error: ctx.error }, ctx.status);
  if (!isChatModeratorRole(ctx.user.role)) return jsonResponse(req, { error: 'Forbidden' }, CHAT_MODERATE_PROBE.forbiddenStatus);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: CHAT_MODERATE_PROBE.invalidJsonError }, 400);
  }

  const parsed = parseChatModeratePostBody(body);
  if (!parsed.messageId || !parsed.action) return jsonResponse(req, { error: CHAT_MODERATE_PROBE.invalidRequestError }, 400);

  const nextStatus = parseChatModerateAction(parsed.action);
  if (!nextStatus) return jsonResponse(req, { error: CHAT_MODERATE_PROBE.invalidActionError }, 400);

  const db = getDb();
  await db
    .update(schema.chatMessages)
    .set({ status: nextStatus })
    .where(eq(schema.chatMessages.id, parsed.messageId));
  return jsonResponse(req, { ok: true, status: nextStatus });
}