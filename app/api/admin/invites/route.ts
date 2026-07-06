import crypto from 'node:crypto';

import { and, desc, eq, isNull } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { writeAdminAudit } from '../../lib/adminAudit';
import { type AdminRole,requireAdminAuth, requireAdminRole } from '../../lib/adminAuth';
import { corsJson, corsOptions, readJson } from '../../lib/http';
import { sha256Hex } from '../../lib/nodeCrypto';
import { ensureAllowedOrigin } from '../../lib/originGuard';
import { withRateLimit } from '../../lib/rateLimit';

export const config = { runtime: 'nodejs' };

function normalizeRole(role: unknown): AdminRole | null {
  if (role === 'admin' || role === 'editor' || role === 'viewer') return role;
  return null;
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, POST, DELETE, OPTIONS');

  const originCheck = ensureAllowedOrigin(req);
  if (originCheck instanceof Response) return originCheck;
  const { allowedOrigin } = originCheck;

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: 'admin-invites',
    limit: 30,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const adminOk = requireAdminRole(ctx, 'admin');
  if (!adminOk.ok) return corsJson(req, adminOk.status, { error: adminOk.error });

  const db = getDb();
  if (req.method === 'GET') {
    const now = new Date();
    const rows = await db
      .select()
      .from(schema.adminInvites)
      .orderBy(desc(schema.adminInvites.createdAt))
      .limit(200);
    return corsJson(req, 200, {
      invites: rows.map((r) => ({
        id: r.id,
        role: r.role,
        maxUses: r.maxUses,
        usedCount: r.usedCount,
        expiresAt: r.expiresAt,
        revokedAt: r.revokedAt,
        createdAt: r.createdAt,
        status:
          r.revokedAt
            ? 'revoked'
            : r.expiresAt && r.expiresAt.getTime() <= now.getTime()
              ? 'expired'
              : r.usedCount >= r.maxUses
                ? 'used'
                : 'active',
      })),
    });
  }

  if (req.method === 'POST') {
    const contentType = req.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return corsJson(req, 415, { error: 'Content-Type must be application/json' });
    }
    const body = await readJson(req).catch(() => null);
    const role =
      typeof body === 'object' && body !== null && 'role' in body ? normalizeRole((body as { role?: unknown }).role) : null;
    const maxUses =
      typeof body === 'object' && body !== null && 'maxUses' in body && typeof (body as { maxUses?: unknown }).maxUses === 'number'
        ? Math.floor((body as { maxUses: number }).maxUses)
        : 1;
    const expiresInHours =
      typeof body === 'object' && body !== null && 'expiresInHours' in body && typeof (body as { expiresInHours?: unknown }).expiresInHours === 'number'
        ? Math.floor((body as { expiresInHours: number }).expiresInHours)
        : 168;
    if (!role) return corsJson(req, 400, { error: 'Role invalid' });
    const mu = Math.max(1, Math.min(50, maxUses));
    const expH = Math.max(1, Math.min(24 * 30, expiresInHours));
    const token = crypto.randomBytes(24).toString('base64url');
    const tokenHash = sha256Hex(token);
    const expiresAt = new Date(Date.now() + expH * 60 * 60 * 1000);
    const [invite] = await db
      .insert(schema.adminInvites)
      .values({ tokenHash, role, maxUses: mu, usedCount: 0, expiresAt, createdByAdminId: ctx.admin.id })
      .returning();
    await writeAdminAudit(req, ctx, 'INVITE_CREATED', 'admin_invite', invite.id, { role, maxUses: mu, expiresAt });
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
    const url = new URL(req.url);
    const id = url.searchParams.get('id') ?? '';
    if (!id) return corsJson(req, 400, { error: 'Missing id' });
    if (!isUuid(id)) return corsJson(req, 400, { error: 'Invalid id' });
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
