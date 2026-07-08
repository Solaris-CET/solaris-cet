import { asc, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { ADMIN_CONVERSATION_PROBE, parseAdminConversationId } from '@/api/lib/adminConversation';
import { guardAdminRoute } from '@/api/lib/adminAuth';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions } from '@/api/lib/http';

export { ADMIN_CONVERSATION_PATH, ADMIN_CONVERSATION_PROBE } from '@/api/lib/adminConversation';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await guardAdminRoute(req, { minRole: ADMIN_CONVERSATION_PROBE.minRole });
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const id = parseAdminConversationId(new URL(req.url).searchParams);
  if (!id) return corsJson(req, 400, { error: ADMIN_CONVERSATION_PROBE.missingIdError });

  const db = getDb();
  const [conv] = await db.select().from(schema.crmConversations).where(eq(schema.crmConversations.id, id)).limit(1);
  if (!conv) return corsJson(req, 404, { error: ADMIN_CONVERSATION_PROBE.notFoundError });
  const msgs = await db
    .select()
    .from(schema.crmMessages)
    .where(eq(schema.crmMessages.conversationId, conv.id))
    .orderBy(asc(schema.crmMessages.createdAt));

  return corsJson(req, 200, {
    ok: true,
    conversation: {
      id: conv.id,
      status: conv.status,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
    },
    messages: msgs.map((m) => ({
      id: m.id,
      sender: m.sender,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}