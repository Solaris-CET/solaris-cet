import { eq } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { requireAdminAuth } from '../../../lib/adminAuth';
import { getAllowedOrigin } from '../../../lib/cors';
import { decryptApiKeyWithEnvSecrets } from '../../../lib/crypto';
import { corsJson, corsOptions, readJson } from '../../../lib/http';
import { verifyTotpCode } from '../../../lib/totp';

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

  const body = await readJson(req).catch(() => null);
  const code =
    typeof body === 'object' && body !== null && 'code' in body && typeof (body as { code?: unknown }).code === 'string'
      ? (body as { code: string }).code.trim()
      : '';
  if (!/^\d{6}$/.test(code)) return corsJson(req, 400, { error: 'Invalid code' });

  const db = getDb();
  const [admin] = await db.select().from(schema.adminAccounts).where(eq(schema.adminAccounts.id, ctx.admin.id)).limit(1);
  const secretEnc = String(admin?.mfaSecretEncrypted ?? '').trim();
  if (!secretEnc) return corsJson(req, 412, { error: 'MFA not initialized' });

  let secret: string;
  try {
    secret = await decryptApiKeyWithEnvSecrets(secretEnc);
  } catch {
    return corsJson(req, 500, { error: 'Crypto not configured' });
  }

  if (!verifyTotpCode(secret, code, Date.now(), 1)) return corsJson(req, 401, { error: 'Invalid code' });
  await db.update(schema.adminAccounts).set({ mfaEnabledAt: new Date(), updatedAt: new Date() }).where(eq(schema.adminAccounts.id, ctx.admin.id));
  return corsJson(req, 200, { ok: true });
}

