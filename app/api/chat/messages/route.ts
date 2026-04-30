import { and, asc, eq, gt } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireAuth } from '../../lib/auth';
import { jsonResponse, optionsResponse } from '../../lib/http';
import { ensureAllowedOrigin } from '../../lib/originGuard';
import { awardPoints } from '../../lib/points';

export const config = { runtime: 'nodejs' };

function bannedWords(): string[] {
  const raw = String(process.env.CHAT_BANNED_WORDS ?? '').trim();
  if (!raw) return ['scam', 'airdrop', 'seed phrase'];
  return raw
    .split(',')
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 200);
}

function hasBanned(text: string): boolean {
  const t = text.toLowerCase();
  return bannedWords().some((w) => w && t.includes(w));
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req, 'GET, POST, OPTIONS', 'Content-Type, Authorization');
  }

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const roomId = url.searchParams.get('roomId') ?? '';
    const since = url.searchParams.get('since');
    if (!roomId) return jsonResponse(req, { error: 'Missing roomId' }, 400);

    const ctx = await requireAuth(req);
    const isAuthed = !('error' in ctx);
    const canModerate = isAuthed && (ctx.user.role === 'admin' || ctx.user.role === 'moderator');
    const viewerUserId = isAuthed ? ctx.user.id : null;

    const db = getDb();
    const sinceDate = since ? new Date(since) : null;
    const where = sinceDate && !Number.isNaN(sinceDate.getTime())
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
      .limit(80);

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
    return jsonResponse(req, { error: 'Invalid JSON body' }, 400);
  }

  const roomId =
    typeof body === 'object' && body !== null && 'roomId' in body && typeof (body as { roomId?: unknown }).roomId === 'string'
      ? (body as { roomId: string }).roomId.trim()
      : '';
  const text =
    typeof body === 'object' && body !== null && 'body' in body && typeof (body as { body?: unknown }).body === 'string'
      ? (body as { body: string }).body.trim()
      : '';
  if (!roomId || !text || text.length > 500) return jsonResponse(req, { error: 'Invalid message' }, 400);

  const db = getDb();
  const status = hasBanned(text) ? 'queued' : 'visible';
  const [msg] = await db
    .insert(schema.chatMessages)
    .values({ roomId, userId: ctx.user.id, body: text, status })
    .returning();

  const day = new Date().toISOString().slice(0, 10);
  await awardPoints(db, ctx.user.id, 1, 'chat', { dedupeKey: `chat:${msg.id}`, meta: { activity: 'chat_message', day } });
  return jsonResponse(req, { ok: true, message: { id: msg.id, status: msg.status, createdAt: msg.createdAt } });
}
