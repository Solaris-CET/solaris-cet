import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAdminAuth } from '@/api/lib/adminAuth';
import { ADMIN_MFA_SETUP_PROBE } from '@/api/lib/adminMfaSetup';
import { getAllowedOrigin } from '@/api/lib/cors';
import { encryptApiKeyWithEnvPrimary } from '@/api/lib/crypto';
import { corsJson, corsOptions } from '@/api/lib/http';
import { buildOtpAuthUrl, generateTotpSecretBase32 } from '@/api/lib/totp';

export { ADMIN_MFA_SETUP_PATH, ADMIN_MFA_SETUP_PROBE } from '@/api/lib/adminMfaSetup';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });

  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  if ((ctx.admin.role as string) !== ADMIN_MFA_SETUP_PROBE.minRole) return corsJson(req, 403, { error: 'Forbidden' });

  const secret = generateTotpSecretBase32(ADMIN_MFA_SETUP_PROBE.secretBytes);
  const encrypted = await encryptApiKeyWithEnvPrimary(secret);
  if (!encrypted) return corsJson(req, 500, { error: 'Crypto not configured' });

  const db = getDb();
  await db
    .update(schema.adminAccounts)
    .set({ mfaSecretEncrypted: encrypted, mfaEnabledAt: null, updatedAt: new Date() })
    .where(eq(schema.adminAccounts.id, ctx.admin.id));

  const otpauthUrl = buildOtpAuthUrl({
    issuer: ADMIN_MFA_SETUP_PROBE.totpIssuer,
    accountName: ctx.admin.email,
    secretBase32: secret,
  });
  return corsJson(req, 200, { ok: true, secret, otpauthUrl });
}