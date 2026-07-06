import { desc, eq, sql } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { writeAdminAudit } from '../../../lib/adminAudit';
import { requireAdminAuth, requireAdminRole } from '../../../lib/adminAuth';
import { corsJson, corsOptions } from '../../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, DELETE, OPTIONS');
  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const db = getDb();
  if (req.method === 'GET') {
    const ok = requireAdminRole(ctx, 'viewer');
    if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });
    const rows = await db
      .select({
        id: schema.aiConversations.id,
        userId: schema.aiConversations.userId,
        title: schema.aiConversations.title,
        modelPreference: schema.aiConversations.modelPreference,
        createdAt: schema.aiConversations.createdAt,
        lastMessageAt: schema.aiConversations.lastMessageAt,
        messages: sql<number>`count(${schema.aiMessages.id})`.as('messages'),
        walletAddress: schema.users.walletAddress,
      })
      .from(schema.aiConversations)
      .leftJoin(schema.users, eq(schema.users.id, schema.aiConversations.userId))
      .leftJoin(schema.aiMessages, eq(schema.aiMessages.conversationId, schema.aiConversations.id))
      .groupBy(schema.aiConversations.id, schema.users.walletAddress)
      .orderBy(desc(schema.aiConversations.createdAt))
      .limit(300);
    return corsJson(req, 200, {
      conversations: rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        walletAddress: r.walletAddress ?? null,
        title: r.title ?? null,
        modelPreference: r.modelPreference,
        createdAt: r.createdAt,
        lastMessageAt: r.lastMessageAt,
        messages: r.messages ?? 0,
      })),
    });
  }

  if (req.method === 'DELETE') {
    const ok = requireAdminRole(ctx, 'admin');
    if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });
    const url = new URL(req.url);
    const id = (url.searchParams.get('id') ?? '').trim();
    if (!id) return corsJson(req, 400, { error: 'Missing id' });
    const [existing] = await db.select().from(schema.aiConversations).where(eq(schema.aiConversations.id, id));
    if (!existing) return corsJson(req, 404, { error: 'Not found' });
    await db.delete(schema.aiConversations).where(eq(schema.aiConversations.id, id));
    await writeAdminAudit(req, ctx, 'AI_CONVERSATION_DELETED', 'ai_conversation', id, { userId: existing.userId });
    return corsJson(req, 200, { ok: true });
  }

  return corsJson(req, 405, { error: 'Method not allowed' });
}

