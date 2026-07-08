import crypto from 'node:crypto';

import { eq, sql } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { writeAdminAudit } from '@/api/lib/adminAudit';
import {
  ADMIN_LOGIN_PROBE,
  isAdminLoginMfaCodeValid,
  isAdminLoginPasswordValid,
  normalizeAdminLoginEmail,
  parseAdminLoginBody,
} from '../../lib/adminLogin';
import { clientIp } from '@/api/lib/clientIp';
import { getAllowedOrigin } from '@/api/lib/cors';
import { decryptApiKeyWithEnvSecrets } from '@/api/lib/crypto';
import { corsJson, corsOptions, isValidEmail, readJson } from '@/api/lib/http';
import { getJwtSecretsFromEnv, signJwt } from '@/api/lib/jwt';
import { hashPassword, verifyPassword } from '@/api/lib/password';
import { withRateLimit } from '@/api/lib/rateLimit';
import { verifyTotpCode } from '@/api/lib/totp';

export { ADMIN_LOGIN_PATH, ADMIN_LOGIN_PROBE } from '@/api/lib/adminLogin';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });

  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: ADMIN_LOGIN_PROBE.rateLimitKey,
    limit: 10,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const { email, password, mfaCode } = parseAdminLoginBody(await readJson(req).catch(() => null));
  if (!isValidEmail(email)) return corsJson(req, 400, { error: 'Email invalid' });
  if (!isAdminLoginPasswordValid(password)) return corsJson(req, 400, { error: 'Parolă invalidă' });

  const secrets = getJwtSecretsFromEnv();
  const secret = secrets[0];
  if (!secret) return corsJson(req, 501, { error: 'JWT not configured' });

  const db = getDb();
  const [row] = await db.select({ c: sql<number>`count(*)`.as('c') }).from(schema.adminAccounts);
  const adminCount = typeof row?.c === 'number' ? row.c : 0;
  if (adminCount === 0) {
    const bootstrapEmail = normalizeAdminLoginEmail(String(process.env.ADMIN_BOOTSTRAP_EMAIL ?? ''));
    const bootstrapPassword = String(process.env.ADMIN_BOOTSTRAP_PASSWORD ?? '');
    if (bootstrapEmail && bootstrapPassword && email === bootstrapEmail && password === bootstrapPassword) {
      const passwordHash = await hashPassword(password);
      const [created] = await db
        .insert(schema.adminAccounts)
        .values({ email, passwordHash, role: 'admin' })
        .returning();
      await writeAdminAudit(req, null, ADMIN_LOGIN_PROBE.bootstrapAuditAction, 'admin_account', created.id, { email });
    }
  }

  const [admin] = await db.select().from(schema.adminAccounts).where(eq(schema.adminAccounts.email, email));
  if (!admin || admin.disabledAt) return corsJson(req, 401, { error: 'Unauthorized' });
  const ok = await verifyPassword(password, admin.passwordHash);
  if (!ok) return corsJson(req, 401, { error: 'Unauthorized' });

  if (admin.role === 'admin' && admin.mfaEnabledAt && admin.mfaSecretEncrypted) {
    if (!isAdminLoginMfaCodeValid(mfaCode)) return corsJson(req, 401, { error: 'MFA required' });
    let secret: string;
    try {
      secret = await decryptApiKeyWithEnvSecrets(admin.mfaSecretEncrypted);
    } catch {
      return corsJson(req, 500, { error: 'Crypto not configured' });
    }
    const mfaOk = verifyTotpCode(secret, mfaCode, Date.now(), 1);
    if (!mfaOk) return corsJson(req, 401, { error: 'MFA invalid' });
  }

  const [session] = await db
    .insert(schema.adminSessions)
    .values({
      adminId: admin.id,
      ip: clientIp(req),
      userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
      expiresAt: new Date(Date.now() + ADMIN_LOGIN_PROBE.jwtTtlSeconds * 1000),
    })
    .returning();

  await db.update(schema.adminAccounts).set({ lastLoginAt: new Date() }).where(eq(schema.adminAccounts.id, admin.id));
  const token = await signJwt({ kind: 'admin', sub: admin.id, sid: session.id }, secret, ADMIN_LOGIN_PROBE.jwtTtlSeconds);
  await writeAdminAudit(req, { admin, sessionId: session.id }, ADMIN_LOGIN_PROBE.auditAction, 'admin_account', admin.id, {
    email,
    sid: session.id,
    nonce: crypto.randomBytes(8).toString('hex'),
  });
  return corsJson(req, 200, { token, admin: { id: admin.id, email: admin.email, role: admin.role } });
}
