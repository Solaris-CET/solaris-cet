import { and, eq, sql } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { writeAdminAudit } from '../../../lib/adminAudit';
import { requireAdminAuth, requireAdminRole } from '../../../lib/adminAuth';
import { corsJson, corsOptions, readJson } from '../../../lib/http';

export const config = { runtime: 'nodejs' };

const TOTAL_TOKENS = 9000;
const VALID_STATUSES = new Set(['available', 'reserved', 'sold'] as const);
type TokenStatus = typeof VALID_STATUSES extends Set<infer T> ? T : never;

function parseId(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return null;
  if (n < 1 || n > TOTAL_TOKENS) return null;
  return n;
}

function parseStatus(v: unknown): TokenStatus | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return VALID_STATUSES.has(s as TokenStatus) ? (s as TokenStatus) : null;
}

function parseOwner(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;
  if (s.length > 200) return null;
  return s;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, PUT, OPTIONS');
  if (!process.env.DATABASE_URL?.trim()) return corsJson(req, 503, { error: 'Unavailable' });

  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const db = getDb();

  if (req.method === 'GET') {
    const ok = requireAdminRole(ctx, 'viewer');
    if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });

    const url = new URL(req.url);
    const id = parseId(url.searchParams.get('id'));
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
    const available = Math.max(0, TOTAL_TOKENS - sold - reserved);

    return corsJson(req, 200, { ok: true, counts: { total, available, reserved, sold }, max: TOTAL_TOKENS });
  }

  if (req.method === 'PUT') {
    const ok = requireAdminRole(ctx, 'editor');
    if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });

    const body = await readJson(req).catch(() => null);
    const id = typeof body === 'object' && body !== null ? parseId(String((body as { id?: unknown }).id ?? '')) : null;
    const status = typeof body === 'object' && body !== null ? parseStatus((body as { status?: unknown }).status) : null;
    const owner = typeof body === 'object' && body !== null ? parseOwner((body as { ownerWalletAddress?: unknown }).ownerWalletAddress) : null;

    if (!id || !status) return corsJson(req, 400, { error: 'Valori invalide' });

    const [existing] = await db.select().from(schema.cetuiaTokens).where(eq(schema.cetuiaTokens.id, id));
    const next = { status, ownerWalletAddress: owner, updatedAt: new Date() };

    if (existing) {
      await db.update(schema.cetuiaTokens).set(next).where(eq(schema.cetuiaTokens.id, id));
    } else {
      await db.insert(schema.cetuiaTokens).values({ id, ...next }).onConflictDoNothing();
      await db.update(schema.cetuiaTokens).set(next).where(eq(schema.cetuiaTokens.id, id));
    }

    await writeAdminAudit(req, ctx, 'CETUIA_TOKEN_UPDATED', 'cetuia_tokens', String(id), {
      prev: existing ? { status: existing.status, ownerWalletAddress: existing.ownerWalletAddress } : null,
      next,
    });

    const [row] = await db.select().from(schema.cetuiaTokens).where(and(eq(schema.cetuiaTokens.id, id), eq(schema.cetuiaTokens.status, status)));
    return corsJson(req, 200, { ok: true, token: row ?? null });
  }

  return corsJson(req, 405, { error: 'Method not allowed' });
}
