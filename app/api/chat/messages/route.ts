import { and, asc, eq, gt } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import {
  canModerateChat,
  CHAT_MESSAGES_PROBE,
  chatMessageHasBannedWord,
  isValidChatMessagePost,
  parseChatMessagePostBody,
  parseChatMessagesRoomId,
  parseChatMessagesSince,
} from '../../lib/chatMessages';
import { jsonResponse, optionsResponse } from '@/api/lib/http';
import { ensureAllowedOrigin } from '@/api/lib/originGuard';
import { awardPoints } from '@/api/lib/points';

export { CHAT_MESSAGES_PATH, CHAT_MESSAGES_PROBE } from '@/api/lib/chatMessages';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req, CHAT_MESSAGES_PROBE.methods.join(', '), 'Content-Type, Authorization');
  }

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const roomId = parseChatMessagesRoomId(url.searchParams);
    const sinceDate = parseChatMessagesSince(url.searchParams);
    if (!roomId) return jsonResponse(req, { error: CHAT_MESSAGES_PROBE.missingRoomIdError }, 400);

    const ctx = await requireAuth(req);
    const isAuthed = !('error' in ctx);
    const canModerate = isAuthed && canModerateChat(ctx.user.role);
    const viewerUserId = isAuthed ? ctx.user.id : null;

    const db = getDb();
    const where = sinceDate
      ? and(eq(schema.chatMessages.roomId, roomId), gt(schema.chatMessages.createdAt, sinceDate))
      : eq(schema.chatMessages.roomId, roomId);

    const rows = await db
      .select({
        id: schema.chatMessages.id,
        roomId: schema.chatMessages.roomId,
        userId: schema.chatMessages.userId,
        body: schema.chatMessages.body,
        status: schema.chatMessages.status,
        createdAt: schema.chatMessages.createdAt,
      })
      .from(schema.chatMessages)
      .where(where)
      .orderBy(asc(schema.chatMessages.createdAt))
      .limit(CHAT_MESSAGES_PROBE.listLimit);

    const messages = rows.filter((m) => {
      if (m.status === 'visible') return true;
      if (m.status === 'queued' && (canModerate || (viewerUserId && m.userId === viewerUserId))) return true;
      return false;
    });
    return jsonResponse(req, { messages, serverTime: new Date().toISOString(), canModerate });
  }

  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;
  if (req.method !== 'POST') return jsonResponse(req, { error: 'Method not allowed' }, 405);

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse(req, { error: ctx.error }, ctx.status);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: CHAT_MESSAGES_PROBE.invalidJsonError }, 400);
  }

  const parsed = parseChatMessagePostBody(body);
  if (!isValidChatMessagePost(parsed)) return jsonResponse(req, { error: CHAT_MESSAGES_PROBE.invalidMessageError }, 400);

  const db = getDb();
  const status = chatMessageHasBannedWord(parsed.body) ? 'queued' : 'visible';
  const [msg] = await db
    .insert(schema.chatMessages)
    .values({ roomId: parsed.roomId, userId: ctx.user.id, body: parsed.body, status })
    .returning();

  const day = new Date().toISOString().slice(0, 10);
  await awardPoints(db, ctx.user.id, CHAT_MESSAGES_PROBE.chatPoints, 'chat', {
    dedupeKey: `chat:${msg.id}`,
    meta: { activity: 'chat_message', day },
  });
  return jsonResponse(req, { ok: true, message: { id: msg.id, status: msg.status, createdAt: msg.createdAt } });
}