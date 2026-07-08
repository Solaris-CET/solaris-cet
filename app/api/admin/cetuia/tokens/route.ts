import { and, eq, sql } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { writeAdminAudit } from '@/api/lib/adminAudit';
import { guardAdminRoute } from '@/api/lib/adminAuth';
import {
  ADMIN_CETUIA_TOKENS_PROBE,
  computeCetuiaAvailableCount,
  isCetuiaTokensDatabaseConfigured,
  parseCetuiaTokenId,
  parseCetuiaTokenOwner,
  parseCetuiaTokenStatus,
} from '../../../lib/adminCetuiaTokens';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';

export { ADMIN_CETUIA_TOKENS_PATH, ADMIN_CETUIA_TOKENS_PROBE } from '@/api/lib/adminCetuiaTokens';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, PUT, OPTIONS');
  if (!isCetuiaTokensDatabaseConfigured()) return corsJson(req, 503, { error: 'Unavailable' });

  const ctx = await guardAdminRoute(req, { minRole: (m) => (m === 'PUT' ? ADMIN_CETUIA_TOKENS_PROBE.putMinRole : ADMIN_CETUIA_TOKENS_PROBE.getMinRole) });
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const db = getDb();

  if (req.method === 'GET') {
    const id = parseCetuiaTokenId(new URL(req.url).searchParams.get('id'));
    if (id) {
      const [row] = await db.select().from(schema.cetuiaTokens).where(eq(schema.cetuiaTokens.id, id));
      return corsJson(req, 200, { ok: true, token: row ?? null });
    }

    const [counts] = await db
      .select({
        total: sql<number>`count(*)`.as('total'),
        sold: sql<number>`sum(case when ${schema.cetuiaTokens.status} = 'sold' then 1 else 0 end)`.as('sold'),
        reserved: sql<number>`sum(case when ${schema.cetuiaTokens.status} = 'reserved' then 1 else 0 end)`.as('reserved'),
      })
      .from(schema.cetuiaTokens);

    const sold = counts?.sold ?? 0;
    const reserved = counts?.reserved ?? 0;
    const total = counts?.total ?? 0;
    const available = computeCetuiaAvailableCount(total, sold, reserved);

    return corsJson(req, 200, {
      ok: true,
      counts: { total, available, reserved, sold },
      max: ADMIN_CETUIA_TOKENS_PROBE.totalTokens,
    });
  }

  if (req.method === 'PUT') {
    const body = await readJson(req).catch(() => null);
    const id =
      typeof body === 'object' && body !== null
        ? parseCetuiaTokenId(String((body as { id?: unknown }).id ?? ''))
        : null;
    const status =
      typeof body === 'object' && body !== null
        ? parseCetuiaTokenStatus((body as { status?: unknown }).status)
        : null;
    const owner =
      typeof body === 'object' && body !== null
        ? parseCetuiaTokenOwner((body as { ownerWalletAddress?: unknown }).ownerWalletAddress)
        : null;

    if (!id || !status) return corsJson(req, 400, { error: 'Valori invalide' });

    const [existing] = await db.select().from(schema.cetuiaTokens).where(eq(schema.cetuiaTokens.id, id));
    const next = { status, ownerWalletAddress: owner, updatedAt: new Date() };

    if (existing) {
      await db.update(schema.cetuiaTokens).set(next).where(eq(schema.cetuiaTokens.id, id));
    } else {
      await db.insert(schema.cetuiaTokens).values({ id, ...next }).onConflictDoNothing();
      await db.update(schema.cetuiaTokens).set(next).where(eq(schema.cetuiaTokens.id, id));
    }

    await writeAdminAudit(req, ctx, ADMIN_CETUIA_TOKENS_PROBE.auditAction, 'cetuia_tokens', String(id), {
      prev: existing ? { status: existing.status, ownerWalletAddress: existing.ownerWalletAddress } : null,
      next,
    });

    const [row] = await db
      .select()
      .from(schema.cetuiaTokens)
      .where(and(eq(schema.cetuiaTokens.id, id), eq(schema.cetuiaTokens.status, status)));
    return corsJson(req, 200, { ok: true, token: row ?? null });
  }

  return corsJson(req, 405, { error: 'Method not allowed' });
}