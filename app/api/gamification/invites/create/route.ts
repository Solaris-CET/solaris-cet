import crypto from 'node:crypto';

import { getDb, schema } from '../../../../db/client';
import { requireUser } from '../../../lib/authUser';
import { corsJson, corsOptions, readJson } from '../../../lib/http';

export const config = { runtime: 'nodejs' };

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) return corsJson(req, 401, { error: 'Unauthorized' });

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    body = null;
  }
  const maxUsesRaw = Number((body as { maxUses?: unknown })?.maxUses ?? 1);
  const maxUses = Number.isFinite(maxUsesRaw) ? Math.max(1, Math.min(20, Math.floor(maxUsesRaw))) : 1;

  const token = crypto.randomBytes(24).toString('base64url');
  const tokenHash = sha256Hex(token);

  const db = getDb();
  await db.insert(schema.userInvites).values({
    tokenHash,
    createdByUserId: user.id,
    maxUses,
    usedCount: 0,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return corsJson(req, 200, { ok: true, token, maxUses });
}

