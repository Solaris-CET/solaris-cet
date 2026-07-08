import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import { decryptApiKeyWithEnvSecrets } from '@/api/lib/crypto';
import { corsJson, optionsResponse, readJson } from '@/api/lib/http';
import { verifyTotpCode } from '@/api/lib/totp';
import { USER_MFA_DISABLE_PROBE } from '@/api/lib/userMfaDisable';
import {
  isValidMfaTotpCode,
  MFA_TOTP_WINDOW,
  notifyUserSecurityTelegram,
  parseMfaTotpPostCode,
} from '../../../lib/userMfaShared';

export { USER_MFA_DISABLE_PATH, USER_MFA_DISABLE_PROBE } from '@/api/lib/userMfaDisable';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsResponse(req, USER_MFA_DISABLE_PROBE.methods.join(', '));
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await requireAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const body = await readJson(req).catch(() => null);
  const code = parseMfaTotpPostCode(body);
  if (!isValidMfaTotpCode(code)) return corsJson(req, 400, { error: USER_MFA_DISABLE_PROBE.invalidCodeError });

  const db = getDb();
  const [mfa] = await db.select().from(schema.userMfa).where(eq(schema.userMfa.userId, ctx.user.id)).limit(1);
  const enabled = Boolean(mfa?.enabledAt);
  const blob = (mfa?.secretEncrypted ?? '').trim();
  if (!enabled || !blob) return corsJson(req, USER_MFA_DISABLE_PROBE.notEnabledStatus, { error: USER_MFA_DISABLE_PROBE.notEnabledError });

  let secret: string;
  try {
    secret = await decryptApiKeyWithEnvSecrets(blob);
  } catch {
    return corsJson(req, USER_MFA_DISABLE_PROBE.notConfiguredStatus, { error: USER_MFA_DISABLE_PROBE.notConfiguredError });
  }

  const ok = verifyTotpCode(secret, code, Date.now(), MFA_TOTP_WINDOW);
  if (!ok) return corsJson(req, USER_MFA_DISABLE_PROBE.invalidMfaStatus, { error: USER_MFA_DISABLE_PROBE.invalidMfaError });

  await db
    .update(schema.userMfa)
    .set({ enabledAt: null, secretEncrypted: null, updatedAt: new Date() })
    .where(eq(schema.userMfa.userId, ctx.user.id));

  try {
    await notifyUserSecurityTelegram(ctx.user.id, USER_MFA_DISABLE_PROBE.telegramMessage);
  } catch {
    void 0;
  }

  return corsJson(req, 200, { ok: true });
}