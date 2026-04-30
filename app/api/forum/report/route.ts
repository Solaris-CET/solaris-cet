import { eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireAuth } from '../../lib/auth';
import { jsonResponse, optionsResponse } from '../../lib/http';
import { ensureAllowedOrigin } from '../../lib/originGuard';

export const config = { runtime: 'nodejs' };

type TargetType = 'post' | 'comment';

function isTargetType(v: string): v is TargetType {
  return v === 'post' || v === 'comment';
}

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, 'POST, OPTIONS', 'Content-Type, Authorization');
  }
  if (req.method !== 'POST') return jsonResponse(req, { error: 'Method not allowed' }, 405);

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse(req, { error: ctx.error }, ctx.status);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: 'Invalid JSON body' }, 400);
  }

  const targetTypeRaw =
    typeof body === 'object' && body !== null && 'targetType' in body && typeof (body as { targetType?: unknown }).targetType === 'string'
      ? (body as { targetType: string }).targetType.trim()
      : '';
  const targetId =
    typeof body === 'object' && body !== null && 'targetId' in body && typeof (body as { targetId?: unknown }).targetId === 'string'
      ? (body as { targetId: string }).targetId.trim()
      : '';
  const reason =
    typeof body === 'object' && body !== null && 'reason' in body && typeof (body as { reason?: unknown }).reason === 'string'
      ? (body as { reason: string }).reason.trim()
      : '';
  const details =
    typeof body === 'object' && body !== null && 'details' in body && typeof (body as { details?: unknown }).details === 'string'
      ? (body as { details: string }).details.trim()
      : '';

  if (!isTargetType(targetTypeRaw)) return jsonResponse(req, { error: 'Invalid targetType' }, 400);
  if (!targetId) return jsonResponse(req, { error: 'Invalid targetId' }, 400);
  if (!reason || reason.length > 120) return jsonResponse(req, { error: 'Invalid reason' }, 400);
  if (details.length > 800) return jsonResponse(req, { error: 'Invalid details' }, 400);

  const db = getDb();
  if (targetTypeRaw === 'post') {
    const [post] = await db.select({ id: schema.forumPosts.id }).from(schema.forumPosts).where(eq(schema.forumPosts.id, targetId));
    if (!post) return jsonResponse(req, { error: 'Not found' }, 404);
  } else {
    const [comment] = await db
      .select({ id: schema.forumComments.id })
      .from(schema.forumComments)
      .where(eq(schema.forumComments.id, targetId));
    if (!comment) return jsonResponse(req, { error: 'Not found' }, 404);
  }

  const [report] = await db
    .insert(schema.forumReports)
    .values({
      targetType: targetTypeRaw,
      targetId,
      reporterUserId: ctx.user.id,
      reason,
      details: details || null,
      createdAt: new Date(),
      resolvedAt: null,
      resolvedByUserId: null,
      resolution: null,
    })
    .returning();

  return jsonResponse(req, { ok: true, reportId: report.id });
}

