import { desc, eq, sql } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { parseDeleteConversationId } from '@/api/lib/adminAiConversations';
import { writeAdminAudit } from '@/api/lib/adminAudit';
import { guardAdminRoute } from '@/api/lib/adminAuth';
import { corsJson, corsOptions } from '@/api/lib/http';

export { ADMIN_AI_CONVERSATIONS_PATH, ADMIN_AI_CONVERSATIONS_PROBE } from '@/api/lib/adminAiConversations';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, DELETE, OPTIONS');
  const ctx = await guardAdminRoute(req, { minRole: (m) => (m === 'DELETE' ? 'admin' : 'viewer') });
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const db = getDb();
  if (req.method === 'GET') {
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
    const id = parseDeleteConversationId(new URL(req.url).searchParams);
    if (!id) return corsJson(req, 400, { error: 'Missing id' });
    const [existing] = await db.select().from(schema.aiConversations).where(eq(schema.aiConversations.id, id));
    if (!existing) return corsJson(req, 404, { error: 'Not found' });
    await db.delete(schema.aiConversations).where(eq(schema.aiConversations.id, id));
    await writeAdminAudit(req, ctx, 'AI_CONVERSATION_DELETED', 'ai_conversation', id, { userId: existing.userId });
    return corsJson(req, 200, { ok: true });
  }

  return corsJson(req, 405, { error: 'Method not allowed' });
}