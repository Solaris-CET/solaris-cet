import { and, eq, gt, isNull, or, sql } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { writeAdminAudit } from '../../lib/adminAudit';
import { clientIp } from '../../lib/clientIp';
import { getAllowedOrigin } from '../../lib/cors';
import { corsJson, corsOptions, isValidEmail, readJson } from '../../lib/http';
import { getJwtSecretsFromEnv, signJwt } from '../../lib/jwt';
import { sha256Hex } from '../../lib/nodeCrypto';
import { hashPassword } from '../../lib/password';
import { withRateLimit } from '../../lib/rateLimit';

export const config = { runtime: 'nodejs' };

const JWT_TTL_SECONDS = 60 * 60 * 8;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });

  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const limited = await withRateLimit(req, allowedOrigin, { keyPrefix: 'admin-signup', limit: 10, windowSeconds: 60 });
  if (limited) return limited;

  const body = await readJson(req).catch(() => null);
  const token =
    typeof body === 'object' && body !== null && 'token' in body && typeof (body as { token?: unknown }).token === 'string'
      ? (body as { token: string }).token.trim()
      : '';
  const emailRaw =
    typeof body === 'object' && body !== null && 'email' in body && typeof (body as { email?: unknown }).email === 'string'
      ? (body as { email: string }).email
      : '';
  const password =
    typeof body === 'object' && body !== null && 'password' in body && typeof (body as { password?: unknown }).password === 'string'
      ? (body as { password: string }).password
      : '';
  const email = normalizeEmail(emailRaw);
  if (!token || token.length < 16 || token.length > 300) return corsJson(req, 400, { error: 'Token invalid' });
  if (!isValidEmail(email)) return corsJson(req, 400, { error: 'Email invalid' });
  if (password.length < 10 || password.length > 200) return corsJson(req, 400, { error: 'Parolă invalidă' });

  const secrets = getJwtSecretsFromEnv();
  const secret = secrets[0];
  if (!secret) return corsJson(req, 501, { error: 'JWT not configured' });

  const db = getDb();
  const tokenHash = sha256Hex(token);
  const now = new Date();
  const passwordHash = await hashPassword(password);
  const ip = clientIp(req);
  const userAgent = req.headers.get('user-agent')?.slice(0, 300) ?? null;
  const sessionExpiresAt = new Date(Date.now() + JWT_TTL_SECONDS * 1000);

  const result = await db
    .transaction(async (tx) => {
      const claimed = await tx
        .update(schema.adminInvites)
        .set({ usedCount: sql`${schema.adminInvites.usedCount} + 1` })
        .where(
          and(
            eq(schema.adminInvites.tokenHash, tokenHash),
            isNull(schema.adminInvites.revokedAt),
            or(isNull(schema.adminInvites.expiresAt), gt(schema.adminInvites.expiresAt, now)),
            sql`${schema.adminInvites.usedCount} < ${schema.adminInvites.maxUses}`,
          ),
        )
        .returning({ id: schema.adminInvites.id, role: schema.adminInvites.role });
      if (claimed.length === 0) return { ok: false as const, status: 401 as const, error: 'Unauthorized' };
      const inviteId = claimed[0].id;
      const inviteRole = claimed[0].role;

      const [created] = await tx
        .insert(schema.adminAccounts)
        .values({ email, passwordHash, role: inviteRole })
        .returning();
      if (!created) throw new Error('create_failed');

      const [session] = await tx
        .insert(schema.adminSessions)
        .values({
          adminId: created.id,
          ip,
          userAgent,
          expiresAt: sessionExpiresAt,
        })
        .returning({ id: schema.adminSessions.id });
      if (!session?.id) throw new Error('session_failed');

      return { ok: true as const, admin: created, sessionId: session.id, inviteId };
    })
    .catch((e: unknown) => {
      if (e instanceof Error && /duplicate|unique/i.test(e.message)) {
        return { ok: false as const, status: 409 as const, error: 'Email already exists' };
      }
      if (e instanceof Error && e.message === 'create_failed') {
        return { ok: false as const, status: 500 as const, error: 'Create failed' };
      }
      if (e instanceof Error && e.message === 'session_failed') {
        return { ok: false as const, status: 500 as const, error: 'Session failed' };
      }
      return { ok: false as const, status: 500 as const, error: 'Internal error' };
    });

  if (!result.ok) return corsJson(req, result.status, { error: result.error });

  const jwt = await signJwt({ kind: 'admin', sub: result.admin.id, sid: result.sessionId }, secret, JWT_TTL_SECONDS);
  await writeAdminAudit(req, { admin: result.admin, sessionId: result.sessionId }, 'ADMIN_SIGNUP', 'admin_account', result.admin.id, {
    email,
    role: result.admin.role,
    inviteId: result.inviteId,
  });
  return corsJson(req, 200, {
    token: jwt,
    admin: { id: result.admin.id, email: result.admin.email, role: result.admin.role },
  });
}
