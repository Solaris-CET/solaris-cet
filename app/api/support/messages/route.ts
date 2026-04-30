import { asc, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireUser } from '../../lib/authUser';
import { getAllowedOrigin } from '../../lib/cors';
import { corsJson, corsOptions } from '../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  const db = getDb();
  const [conv] = await db
    .select()
    .from(schema.crmConversations)
    .where(eq(schema.crmConversations.userId, user.id))
    .limit(1);
  if (!conv) return corsJson(req, 200, { ok: true, conversationId: null, messages: [] });

  const msgs = await db
    .select()
    .from(schema.crmMessages)
    .where(eq(schema.crmMessages.conversationId, conv.id))
    .orderBy(asc(schema.crmMessages.createdAt));

  return corsJson(req, 200, {
    ok: true,
    conversationId: conv.id,
    messages: msgs.map((m) => ({ id: m.id, sender: m.sender, body: m.body, createdAt: m.createdAt.toISOString() })),
  });
}
