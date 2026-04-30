import { eq } from 'drizzle-orm';

import { getDb, schema } from '../../db/client';
import { clientIp } from './clientIp';
import { getJwtSecretsFromEnv, verifyJwtWithSecrets } from './jwt';

export type AdminAuthContext = {
  admin: typeof schema.adminAccounts.$inferSelect;
  sessionId: string;
};

export type AdminRole = 'admin' | 'editor' | 'viewer';

function bearerToken(req: Request): string | null {
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  return token ? token : null;
}

function roleRank(role: AdminRole): number {
  if (role === 'admin') return 3;
  if (role === 'editor') return 2;
  return 1;
}

export function requireAdminRole(
  ctx: AdminAuthContext,
  minRole: AdminRole,
): { ok: true } | { ok: false; status: number; error: string } {
  const r = (ctx.admin.role as AdminRole) || 'viewer';
  if (roleRank(r) >= roleRank(minRole)) return { ok: true };
  return { ok: false, status: 403, error: 'Forbidden' };
}

export async function requireAdminAuth(
  req: Request,
): Promise<AdminAuthContext | { status: number; error: string }> {
  const token = bearerToken(req);
  const secrets = getJwtSecretsFromEnv();
  if (!token || secrets.length === 0) return { status: 401, error: 'Unauthorized' };
  const decoded = verifyJwtWithSecrets(token, secrets);
  if (!decoded || decoded.kind !== 'admin') return { status: 401, error: 'Unauthorized' };
  const adminId = typeof decoded.sub === 'string' ? decoded.sub : null;
  const sid = typeof decoded.sid === 'string' ? decoded.sid : null;
  if (!adminId || !sid) return { status: 401, error: 'Unauthorized' };

  const db = getDb();
  const [session] = await db.select().from(schema.adminSessions).where(eq(schema.adminSessions.id, sid));
  if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    return { status: 401, error: 'Unauthorized' };
  }
  if (session.adminId !== adminId) return { status: 401, error: 'Unauthorized' };

  const ip = clientIp(req);
  const ua = req.headers.get('user-agent')?.slice(0, 300) ?? null;
  if ((session.ip && session.ip !== ip) || (session.userAgent && ua && session.userAgent !== ua)) {
    await db
      .update(schema.adminSessions)
      .set({ revokedAt: new Date() })
      .where(eq(schema.adminSessions.id, session.id));
    return { status: 401, error: 'Unauthorized' };
  }

  const [admin] = await db.select().from(schema.adminAccounts).where(eq(schema.adminAccounts.id, adminId));
  if (!admin || admin.disabledAt) return { status: 401, error: 'Unauthorized' };
  await db
    .update(schema.adminSessions)
    .set({ lastUsedAt: new Date() })
    .where(eq(schema.adminSessions.id, session.id));
  return { admin, sessionId: session.id };
}
