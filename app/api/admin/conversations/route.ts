import { desc, inArray } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import {
  ADMIN_CONVERSATIONS_PROBE,
  parseConversationsStatusFilter,
} from '../../lib/adminConversations';
import { guardAdminRoute } from '@/api/lib/adminAuth';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions } from '@/api/lib/http';

export { ADMIN_CONVERSATIONS_PATH, ADMIN_CONVERSATIONS_PROBE } from '@/api/lib/adminConversations';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await guardAdminRoute(req, { minRole: ADMIN_CONVERSATIONS_PROBE.minRole });
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const statuses = parseConversationsStatusFilter(new URL(req.url).searchParams);
  const db = getDb();
  const convs = await db
    .select()
    .from(schema.crmConversations)
    .where(inArray(schema.crmConversations.status, statuses))
    .orderBy(desc(schema.crmConversations.updatedAt))
    .limit(ADMIN_CONVERSATIONS_PROBE.maxListRows);

  const contactIds = convs.map((c) => c.contactId).filter(Boolean) as string[];
  const userIds = convs.map((c) => c.userId).filter(Boolean) as string[];
  const contacts = contactIds.length
    ? await db.select().from(schema.contacts).where(inArray(schema.contacts.id, contactIds)).limit(ADMIN_CONVERSATIONS_PROBE.maxRelatedRows)
    : [];
  const users = userIds.length
    ? await db.select().from(schema.users).where(inArray(schema.users.id, userIds)).limit(ADMIN_CONVERSATIONS_PROBE.maxRelatedRows)
    : [];

  const byContact = new Map(contacts.map((c) => [c.id, c]));
  const byUser = new Map(users.map((u) => [u.id, u]));

  return corsJson(req, 200, {
    ok: true,
    conversations: convs.map((c) => {
      const contact = c.contactId ? byContact.get(c.contactId) : null;
      const u = c.userId ? byUser.get(c.userId) : null;
      return {
        id: c.id,
        status: c.status,
        updatedAt: c.updatedAt.toISOString(),
        createdAt: c.createdAt.toISOString(),
        pageUrl: c.pageUrl,
        email: contact?.email ?? null,
        name: contact?.name ?? null,
        walletAddress: u?.walletAddress ?? null,
      };
    }),
  });
}