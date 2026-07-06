import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireAuth } from '../../lib/auth';
import { jsonResponse, optionsResponse } from '../../lib/http';
import { ensureAllowedOrigin } from '../../lib/originGuard';
import { awardPoints } from '../../lib/points';

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
  const valueRaw =
    typeof body === 'object' && body !== null && 'value' in body && typeof (body as { value?: unknown }).value === 'number'
      ? (body as { value: number }).value
      : NaN;

  if (!isTargetType(targetTypeRaw)) return jsonResponse(req, { error: 'Invalid targetType' }, 400);
  if (!targetId) return jsonResponse(req, { error: 'Invalid targetId' }, 400);

  const value = valueRaw === 1 || valueRaw === -1 || valueRaw === 0 ? valueRaw : NaN;
  if (!Number.isFinite(value)) return jsonResponse(req, { error: 'Invalid vote value' }, 400);

  const db = getDb();
  if (targetTypeRaw === 'post') {
    const [post] = await db
      .select({ id: schema.forumPosts.id, status: schema.forumPosts.status })
      .from(schema.forumPosts)
      .where(eq(schema.forumPosts.id, targetId))
      .limit(1);
    if (!post || post.status !== 'visible') return jsonResponse(req, { error: 'Not found' }, 404);
  } else {
    const [comment] = await db
      .select({ id: schema.forumComments.id, status: schema.forumComments.status })
      .from(schema.forumComments)
      .where(eq(schema.forumComments.id, targetId))
      .limit(1);
    if (!comment || comment.status !== 'visible') return jsonResponse(req, { error: 'Not found' }, 404);
  }

  if (value === 0) {
    await db
      .delete(schema.forumVotes)
      .where(
        and(
          eq(schema.forumVotes.userId, ctx.user.id),
          eq(schema.forumVotes.targetType, targetTypeRaw),
          eq(schema.forumVotes.targetId, targetId),
        ),
      );
    return jsonResponse(req, { ok: true, value: 0 });
  }

  await db
    .insert(schema.forumVotes)
    .values({ userId: ctx.user.id, targetType: targetTypeRaw, targetId, value, createdAt: new Date() })
    .onConflictDoUpdate({
      target: [schema.forumVotes.userId, schema.forumVotes.targetType, schema.forumVotes.targetId],
      set: { value, createdAt: new Date() },
    });

  const reason = value > 0 ? 'forum_like' : 'forum_dislike';
  await awardPoints(db, ctx.user.id, value > 0 ? 1 : 0, reason, { dedupeKey: `${reason}:${targetTypeRaw}:${targetId}` });

  return jsonResponse(req, { ok: true, value });
}
