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

  const limited = await withRateLimit(req, allowedOrigin, { keyPrefix: 'admin-crm-reply', limit: 60, windowSeconds: 60 });
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
  const message = typeof (body as { message?: unknown })?.message === 'string' ? (body as { message: string }).message.trim() : '';
  if (!conversationId) return corsJson(req, 400, { error: 'Missing conversationId' });
  if (!message || message.length > 2000) return corsJson(req, 400, { error: 'Invalid message' });

  const db = getDb();
  const [conv] = await db.select().from(schema.crmConversations).where(eq(schema.crmConversations.id, conversationId)).limit(1);
  if (!conv) return corsJson(req, 404, { error: 'Not found' });

  await db.insert(schema.crmMessages).values({ conversationId: conv.id, sender: 'agent', body: message });
  await db.update(schema.crmConversations).set({ updatedAt: new Date() }).where(eq(schema.crmConversations.id, conv.id));

  await writeAdminAudit(req, ctx, 'CRM_CONVERSATION_REPLIED', 'crm_conversation', conv.id, {
    length: message.length,
  });

  return corsJson(req, 200, { ok: true });
}
