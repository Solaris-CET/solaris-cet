import { eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireAuth } from '../../lib/auth';
import { jsonResponse, optionsResponse } from '../../lib/http';
import { ensureAllowedOrigin } from '../../lib/originGuard';

export const config = { runtime: 'nodejs' };

function requireModerator(role: string): boolean {
  return role === 'admin' || role === 'moderator';
}

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
  if (!requireModerator(ctx.user.role)) return jsonResponse(req, { error: 'Forbidden' }, 403);

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
  const action =
    typeof body === 'object' && body !== null && 'action' in body && typeof (body as { action?: unknown }).action === 'string'
      ? (body as { action: string }).action.trim()
      : '';
  if (!messageId || !action) return jsonResponse(req, { error: 'Invalid request' }, 400);

  const nextStatus = action === 'hide' ? 'hidden' : action === 'approve' ? 'visible' : null;
  if (!nextStatus) return jsonResponse(req, { error: 'Invalid action' }, 400);

  const db = getDb();
  await db
    .update(schema.chatMessages)
    .set({ status: nextStatus })
    .where(eq(schema.chatMessages.id, messageId));
  return jsonResponse(req, { ok: true, status: nextStatus });
}

