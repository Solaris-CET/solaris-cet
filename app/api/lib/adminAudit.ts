import { getDb, schema } from '../../db/client';
import type { AdminAuthContext } from './adminAuth';
import { clientIp } from './clientIp';

export async function writeAdminAudit(
  req: Request,
  ctx: AdminAuthContext | null,
  action: string,
  targetType?: string | null,
  targetId?: string | null,
  meta?: unknown,
): Promise<void> {
  try {
    const db = getDb();
    await db.insert(schema.adminAuditLogs).values({
      actorAdminId: ctx?.admin.id ?? null,
      action,
      targetType: targetType ?? null,
      targetId: targetId ?? null,
      meta: (meta ?? {}) as never,
      ip: clientIp(req),
      userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
    });
  } catch {
    void 0;
  }
}
