import { eq } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { writeAdminAudit } from '../../../lib/adminAudit';
import { requireAdminAuth, requireAdminRole } from '../../../lib/adminAuth';
import { getAllowedOrigin } from '../../../lib/cors';
import { corsJson, corsOptions, readJson } from '../../../lib/http';
import { withRateLimit } from '../../../lib/rateLimit';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req);
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });

  const limited = await withRateLimit(req, allowedOrigin, { keyPrefix: 'admin-crm-resolve', limit: 60, windowSeconds: 60 });
  if (limited) return limited;

  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const ok = requireAdminRole(ctx, 'editor');
  if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: 'Invalid JSON' });
  }

  const conversationId =
    typeof (body as { conversationId?: unknown })?.conversationId === 'string'
      ? (body as { conversationId: string }).conversationId.trim()
      : '';
  if (!conversationId) return corsJson(req, 400, { error: 'Missing conversationId' });

  const db = getDb();
  await db
    .update(schema.crmConversations)
    .set({ status: 'resolved', resolvedAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.crmConversations.id, conversationId));

  await writeAdminAudit(req, ctx, 'CRM_CONVERSATION_RESOLVED', 'crm_conversation', conversationId, {});

  return corsJson(req, 200, { ok: true });
}
