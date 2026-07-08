import { asc, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { CHAT_ROOMS_PROBE } from '@/api/lib/chatRooms';
import { jsonResponse, optionsResponse } from '@/api/lib/http';

export { CHAT_ROOMS_PATH, CHAT_ROOMS_PROBE } from '@/api/lib/chatRooms';

export const config = { runtime: 'nodejs' };

async function ensureGlobalRoom() {
  const db = getDb();
  const [room] = await db.select().from(schema.chatRooms).where(eq(schema.chatRooms.slug, CHAT_ROOMS_PROBE.globalRoomSlug));
  if (room) return;
  await db.insert(schema.chatRooms).values({
    slug: CHAT_ROOMS_PROBE.globalRoomSlug,
    title: CHAT_ROOMS_PROBE.globalRoomTitle,
    kind: CHAT_ROOMS_PROBE.globalRoomKind,
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req, CHAT_ROOMS_PROBE.methods.join(', '), 'Content-Type');
  }
  if (req.method !== 'GET') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  await ensureGlobalRoom();
  const db = getDb();
  const rooms = await db
    .select({
      id: schema.chatRooms.id,
      slug: schema.chatRooms.slug,
      title: schema.chatRooms.title,
      kind: schema.chatRooms.kind,
      eventId: schema.chatRooms.eventId,
    })
    .from(schema.chatRooms)
    .orderBy(asc(schema.chatRooms.createdAt))
    .limit(CHAT_ROOMS_PROBE.listLimit);

  return jsonResponse(req, { rooms });
}