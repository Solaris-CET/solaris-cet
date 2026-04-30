import crypto from 'node:crypto';

import { eq, sql } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { writeAdminAudit } from '../../lib/adminAudit';
import { clientIp } from '../../lib/clientIp';
import { getAllowedOrigin } from '../../lib/cors';
import { decryptApiKeyWithEnvSecrets } from '../../lib/crypto';
import { corsJson, corsOptions, isValidEmail, readJson } from '../../lib/http';
import { getJwtSecretsFromEnv, signJwt } from '../../lib/jwt';
import { hashPassword, verifyPassword } from '../../lib/password';
import { withRateLimit } from '../../lib/rateLimit';
import { verifyTotpCode } from '../../lib/totp';

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

  const limited = await withRateLimit(req, allowedOrigin, { keyPrefix: 'admin-login', limit: 10, windowSeconds: 60 });
  if (limited) return limited;

  const body = await readJson(req).catch(() => null);
  const emailRaw =
    typeof body === 'object' && body !== null && 'email' in body && typeof (body as { email?: unknown }).email === 'string'
      ? (body as { email: string }).email
      : '';
  const password =
    typeof body === 'object' && body !== null && 'password' in body && typeof (body as { password?: unknown }).password === 'string'
      ? (body as { password: string }).password
      : '';
  const mfaCode =
    typeof body === 'object' && body !== null && 'mfaCode' in body && typeof (body as { mfaCode?: unknown }).mfaCode === 'string'
      ? (body as { mfaCode: string }).mfaCode.trim()
      : '';
  const email = normalizeEmail(emailRaw);
  if (!isValidEmail(email)) return corsJson(req, 400, { error: 'Email invalid' });
  if (password.length < 10 || password.length > 200) return corsJson(req, 400, { error: 'Parolă invalidă' });

  const secrets = getJwtSecretsFromEnv();
  const secret = secrets[0];
  if (!secret) return corsJson(req, 501, { error: 'JWT not configured' });

  const db = getDb();
  const [row] = await db.select({ c: sql<number>`count(*)`.as('c') }).from(schema.adminAccounts);
  const adminCount = typeof row?.c === 'number' ? row.c : 0;
  if (adminCount === 0) {
    const bootstrapEmail = normalizeEmail(String(process.env.ADMIN_BOOTSTRAP_EMAIL ?? ''));
    const bootstrapPassword = String(process.env.ADMIN_BOOTSTRAP_PASSWORD ?? '');
    if (bootstrapEmail && bootstrapPassword && email === bootstrapEmail && password === bootstrapPassword) {
      const passwordHash = await hashPassword(password);
      const [created] = await db
        .insert(schema.adminAccounts)
        .values({ email, passwordHash, role: 'admin' })
        .returning();
      await writeAdminAudit(req, null, 'ADMIN_BOOTSTRAP', 'admin_account', created.id, { email });
    }
  }

  const [admin] = await db.select().from(schema.adminAccounts).where(eq(schema.adminAccounts.email, email));
  if (!admin || admin.disabledAt) return corsJson(req, 401, { error: 'Unauthorized' });
  const ok = await verifyPassword(password, admin.passwordHash);
  if (!ok) return corsJson(req, 401, { error: 'Unauthorized' });

  if (admin.role === 'admin' && admin.mfaEnabledAt && admin.mfaSecretEncrypted) {
    if (!/^\d{6}$/.test(mfaCode)) return corsJson(req, 401, { error: 'MFA required' });
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
      expiresAt: new Date(Date.now() + JWT_TTL_SECONDS * 1000),
    })
    .returning();

  await db.update(schema.adminAccounts).set({ lastLoginAt: new Date() }).where(eq(schema.adminAccounts.id, admin.id));
  const token = await signJwt({ kind: 'admin', sub: admin.id, sid: session.id }, secret, JWT_TTL_SECONDS);
  await writeAdminAudit(req, { admin, sessionId: session.id }, 'ADMIN_LOGIN', 'admin_account', admin.id, {
    email,
    sid: session.id,
    nonce: crypto.randomBytes(8).toString('hex'),
  });
  return corsJson(req, 200, { token, admin: { id: admin.id, email: admin.email, role: admin.role } });
}
