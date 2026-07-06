import { eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { writeAdminAudit } from '../../lib/adminAudit';
import { requireAdminAuth, requireAdminRole } from '../../lib/adminAuth';
import { corsJson, corsOptions, readJson } from '../../lib/http';

export const config = { runtime: 'nodejs' };

function asDecimalString(v: unknown): string | null {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;
    if (!/^[0-9]+(\.[0-9]+)?$/.test(s)) return null;
    if (s.length > 80) return null;
    return s;
  }
  return null;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, PUT, OPTIONS');
  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const db = getDb();

  if (req.method === 'GET') {
    const ok = requireAdminRole(ctx, 'viewer');
    if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });
    const [row] = await db.select().from(schema.cmsTokenData).where(eq(schema.cmsTokenData.symbol, 'CET'));
    return corsJson(req, 200, {
      token: row
        ? {
            symbol: row.symbol,
            priceUsd: row.priceUsd,
            totalSupply: row.totalSupply,
            circulatingSupply: row.circulatingSupply,
            updatedAt: row.updatedAt,
          }
        : null,
    });
  }

  if (req.method === 'PUT') {
    const ok = requireAdminRole(ctx, 'editor');
    if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });
    const body = await readJson(req).catch(() => null);
    const priceUsd = asDecimalString(typeof body === 'object' && body !== null ? (body as { priceUsd?: unknown }).priceUsd : null);
    const totalSupply = asDecimalString(typeof body === 'object' && body !== null ? (body as { totalSupply?: unknown }).totalSupply : null);
    const circulatingSupply = asDecimalString(
      typeof body === 'object' && body !== null ? (body as { circulatingSupply?: unknown }).circulatingSupply : null,
    );
    if (!priceUsd || !totalSupply || !circulatingSupply) return corsJson(req, 400, { error: 'Valori invalide' });
    const [existing] = await db.select().from(schema.cmsTokenData).where(eq(schema.cmsTokenData.symbol, 'CET'));
    if (existing) {
      await db
        .update(schema.cmsTokenData)
        .set({ priceUsd, totalSupply, circulatingSupply, updatedAt: new Date(), updatedByAdminId: ctx.admin.id })
        .where(eq(schema.cmsTokenData.id, existing.id));
    } else {
      await db.insert(schema.cmsTokenData).values({
        symbol: 'CET',
        priceUsd,
        totalSupply,
        circulatingSupply,
        updatedAt: new Date(),
        updatedByAdminId: ctx.admin.id,
      });
    }
    await writeAdminAudit(req, ctx, 'TOKEN_DATA_UPDATED', 'cms_token_data', 'CET', { priceUsd, totalSupply, circulatingSupply });
    const [row] = await db.select().from(schema.cmsTokenData).where(eq(schema.cmsTokenData.symbol, 'CET'));
    return corsJson(req, 200, { token: row });
  }

  return corsJson(req, 405, { error: 'Method not allowed' });
}

