import { asc, desc, eq, inArray } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireAuth } from '../../lib/auth';
import { getAllowedOrigin } from '../../lib/cors';

export const config = { runtime: 'nodejs' };

function jsonResponse(allowedOrigin: string, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Cache-Control': 'no-store',
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-MFA-Code',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return jsonResponse(allowedOrigin, { error: 'Method not allowed' }, 405);
  }

  const auth = await requireAuth(req);
  if ('error' in auth) {
    return jsonResponse(allowedOrigin, { error: auth.error }, auth.status);
  }

  try {
    const db = getDb();
    const conversations = await db
      .select({
        id: schema.aiConversations.id,
        title: schema.aiConversations.title,
        createdAt: schema.aiConversations.createdAt,
        updatedAt: schema.aiConversations.updatedAt,
        lastMessageAt: schema.aiConversations.lastMessageAt,
        modelPreference: schema.aiConversations.modelPreference,
        tone: schema.aiConversations.tone,
      })
      .from(schema.aiConversations)
      .where(eq(schema.aiConversations.userId, auth.user.id))
      .orderBy(desc(schema.aiConversations.lastMessageAt))
      .limit(50);

    const ids = conversations.map((c) => c.id);
    const messagesByConversation = new Map<string, Array<{ id: string; role: string; content: string; createdAt: Date; revisionOf: string | null }>>();
    if (ids.length > 0) {
      const msgs = await db
        .select({
          id: schema.aiMessages.id,
          conversationId: schema.aiMessages.conversationId,
          role: schema.aiMessages.role,
          content: schema.aiMessages.content,
          createdAt: schema.aiMessages.createdAt,
          revisionOf: schema.aiMessages.revisionOf,
        })
        .from(schema.aiMessages)
        .where(inArray(schema.aiMessages.conversationId, ids))
        .orderBy(asc(schema.aiMessages.createdAt));
      for (const m of msgs) {
        const arr = messagesByConversation.get(m.conversationId) ?? [];
        arr.push({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
          revisionOf: m.revisionOf,
        });
        messagesByConversation.set(m.conversationId, arr);
      }
    }

    return jsonResponse(allowedOrigin, {
      conversations: conversations.map((c) => ({
        ...c,
        messages: messagesByConversation.get(c.id) ?? [],
      })),
    });
  } catch {
    return jsonResponse(allowedOrigin, { error: 'Unavailable' }, 503);
  }
}
