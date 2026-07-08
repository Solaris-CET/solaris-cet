import crypto from 'node:crypto';

import { getDb, schema } from '@/db/client';
import { requireUser } from '@/api/lib/authUser';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';
import { INVITES_CREATE_PROBE, parseInvitesCreateMaxUses } from '@/api/lib/invitesCreate';

export { INVITES_CREATE_PATH, INVITES_CREATE_PROBE } from '@/api/lib/invitesCreate';

export const config = { runtime: 'nodejs' };

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, INVITES_CREATE_PROBE.methods.join(', '));
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) return corsJson(req, INVITES_CREATE_PROBE.unauthenticatedStatus, { error: 'Unauthorized' });

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    body = null;
  }
  const maxUses = parseInvitesCreateMaxUses(body);

  const token = crypto.randomBytes(24).toString('base64url');
  const tokenHash = sha256Hex(token);

  const db = getDb();
  await db.insert(schema.userInvites).values({
    tokenHash,
    createdByUserId: user.id,
    maxUses,
    usedCount: 0,
    expiresAt: new Date(Date.now() + INVITES_CREATE_PROBE.inviteExpiryDays * 24 * 60 * 60 * 1000),
  });

  return corsJson(req, 200, { ok: true, token, maxUses });
}