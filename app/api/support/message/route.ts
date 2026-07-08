import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireUser } from '@/api/lib/authUser';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';
import {
  isValidSupportMessage,
  parseSupportMessageBody,
  SUPPORT_MESSAGE_PROBE,
} from '../../lib/supportMessage';

export { SUPPORT_MESSAGE_PATH, SUPPORT_MESSAGE_PROBE } from '@/api/lib/supportMessage';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req);
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: SUPPORT_MESSAGE_PROBE.unauthenticatedStatus,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: SUPPORT_MESSAGE_PROBE.invalidJsonError });
  }

  const parsed = parseSupportMessageBody(body);
  if (!parsed?.conversationId) return corsJson(req, 400, { error: SUPPORT_MESSAGE_PROBE.missingConversationIdError });
  if (!isValidSupportMessage(parsed.message)) return corsJson(req, 400, { error: SUPPORT_MESSAGE_PROBE.invalidMessageError });

  const db = getDb();
  const [conv] = await db
    .select()
    .from(schema.crmConversations)
    .where(and(eq(schema.crmConversations.id, parsed.conversationId), eq(schema.crmConversations.userId, user.id)))
    .limit(1);
  if (!conv) return corsJson(req, SUPPORT_MESSAGE_PROBE.notFoundStatus, { error: SUPPORT_MESSAGE_PROBE.notFoundError });

  const [m] = await db
    .insert(schema.crmMessages)
    .values({ conversationId: conv.id, sender: SUPPORT_MESSAGE_PROBE.sender, body: parsed.message })
    .returning();
  await db.update(schema.crmConversations).set({ updatedAt: new Date() }).where(eq(schema.crmConversations.id, conv.id));

  return corsJson(req, 200, { ok: true, message: { id: m.id } });
}