import { eq } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { requireAdminAuth } from '../../../lib/adminAuth';
import { getAllowedOrigin } from '../../../lib/cors';
import { encryptApiKeyWithEnvPrimary } from '../../../lib/crypto';
import { corsJson, corsOptions } from '../../../lib/http';
import { buildOtpAuthUrl, generateTotpSecretBase32 } from '../../../lib/totp';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });

  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  if ((ctx.admin.role as string) !== 'admin') return corsJson(req, 403, { error: 'Forbidden' });

  const secret = generateTotpSecretBase32(20);
  const encrypted = await encryptApiKeyWithEnvPrimary(secret);
  if (!encrypted) return corsJson(req, 500, { error: 'Crypto not configured' });

  const db = getDb();
  await db
    .update(schema.adminAccounts)
    .set({ mfaSecretEncrypted: encrypted, mfaEnabledAt: null, updatedAt: new Date() })
    .where(eq(schema.adminAccounts.id, ctx.admin.id));

  const issuer = 'Solaris Admin';
  const otpauthUrl = buildOtpAuthUrl({ issuer, accountName: ctx.admin.email, secretBase32: secret });
  return corsJson(req, 200, { ok: true, secret, otpauthUrl });
}

