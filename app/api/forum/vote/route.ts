import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import {
  FORUM_VOTE_PROBE,
  parseForumVotePostBody,
  validateForumVotePostBody,
} from '../../lib/forumVote';
import { jsonResponse, optionsResponse } from '@/api/lib/http';
import { ensureAllowedOrigin } from '@/api/lib/originGuard';
import { awardPoints } from '@/api/lib/points';

export { FORUM_VOTE_PATH, FORUM_VOTE_PROBE } from '@/api/lib/forumVote';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, FORUM_VOTE_PROBE.methods.join(', '), 'Content-Type, Authorization');
  }
  if (req.method !== 'POST') return jsonResponse(req, { error: 'Method not allowed' }, 405);

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse(req, { error: ctx.error }, ctx.status);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: FORUM_VOTE_PROBE.invalidJsonError }, 400);
  }

  const parsed = parseForumVotePostBody(body);
  const validation = validateForumVotePostBody(parsed);
  if (!validation.ok) return jsonResponse(req, { error: validation.error }, validation.status);

  const { targetType, targetId, value } = validation;
  const db = getDb();
  if (targetType === 'post') {
    const [post] = await db
      .select({ id: schema.forumPosts.id, status: schema.forumPosts.status })
      .from(schema.forumPosts)
      .where(eq(schema.forumPosts.id, targetId))
      .limit(1);
    if (!post || post.status !== 'visible') return jsonResponse(req, { error: FORUM_VOTE_PROBE.notFoundError }, 404);
  } else {
    const [comment] = await db
      .select({ id: schema.forumComments.id, status: schema.forumComments.status })
      .from(schema.forumComments)
      .where(eq(schema.forumComments.id, targetId))
      .limit(1);
    if (!comment || comment.status !== 'visible') return jsonResponse(req, { error: FORUM_VOTE_PROBE.notFoundError }, 404);
  }

  if (value === 0) {
    await db
      .delete(schema.forumVotes)
      .where(
        and(
          eq(schema.forumVotes.userId, ctx.user.id),
          eq(schema.forumVotes.targetType, targetType),
          eq(schema.forumVotes.targetId, targetId),
        ),
      );
    return jsonResponse(req, { ok: true, value: 0 });
  }

  await db
    .insert(schema.forumVotes)
    .values({ userId: ctx.user.id, targetType, targetId, value, createdAt: new Date() })
    .onConflictDoUpdate({
      target: [schema.forumVotes.userId, schema.forumVotes.targetType, schema.forumVotes.targetId],
      set: { value, createdAt: new Date() },
    });

  const reason = value > 0 ? 'forum_like' : 'forum_dislike';
  await awardPoints(db, ctx.user.id, value > 0 ? FORUM_VOTE_PROBE.likePoints : FORUM_VOTE_PROBE.dislikePoints, reason, {
    dedupeKey: `${reason}:${targetType}:${targetId}`,
  });

  return jsonResponse(req, { ok: true, value });
}