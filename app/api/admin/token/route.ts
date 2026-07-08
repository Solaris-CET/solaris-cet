import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { writeAdminAudit } from '@/api/lib/adminAudit';
import { guardAdminRoute } from '@/api/lib/adminAuth';
import { ADMIN_TOKEN_PROBE, ADMIN_TOKEN_SYMBOL, parseTokenPutBody } from '@/api/lib/adminToken';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';

export { ADMIN_TOKEN_PATH, ADMIN_TOKEN_PROBE } from '@/api/lib/adminToken';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, PUT, OPTIONS');
  const ctx = await guardAdminRoute(req, { minRole: (m) => (m === 'PUT' ? ADMIN_TOKEN_PROBE.putMinRole : ADMIN_TOKEN_PROBE.getMinRole) });
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const db = getDb();

  if (req.method === 'GET') {
    const [row] = await db.select().from(schema.cmsTokenData).where(eq(schema.cmsTokenData.symbol, ADMIN_TOKEN_SYMBOL));
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
    const body = await readJson(req).catch(() => null);
    const parsed = parseTokenPutBody(body);
    if (!parsed.ok) return corsJson(req, 400, { error: parsed.error });
    const { priceUsd, totalSupply, circulatingSupply } = parsed;
    const [existing] = await db.select().from(schema.cmsTokenData).where(eq(schema.cmsTokenData.symbol, ADMIN_TOKEN_SYMBOL));
    if (existing) {
      await db
        .update(schema.cmsTokenData)
        .set({ priceUsd, totalSupply, circulatingSupply, updatedAt: new Date(), updatedByAdminId: ctx.admin.id })
        .where(eq(schema.cmsTokenData.id, existing.id));
    } else {
      await db.insert(schema.cmsTokenData).values({
        symbol: ADMIN_TOKEN_SYMBOL,
        priceUsd,
        totalSupply,
        circulatingSupply,
        updatedAt: new Date(),
        updatedByAdminId: ctx.admin.id,
      });
    }
    await writeAdminAudit(req, ctx, ADMIN_TOKEN_PROBE.auditAction, 'cms_token_data', ADMIN_TOKEN_SYMBOL, {
      priceUsd,
      totalSupply,
      circulatingSupply,
    });
    const [row] = await db.select().from(schema.cmsTokenData).where(eq(schema.cmsTokenData.symbol, ADMIN_TOKEN_SYMBOL));
    return corsJson(req, 200, { token: row });
  }

  return corsJson(req, 405, { error: 'Method not allowed' });
}