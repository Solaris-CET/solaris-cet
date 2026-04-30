import { getDb, schema } from '../../../../db/client';
import { encryptForDb, requireAuth } from '../../../lib/auth';
import { corsJson, optionsResponse } from '../../../lib/http';
import { buildOtpAuthUrl, generateTotpSecretBase32 } from '../../../lib/totp';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return optionsResponse(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await requireAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const secretBase32 = generateTotpSecretBase32(20);
  const secretEncrypted = await encryptForDb(secretBase32);
  if (!secretEncrypted) return corsJson(req, 501, { error: 'Not configured' });

  const db = getDb();
  await db
    .insert(schema.userMfa)
    .values({ userId: ctx.user.id, secretEncrypted, enabledAt: null, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.userMfa.userId,
      set: { secretEncrypted, enabledAt: null, updatedAt: new Date() },
    });

  const accountName = (ctx.user.walletAddress ?? ctx.user.id).trim();
  const issuer = 'Solaris CET';
  const otpauthUrl = buildOtpAuthUrl({ issuer, accountName, secretBase32 });

  return corsJson(req, 200, { ok: true, secretBase32, otpauthUrl });
}
