import { desc, inArray } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireAdminAuth, requireAdminRole } from '../../lib/adminAuth';
import { getAllowedOrigin } from '../../lib/cors';
import { corsJson, corsOptions } from '../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const ok = requireAdminRole(ctx, 'viewer');
  if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });

  const url = new URL(req.url);
  const statusParam = String(url.searchParams.get('status') ?? '').trim();
  const statuses = statusParam === 'resolved' ? (['resolved'] as const) : statusParam === 'open' ? (['open'] as const) : (['open', 'resolved'] as const);

  const db = getDb();
  const convs = await db
    .select()
    .from(schema.crmConversations)
    .where(inArray(schema.crmConversations.status, statuses))
    .orderBy(desc(schema.crmConversations.updatedAt))
    .limit(200);

  const contactIds = convs.map((c) => c.contactId).filter(Boolean) as string[];
  const userIds = convs.map((c) => c.userId).filter(Boolean) as string[];
  const contacts = contactIds.length
    ? await db.select().from(schema.contacts).where(inArray(schema.contacts.id, contactIds)).limit(500)
    : [];
  const users = userIds.length ? await db.select().from(schema.users).where(inArray(schema.users.id, userIds)).limit(500) : [];

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
