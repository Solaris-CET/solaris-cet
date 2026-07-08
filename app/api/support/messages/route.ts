import { asc, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireUser } from '@/api/lib/authUser';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions } from '@/api/lib/http';
import { buildSupportMessagesPayload, SUPPORT_MESSAGES_PROBE } from '@/api/lib/supportMessages';

export { SUPPORT_MESSAGES_PATH, SUPPORT_MESSAGES_PROBE } from '@/api/lib/supportMessages';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req, SUPPORT_MESSAGES_PROBE.methods.join(', '));
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: SUPPORT_MESSAGES_PROBE.unauthenticatedStatus,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  const db = getDb();
  const [conv] = await db
    .select()
    .from(schema.crmConversations)
    .where(eq(schema.crmConversations.userId, user.id))
    .limit(1);
  if (!conv) {
    return corsJson(req, 200, buildSupportMessagesPayload(SUPPORT_MESSAGES_PROBE.emptyConversationId, []));
  }

  const msgs = await db
    .select()
    .from(schema.crmMessages)
    .where(eq(schema.crmMessages.conversationId, conv.id))
    .orderBy(asc(schema.crmMessages.createdAt));

  return corsJson(req, 200, buildSupportMessagesPayload(conv.id, msgs));
}