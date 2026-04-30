import { asc, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { jsonResponse, optionsResponse } from '../../lib/http';

export const config = { runtime: 'nodejs' };

async function ensureGlobalRoom() {
  const db = getDb();
  const [room] = await db.select().from(schema.chatRooms).where(eq(schema.chatRooms.slug, 'global'));
  if (room) return;
  await db.insert(schema.chatRooms).values({ slug: 'global', title: 'Global', kind: 'global' });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req, 'GET, OPTIONS', 'Content-Type');
  }
  if (req.method !== 'GET') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  await ensureGlobalRoom();
  const db = getDb();
  const rooms = await db
    .select({ id: schema.chatRooms.id, slug: schema.chatRooms.slug, title: schema.chatRooms.title, kind: schema.chatRooms.kind, eventId: schema.chatRooms.eventId })
    .from(schema.chatRooms)
    .orderBy(asc(schema.chatRooms.createdAt))
    .limit(50);

  return jsonResponse(req, { rooms });
}

