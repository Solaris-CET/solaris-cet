import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAdminAuth } from '@/api/lib/adminAuth';
import {
  ADMIN_MFA_DISABLE_PROBE,
  isValidMfaTotpCode,
  parseMfaTotpCode,
} from '../../../lib/adminMfaDisable';
import { getAllowedOrigin } from '@/api/lib/cors';
import { decryptApiKeyWithEnvSecrets } from '@/api/lib/crypto';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';
import { verifyTotpCode } from '@/api/lib/totp';

export { ADMIN_MFA_DISABLE_PATH, ADMIN_MFA_DISABLE_PROBE } from '@/api/lib/adminMfaDisable';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });

  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  if ((ctx.admin.role as string) !== ADMIN_MFA_DISABLE_PROBE.minRole) return corsJson(req, 403, { error: 'Forbidden' });

  const code = parseMfaTotpCode(await readJson(req).catch(() => null));
  if (!isValidMfaTotpCode(code)) return corsJson(req, 400, { error: 'Invalid code' });

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
  await db
    .update(schema.adminAccounts)
    .set({ mfaEnabledAt: null, mfaSecretEncrypted: null, updatedAt: new Date() })
    .where(eq(schema.adminAccounts.id, ctx.admin.id));
  return corsJson(req, 200, { ok: true });
}