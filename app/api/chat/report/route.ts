import { getDb, schema } from '../../../db/client';
import { requireAuth } from '../../lib/auth';
import { jsonResponse, optionsResponse } from '../../lib/http';
import { ensureAllowedOrigin } from '../../lib/originGuard';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, 'POST, OPTIONS', 'Content-Type, Authorization');
  }
  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse(req, { error: ctx.error }, ctx.status);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: 'Invalid JSON body' }, 400);
  }

  const messageId =
    typeof body === 'object' && body !== null && 'messageId' in body && typeof (body as { messageId?: unknown }).messageId === 'string'
      ? (body as { messageId: string }).messageId.trim()
      : '';
  const reason =
    typeof body === 'object' && body !== null && 'reason' in body && typeof (body as { reason?: unknown }).reason === 'string'
      ? (body as { reason: string }).reason.trim().slice(0, 80)
      : '';
  const details =
    typeof body === 'object' && body !== null && 'details' in body && typeof (body as { details?: unknown }).details === 'string'
      ? (body as { details: string }).details.trim().slice(0, 300)
      : null;

  if (!messageId || !reason) return jsonResponse(req, { error: 'Invalid report' }, 400);
  const db = getDb();
  await db.insert(schema.chatReports).values({ messageId, reporterUserId: ctx.user.id, reason, details });
  return jsonResponse(req, { ok: true });
}

