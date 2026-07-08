import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import {
  FORUM_COMMENTS_PROBE,
  isValidForumCommentPost,
  parseForumCommentPostBody,
  parseForumCommentsPostId,
  parseForumCommentsSort,
} from '../../lib/forumComments';
import { canModerateForumRole, canViewForumContent } from '@/api/lib/forumCommon';
import { jsonResponse, optionsResponse } from '@/api/lib/http';
import { ensureAllowedOrigin } from '@/api/lib/originGuard';
import { awardPoints } from '@/api/lib/points';

export { FORUM_COMMENTS_PATH, FORUM_COMMENTS_PROBE } from '@/api/lib/forumComments';

export const config = { runtime: 'nodejs' };

async function canViewPost(
  req: Request,
  postId: string,
): Promise<{ ok: true; viewerId: string | null; canModerate: boolean; authorUserId: string } | { ok: false; res: Response }> {
  const db = getDb();
  const [post] = await db
    .select({ id: schema.forumPosts.id, status: schema.forumPosts.status, authorUserId: schema.forumPosts.authorUserId })
    .from(schema.forumPosts)
    .where(eq(schema.forumPosts.id, postId))
    .limit(1);
  if (!post) return { ok: false, res: jsonResponse(req, { error: FORUM_COMMENTS_PROBE.notFoundError }, 404) };

  const ctx = await requireAuth(req);
  const isAuthed = !('error' in ctx);
  const canModerate = isAuthed && canModerateForumRole(ctx.user.role);
  const viewerId = isAuthed ? ctx.user.id : null;
  if (!canViewForumContent(post.status, viewerId, post.authorUserId, canModerate)) {
    return { ok: false, res: jsonResponse(req, { error: FORUM_COMMENTS_PROBE.notFoundError }, 404) };
  }
  return { ok: true, viewerId, canModerate, authorUserId: post.authorUserId };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req, FORUM_COMMENTS_PROBE.methods.join(', '), 'Content-Type, Authorization');
  }

  const url = new URL(req.url);
  const postId = parseForumCommentsPostId(url.searchParams);
  if (!postId) return jsonResponse(req, { error: FORUM_COMMENTS_PROBE.missingPostIdError }, 400);

  if (req.method === 'GET') {
    const access = await canViewPost(req, postId);
    if (!access.ok) return access.res;

    const db = getDb();
    const sort = parseForumCommentsSort(url.searchParams);
    const orderBy = sort === FORUM_COMMENTS_PROBE.topSort ? desc(schema.forumComments.createdAt) : asc(schema.forumComments.createdAt);

    const rows = await db
      .select({
        id: schema.forumComments.id,
        postId: schema.forumComments.postId,
        authorUserId: schema.forumComments.authorUserId,
        parentCommentId: schema.forumComments.parentCommentId,
        body: schema.forumComments.body,
        status: schema.forumComments.status,
        createdAt: schema.forumComments.createdAt,
        updatedAt: schema.forumComments.updatedAt,
        authorWalletAddress: schema.users.walletAddress,
      })
      .from(schema.forumComments)
      .leftJoin(schema.users, eq(schema.forumComments.authorUserId, schema.users.id))
      .where(and(eq(schema.forumComments.postId, postId), eq(schema.forumComments.status, 'visible')))
      .orderBy(orderBy)
      .limit(FORUM_COMMENTS_PROBE.listLimit);

    const ids = rows.map((r) => r.id);
    const scores =
      ids.length > 0
        ? await db
            .select({
              targetId: schema.forumVotes.targetId,
              score: sql<number>`coalesce(sum(${schema.forumVotes.value}), 0)`.as('score'),
            })
            .from(schema.forumVotes)
            .where(and(eq(schema.forumVotes.targetType, FORUM_COMMENTS_PROBE.voteTargetType), inArray(schema.forumVotes.targetId, ids)))
            .groupBy(schema.forumVotes.targetId)
        : [];
    const viewerVotes =
      access.viewerId && ids.length > 0
        ? await db
            .select({ targetId: schema.forumVotes.targetId, value: schema.forumVotes.value })
            .from(schema.forumVotes)
            .where(
              and(
                eq(schema.forumVotes.userId, access.viewerId),
                eq(schema.forumVotes.targetType, FORUM_COMMENTS_PROBE.voteTargetType),
                inArray(schema.forumVotes.targetId, ids),
              ),
            )
        : [];

    const scoreById = new Map(scores.map((r) => [r.targetId, r.score]));
    const viewerVoteById = new Map(viewerVotes.map((r) => [r.targetId, r.value]));

    return jsonResponse(req, {
      comments: rows.map((c) => ({
        id: c.id,
        postId: c.postId,
        parentCommentId: c.parentCommentId,
        body: c.body,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        author: { userId: c.authorUserId, walletAddress: c.authorWalletAddress ?? null },
        score: scoreById.get(c.id) ?? 0,
        viewerVote: access.viewerId ? viewerVoteById.get(c.id) ?? 0 : 0,
      })),
      canModerate: access.canModerate,
    });
  }

  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;
  if (req.method !== 'POST') return jsonResponse(req, { error: 'Method not allowed' }, 405);

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse(req, { error: ctx.error }, ctx.status);

  const access = await canViewPost(req, postId);
  if (!access.ok) return access.res;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: FORUM_COMMENTS_PROBE.invalidJsonError }, 400);
  }

  const parsed = parseForumCommentPostBody(body);
  if (!isValidForumCommentPost(parsed)) return jsonResponse(req, { error: FORUM_COMMENTS_PROBE.invalidCommentError }, 400);

  const db = getDb();
  if (parsed.parentCommentId) {
    const [parent] = await db
      .select({ id: schema.forumComments.id })
      .from(schema.forumComments)
      .where(and(eq(schema.forumComments.id, parsed.parentCommentId), eq(schema.forumComments.postId, postId)))
      .limit(1);
    if (!parent) return jsonResponse(req, { error: FORUM_COMMENTS_PROBE.invalidParentError }, 400);
  }

  const now = new Date();
  const [comment] = await db
    .insert(schema.forumComments)
    .values({
      postId,
      authorUserId: ctx.user.id,
      parentCommentId: parsed.parentCommentId || null,
      body: parsed.body,
      status: 'visible',
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await db
    .update(schema.forumPosts)
    .set({ updatedAt: now, lastActivityAt: now })
    .where(eq(schema.forumPosts.id, postId));

  await awardPoints(db, ctx.user.id, FORUM_COMMENTS_PROBE.commentPoints, 'forum_comment', { dedupeKey: `forum_comment:${comment.id}` });
  return jsonResponse(req, { ok: true, commentId: comment.id });
}