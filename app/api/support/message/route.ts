import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireUser } from '../../lib/authUser';
import { getAllowedOrigin } from '../../lib/cors';
import { corsJson, corsOptions, readJson } from '../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req);
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: 'Invalid JSON' });
  }

  const conversationId =
    typeof (body as { conversationId?: unknown })?.conversationId === 'string'
      ? (body as { conversationId: string }).conversationId.trim()
      : '';
  const message = typeof (body as { message?: unknown })?.message === 'string' ? (body as { message: string }).message.trim() : '';
  if (!conversationId) return corsJson(req, 400, { error: 'Missing conversationId' });
  if (!message || message.length > 2000) return corsJson(req, 400, { error: 'Invalid message' });

  const db = getDb();
  const [conv] = await db
    .select()
    .from(schema.crmConversations)
    .where(and(eq(schema.crmConversations.id, conversationId), eq(schema.crmConversations.userId, user.id)))
    .limit(1);
  if (!conv) return corsJson(req, 404, { error: 'Not found' });

  const [m] = await db
    .insert(schema.crmMessages)
    .values({ conversationId: conv.id, sender: 'user', body: message })
    .returning();
  await db.update(schema.crmConversations).set({ updatedAt: new Date() }).where(eq(schema.crmConversations.id, conv.id));

  return corsJson(req, 200, { ok: true, message: { id: m.id } });
}

