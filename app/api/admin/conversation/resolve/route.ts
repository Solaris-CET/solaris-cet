import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { writeAdminAudit } from '@/api/lib/adminAudit';
import { guardAdminRoute } from '@/api/lib/adminAuth';
import {
  ADMIN_CONVERSATION_RESOLVE_PROBE,
  parseConversationResolveBody,
} from '../../../lib/adminConversationResolve';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';
import { withRateLimit } from '@/api/lib/rateLimit';

export {
  ADMIN_CONVERSATION_RESOLVE_PATH,
  ADMIN_CONVERSATION_RESOLVE_PROBE,
} from '../../../lib/adminConversationResolve';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req);
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: ADMIN_CONVERSATION_RESOLVE_PROBE.rateLimitKey,
    limit: 60,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const ctx = await guardAdminRoute(req, { minRole: ADMIN_CONVERSATION_RESOLVE_PROBE.minRole });
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: 'Invalid JSON' });
  }

  const parsed = parseConversationResolveBody(body);
  if (!parsed.ok) return corsJson(req, 400, { error: parsed.error });
  const { conversationId } = parsed;

  const db = getDb();
  await db
    .update(schema.crmConversations)
    .set({
      status: ADMIN_CONVERSATION_RESOLVE_PROBE.resolvedStatus,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.crmConversations.id, conversationId));

  await writeAdminAudit(req, ctx, ADMIN_CONVERSATION_RESOLVE_PROBE.auditAction, 'crm_conversation', conversationId, {});

  return corsJson(req, 200, { ok: true });
}