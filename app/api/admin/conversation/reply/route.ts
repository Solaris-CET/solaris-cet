import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { writeAdminAudit } from '@/api/lib/adminAudit';
import { guardAdminRoute } from '@/api/lib/adminAuth';
import {
  ADMIN_CONVERSATION_REPLY_PROBE,
  parseConversationReplyBody,
} from '../../../lib/adminConversationReply';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';
import { withRateLimit } from '@/api/lib/rateLimit';

export {
  ADMIN_CONVERSATION_REPLY_PATH,
  ADMIN_CONVERSATION_REPLY_PROBE,
} from '../../../lib/adminConversationReply';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req);
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: ADMIN_CONVERSATION_REPLY_PROBE.rateLimitKey,
    limit: 60,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const ctx = await guardAdminRoute(req, { minRole: ADMIN_CONVERSATION_REPLY_PROBE.minRole });
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: 'Invalid JSON' });
  }

  const parsed = parseConversationReplyBody(body);
  if (!parsed.ok) return corsJson(req, 400, { error: parsed.error });
  const { conversationId, message } = parsed;

  const db = getDb();
  const [conv] = await db
    .select()
    .from(schema.crmConversations)
    .where(eq(schema.crmConversations.id, conversationId))
    .limit(1);
  if (!conv) return corsJson(req, 404, { error: 'Not found' });

  await db.insert(schema.crmMessages).values({ conversationId: conv.id, sender: 'agent', body: message });
  await db.update(schema.crmConversations).set({ updatedAt: new Date() }).where(eq(schema.crmConversations.id, conv.id));

  await writeAdminAudit(req, ctx, ADMIN_CONVERSATION_REPLY_PROBE.auditAction, 'crm_conversation', conv.id, {
    length: message.length,
  });

  return corsJson(req, 200, { ok: true });
}