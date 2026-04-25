import { eq } from 'drizzle-orm';
import { getDb, schema } from '../../db/client';
import { decryptApiKey, encryptApiKey } from './crypto';
import { getJwtSecretsFromEnv, verifyJwtWithSecrets } from './jwt';
import { verifyTotpCode } from './totp';

export type AuthContext = {
  user: typeof schema.users.$inferSelect;
  sid: string | null;
  mfaEnabled: boolean;
};

export function bearerToken(req: Request): string | null {
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  return token ? token : null;
}

export async function requireAuth(req: Request): Promise<AuthContext | { error: string; status: number }> {
  const token = bearerToken(req);
  const secrets = getJwtSecretsFromEnv();
  if (!token || secrets.length === 0) return { error: 'Unauthorized', status: 401 };
  const decoded = verifyJwtWithSecrets(token, secrets);
  if (!decoded) return { error: 'Unauthorized', status: 401 };

  const userId = typeof decoded.sub === 'string' ? decoded.sub : null;
  const wallet = typeof decoded.wallet === 'string' ? decoded.wallet : null;
  const sid = typeof decoded.sid === 'string' ? decoded.sid : null;
  if (!userId && !wallet) return { error: 'Unauthorized', status: 401 };

  const db = getDb();

  if (sid) {
    const [s] = await db.select().from(schema.sessions).where(eq(schema.sessions.id, sid));
    if (!s || s.revokedAt || s.expiresAt.getTime() <= Date.now()) return { error: 'Unauthorized', status: 401 };
    await db.update(schema.sessions).set({ lastUsedAt: new Date() }).where(eq(schema.sessions.id, sid));
  }

  let user: typeof schema.users.$inferSelect | null = null;
  if (userId) {
    const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
    user = u ?? null;
  } else if (wallet) {
    const [u] = await db.select().from(schema.users).where(eq(schema.users.walletAddress, wallet));
    user = u ?? null;
  }
  if (!user) return { error: 'Unauthorized', status: 401 };

  const [mfa] = await db.select().from(schema.userMfa).where(eq(schema.userMfa.userId, user.id));
  const mfaEnabled = Boolean(mfa?.enabledAt);
  return { user, sid, mfaEnabled };
}

export function requireAdmin(ctx: AuthContext): { ok: true } | { ok: false; error: string; status: number } {
  if (ctx.user.role === 'admin') return { ok: true };
  return { ok: false, error: 'Forbidden', status: 403 };
}

export async function requireAdminMfa(
  req: Request,
  ctx: AuthContext,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  if (ctx.user.role !== 'admin') return { ok: false, error: 'Forbidden', status: 403 };
  const db = getDb();
  const [mfa] = await db.select().from(schema.userMfa).where(eq(schema.userMfa.userId, ctx.user.id));
  if (!mfa?.enabledAt) return { ok: false, error: 'MFA required', status: 412 };

  const code = (req.headers.get('x-mfa-code') ?? '').trim();
  if (!/^\d{6}$/.test(code)) return { ok: false, error: 'MFA required', status: 401 };

  const secretEnc = (mfa.secretEncrypted ?? '').trim();
  const encSecret = String(process.env.ENCRYPTION_SECRET ?? '').trim();
  if (!encSecret) return { ok: false, error: 'Not configured', status: 501 };
  if (!secretEnc) return { ok: false, error: 'MFA required', status: 412 };

  let secret: string;
  try {
    secret = await decryptApiKey(encSecret, secretEnc);
  } catch {
    return { ok: false, error: 'MFA invalid', status: 401 };
  }

  const ok = verifyTotpCode(secret, code, Date.now(), 1);
  if (!ok) return { ok: false, error: 'MFA invalid', status: 401 };
  return { ok: true };
}

export async function encryptForDb(plaintext: string): Promise<string | null> {
  const encSecret = String(process.env.ENCRYPTION_SECRET ?? '').trim();
  if (!encSecret) return null;
  return encryptApiKey(encSecret, plaintext);
}

