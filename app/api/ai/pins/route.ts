import { and, desc, eq } from 'drizzle-orm';

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
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-MFA-Code',
        Vary: 'Origin',
      },
    });
  }

  const auth = await requireAuth(req);
  if ('error' in auth) {
    return jsonResponse(allowedOrigin, { error: auth.error }, auth.status);
  }

  const db = getDb();

  if (req.method === 'GET') {
    const rows = await db
      .select({
        pinId: schema.aiPins.id,
        note: schema.aiPins.note,
        createdAt: schema.aiPins.createdAt,
        messageId: schema.aiMessages.id,
        content: schema.aiMessages.content,
        conversationId: schema.aiMessages.conversationId,
      })
      .from(schema.aiPins)
      .innerJoin(schema.aiMessages, eq(schema.aiPins.messageId, schema.aiMessages.id))
      .where(eq(schema.aiPins.userId, auth.user.id))
      .orderBy(desc(schema.aiPins.createdAt))
      .limit(200);
    return jsonResponse(allowedOrigin, { pins: rows });
  }

  if (req.method === 'POST') {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonResponse(allowedOrigin, { error: 'Invalid JSON body' }, 400);
    }
    const messageId =
      typeof body === 'object' && body !== null && 'messageId' in body && typeof (body as { messageId: unknown }).messageId === 'string'
        ? (body as { messageId: string }).messageId.trim()
        : '';
    const note =
      typeof body === 'object' && body !== null && 'note' in body && typeof (body as { note: unknown }).note === 'string'
        ? (body as { note: string }).note.trim().slice(0, 300)
        : '';
    if (!messageId) return jsonResponse(allowedOrigin, { error: 'messageId missing' }, 400);

    const [m] = await db
      .select({ id: schema.aiMessages.id, conversationId: schema.aiMessages.conversationId })
      .from(schema.aiMessages)
      .where(eq(schema.aiMessages.id, messageId));
    if (!m) return jsonResponse(allowedOrigin, { error: 'Not found' }, 404);
    const [c] = await db
      .select({ id: schema.aiConversations.id })
      .from(schema.aiConversations)
      .where(and(eq(schema.aiConversations.id, m.conversationId), eq(schema.aiConversations.userId, auth.user.id)));
    if (!c) return jsonResponse(allowedOrigin, { error: 'Forbidden' }, 403);

    try {
      const [pin] = await db
        .insert(schema.aiPins)
        .values({ userId: auth.user.id, messageId, note: note || null })
        .returning({ id: schema.aiPins.id });
      return jsonResponse(allowedOrigin, { pinId: pin?.id ?? null }, 201);
    } catch {
      return jsonResponse(allowedOrigin, { error: 'Unavailable' }, 503);
    }
  }

  if (req.method === 'DELETE') {
    const url = new URL(req.url);
    const id = (url.searchParams.get('id') ?? '').trim();
    if (!id) return jsonResponse(allowedOrigin, { error: 'id missing' }, 400);
    await db.delete(schema.aiPins).where(and(eq(schema.aiPins.id, id), eq(schema.aiPins.userId, auth.user.id)));
    return new Response(null, {
      status: 204,
      headers: { 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  return jsonResponse(allowedOrigin, { error: 'Method not allowed' }, 405);
}

