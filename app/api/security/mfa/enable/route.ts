import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import { decryptApiKeyWithEnvSecrets } from '@/api/lib/crypto';
import { corsJson, optionsResponse, readJson } from '@/api/lib/http';
import { verifyTotpCode } from '@/api/lib/totp';
import { USER_MFA_ENABLE_PROBE } from '@/api/lib/userMfaEnable';
import {
  isValidMfaTotpCode,
  MFA_TOTP_WINDOW,
  notifyUserSecurityTelegram,
  parseMfaTotpPostCode,
} from '../../../lib/userMfaShared';

export { USER_MFA_ENABLE_PATH, USER_MFA_ENABLE_PROBE } from '@/api/lib/userMfaEnable';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsResponse(req, USER_MFA_ENABLE_PROBE.methods.join(', '));
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await requireAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const body = await readJson(req).catch(() => null);
  const code = parseMfaTotpPostCode(body);
  if (!isValidMfaTotpCode(code)) return corsJson(req, 400, { error: USER_MFA_ENABLE_PROBE.invalidCodeError });

  const db = getDb();
  const [mfa] = await db.select().from(schema.userMfa).where(eq(schema.userMfa.userId, ctx.user.id)).limit(1);
  const blob = (mfa?.secretEncrypted ?? '').trim();
  if (!blob) return corsJson(req, USER_MFA_ENABLE_PROBE.setupRequiredStatus, { error: USER_MFA_ENABLE_PROBE.setupRequiredError });

  let secret: string;
  try {
    secret = await decryptApiKeyWithEnvSecrets(blob);
  } catch {
    return corsJson(req, USER_MFA_ENABLE_PROBE.notConfiguredStatus, { error: USER_MFA_ENABLE_PROBE.notConfiguredError });
  }

  const ok = verifyTotpCode(secret, code, Date.now(), MFA_TOTP_WINDOW);
  if (!ok) return corsJson(req, USER_MFA_ENABLE_PROBE.invalidMfaStatus, { error: USER_MFA_ENABLE_PROBE.invalidMfaError });

  await db
    .update(schema.userMfa)
    .set({ enabledAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.userMfa.userId, ctx.user.id));

  try {
    await notifyUserSecurityTelegram(ctx.user.id, USER_MFA_ENABLE_PROBE.telegramMessage);
  } catch {
    void 0;
  }

  return corsJson(req, 200, { ok: true });
}