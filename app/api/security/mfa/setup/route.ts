import { getDb, schema } from '@/db/client';
import { encryptForDb, requireAuth } from '@/api/lib/auth';
import { corsJson, optionsResponse } from '@/api/lib/http';
import { buildOtpAuthUrl, generateTotpSecretBase32 } from '@/api/lib/totp';
import { buildUserMfaAccountName, USER_MFA_SETUP_PROBE } from '@/api/lib/userMfaSetup';

export { USER_MFA_SETUP_PATH, USER_MFA_SETUP_PROBE } from '@/api/lib/userMfaSetup';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsResponse(req, USER_MFA_SETUP_PROBE.methods.join(', '));
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await requireAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const secretBase32 = generateTotpSecretBase32(USER_MFA_SETUP_PROBE.secretBytes);
  const secretEncrypted = await encryptForDb(secretBase32);
  if (!secretEncrypted) return corsJson(req, USER_MFA_SETUP_PROBE.notConfiguredStatus, { error: USER_MFA_SETUP_PROBE.notConfiguredError });

  const db = getDb();
  await db
    .insert(schema.userMfa)
    .values({ userId: ctx.user.id, secretEncrypted, enabledAt: null, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.userMfa.userId,
      set: { secretEncrypted, enabledAt: null, updatedAt: new Date() },
    });

  const accountName = buildUserMfaAccountName(ctx.user);
  const otpauthUrl = buildOtpAuthUrl({
    issuer: USER_MFA_SETUP_PROBE.totpIssuer,
    accountName,
    secretBase32,
  });

  return corsJson(req, 200, { ok: true, secretBase32, otpauthUrl });
}