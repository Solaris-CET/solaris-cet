import { asc, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireAdminAuth, requireAdminRole } from '../../lib/adminAuth';
import { getAllowedOrigin } from '../../lib/cors';
import { corsJson, corsOptions } from '../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const ok = requireAdminRole(ctx, 'viewer');
  if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });

  const url = new URL(req.url);
  const id = String(url.searchParams.get('id') ?? '').trim();
  if (!id) return corsJson(req, 400, { error: 'Missing id' });

  const db = getDb();
  const [conv] = await db.select().from(schema.crmConversations).where(eq(schema.crmConversations.id, id)).limit(1);
  if (!conv) return corsJson(req, 404, { error: 'Not found' });
  const msgs = await db
    .select()
    .from(schema.crmMessages)
    .where(eq(schema.crmMessages.conversationId, conv.id))
    .orderBy(asc(schema.crmMessages.createdAt));

  return corsJson(req, 200, {
    ok: true,
    conversation: { id: conv.id, status: conv.status, createdAt: conv.createdAt.toISOString(), updatedAt: conv.updatedAt.toISOString() },
    messages: msgs.map((m) => ({ id: m.id, sender: m.sender, body: m.body, createdAt: m.createdAt.toISOString() })),
  });
}
