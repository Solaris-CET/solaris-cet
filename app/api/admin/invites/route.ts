import crypto from 'node:crypto';

import { and, desc, eq, isNull } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { writeAdminAudit } from '@/api/lib/adminAudit';
import { guardAdminRoute } from '@/api/lib/adminAuth';
import {
  ADMIN_INVITES_PROBE,
  isInviteUuid,
  parseInviteCreateBody,
  parseInviteDeleteId,
  resolveInviteStatus,
} from '../../lib/adminInvites';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';
import { sha256Hex } from '@/api/lib/nodeCrypto';
import { ensureAllowedOrigin } from '@/api/lib/originGuard';
import { withRateLimit } from '@/api/lib/rateLimit';

export { ADMIN_INVITES_PATH, ADMIN_INVITES_PROBE } from '@/api/lib/adminInvites';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, POST, DELETE, OPTIONS');

  const originCheck = ensureAllowedOrigin(req);
  if (originCheck instanceof Response) return originCheck;
  const { allowedOrigin } = originCheck;

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: ADMIN_INVITES_PROBE.rateLimitKey,
    limit: 30,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const ctx = await guardAdminRoute(req, { minRole: ADMIN_INVITES_PROBE.minRole });
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const db = getDb();
  if (req.method === 'GET') {
    const rows = await db
      .select()
      .from(schema.adminInvites)
      .orderBy(desc(schema.adminInvites.createdAt))
      .limit(ADMIN_INVITES_PROBE.maxListRows);
    return corsJson(req, 200, {
      invites: rows.map((r) => ({
        id: r.id,
        role: r.role,
        maxUses: r.maxUses,
        usedCount: r.usedCount,
        expiresAt: r.expiresAt,
        revokedAt: r.revokedAt,
        createdAt: r.createdAt,
        status: resolveInviteStatus(r),
      })),
    });
  }

  if (req.method === 'POST') {
    const contentType = req.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return corsJson(req, 415, { error: 'Content-Type must be application/json' });
    }
    const parsed = parseInviteCreateBody(await readJson(req).catch(() => null));
    if (!parsed) return corsJson(req, 400, { error: 'Role invalid' });
    const { role, maxUses, expiresInHours } = parsed;
    const token = crypto.randomBytes(24).toString('base64url');
    const tokenHash = sha256Hex(token);
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    const [invite] = await db
      .insert(schema.adminInvites)
      .values({ tokenHash, role, maxUses, usedCount: 0, expiresAt, createdByAdminId: ctx.admin.id })
      .returning();
    await writeAdminAudit(req, ctx, 'INVITE_CREATED', 'admin_invite', invite.id, { role, maxUses, expiresAt });
    return corsJson(req, 200, {
      invite: {
        id: invite.id,
        role: invite.role,
        maxUses: invite.maxUses,
        usedCount: invite.usedCount,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      },
      token,
    });
  }

  if (req.method === 'DELETE') {
    const id = parseInviteDeleteId(new URL(req.url).searchParams);
    if (!id) return corsJson(req, 400, { error: 'Missing id' });
    if (!isInviteUuid(id)) return corsJson(req, 400, { error: 'Invalid id' });
    const [existing] = await db.select().from(schema.adminInvites).where(eq(schema.adminInvites.id, id));
    if (!existing) return corsJson(req, 404, { error: 'Not found' });
    await db
      .update(schema.adminInvites)
      .set({ revokedAt: new Date() })
      .where(and(eq(schema.adminInvites.id, id), isNull(schema.adminInvites.revokedAt)));
    await writeAdminAudit(req, ctx, 'INVITE_REVOKED', 'admin_invite', id);
    return corsJson(req, 200, { ok: true });
  }

  return corsJson(req, 405, { error: 'Method not allowed' });
}